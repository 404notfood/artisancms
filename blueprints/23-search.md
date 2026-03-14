# Blueprint 23 - Recherche Full-Text

## Vue d'ensemble
ArtisanCMS utilise **Laravel Scout** pour la recherche full-text. En V1, le driver `database` suffit. Pour la production à grande échelle, Meilisearch est recommandé comme driver alternatif.

---

## 1. Installation

```bash
composer require laravel/scout
# Driver par défaut : database (MySQL FULLTEXT)

# Optionnel pour la production :
composer require meilisearch/meilisearch-php
```

---

## 2. Configuration

```php
// config/scout.php
'driver' => env('SCOUT_DRIVER', 'database'),

// config/cms.php — section search
'search' => [
    'enabled' => true,
    'driver' => env('SCOUT_DRIVER', 'database'),
    'min_query_length' => 2,
    'results_per_page' => 20,
    'searchable_types' => ['pages', 'posts'],  // Extensible par plugins
],
```

---

## 3. Models Searchable

```php
// app/Models/Page.php
use Laravel\Scout\Searchable;

class Page extends Model
{
    use SoftDeletes, HasSiteScope, Searchable;

    /**
     * Données indexées pour la recherche
     */
    public function toSearchableArray(): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'content_text' => $this->extractTextFromBlocks(), // Texte brut des blocs
            'meta_title' => $this->meta_title,
            'meta_description' => $this->meta_description,
            'status' => $this->status,
            'template' => $this->template,
            'published_at' => $this->published_at?->timestamp,
        ];
    }

    /**
     * Ne pas indexer les brouillons ou les pages supprimées
     */
    public function shouldBeSearchable(): bool
    {
        return $this->status === 'published' && !$this->trashed();
    }

    /**
     * Extraire le texte brut de l'arbre de blocs JSON
     */
    protected function extractTextFromBlocks(): string
    {
        if (!$this->content || !isset($this->content['blocks'])) {
            return '';
        }

        return $this->extractTextRecursive($this->content['blocks']);
    }

    protected function extractTextRecursive(array $blocks): string
    {
        $text = '';
        foreach ($blocks as $block) {
            // Extraire le texte selon le type de bloc
            if (isset($block['props']['text'])) {
                $text .= ' ' . strip_tags($block['props']['text']);
            }
            if (isset($block['props']['html'])) {
                $text .= ' ' . strip_tags($block['props']['html']);
            }
            // Récursion sur les enfants
            if (!empty($block['children'])) {
                $text .= $this->extractTextRecursive($block['children']);
            }
        }
        return trim($text);
    }
}
```

```php
// app/Models/Post.php — même pattern
use Laravel\Scout\Searchable;

class Post extends Model
{
    use SoftDeletes, HasSiteScope, Searchable;

    public function toSearchableArray(): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'excerpt' => $this->excerpt,
            'content_text' => $this->extractTextFromBlocks(),
            'status' => $this->status,
            'published_at' => $this->published_at?->timestamp,
        ];
    }

    public function shouldBeSearchable(): bool
    {
        return $this->status === 'published' && !$this->trashed();
    }
}
```

---

## 4. SearchService

```php
// app/Services/SearchService.php
<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Page;
use App\Models\Post;
use Illuminate\Support\Collection;

class SearchService
{
    /**
     * Recherche globale (pages + posts + plugins)
     */
    public function search(string $query, int $perPage = 20): array
    {
        if (strlen($query) < config('cms.search.min_query_length', 2)) {
            return ['results' => [], 'total' => 0];
        }

        $results = collect();

        // Chercher dans les pages
        if (in_array('pages', config('cms.search.searchable_types'))) {
            $pages = Page::search($query)
                ->query(fn ($q) => $q->with('author')->published())
                ->take($perPage)
                ->get()
                ->map(fn ($p) => [
                    'type' => 'page',
                    'id' => $p->id,
                    'title' => $p->title,
                    'slug' => $p->slug,
                    'excerpt' => $p->meta_description ?? Str::limit($p->extractTextFromBlocks(), 160),
                    'url' => "/{$p->slug}",
                    'published_at' => $p->published_at,
                ]);
            $results = $results->concat($pages);
        }

        // Chercher dans les posts
        if (in_array('posts', config('cms.search.searchable_types'))) {
            $posts = Post::search($query)
                ->query(fn ($q) => $q->with('author')->published())
                ->take($perPage)
                ->get()
                ->map(fn ($p) => [
                    'type' => 'post',
                    'id' => $p->id,
                    'title' => $p->title,
                    'slug' => $p->slug,
                    'excerpt' => $p->excerpt ?? Str::limit($p->extractTextFromBlocks(), 160),
                    'url' => "/blog/{$p->slug}",
                    'published_at' => $p->published_at,
                ]);
            $results = $results->concat($posts);
        }

        // Hook : plugins peuvent ajouter leurs résultats
        $results = app('cms.plugins')->applyFilter('search_results', $results, $query);

        // Trier par pertinence (le driver gère déjà le scoring)
        return [
            'results' => $results->take($perPage)->values()->toArray(),
            'total' => $results->count(),
            'query' => $query,
        ];
    }
}
```

---

## 5. API endpoint

```php
// routes/web.php (ou api.php)
Route::get('/api/search', [SearchController::class, 'search'])
    ->middleware('throttle:public-api')
    ->name('search');
```

```php
// app/Http/Controllers/SearchController.php
public function search(Request $request): JsonResponse
{
    $validated = $request->validate([
        'q' => ['required', 'string', 'min:2', 'max:200'],
        'type' => ['nullable', 'string', 'in:all,pages,posts'],
        'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
    ]);

    $results = app(SearchService::class)->search(
        $validated['q'],
        $validated['per_page'] ?? 20,
    );

    return response()->json($results);
}
```

---

## 6. Bloc Page Builder : Search

```tsx
// Bloc "search" pour le page builder
interface SearchBlockProps {
    placeholder?: string;
    showFilters?: boolean;
    resultsPerPage?: number;
}

// Rendu : un champ de recherche avec autocomplétion
// Les résultats s'affichent en dessous (instant search)
// Utilise fetch('/api/search?q=...') avec debounce
```

---

## 7. Commandes d'indexation

```bash
# Indexer tous les contenus existants
php artisan scout:import "App\Models\Page"
php artisan scout:import "App\Models\Post"

# Flush et réindexer
php artisan scout:flush "App\Models\Page"
php artisan scout:import "App\Models\Page"
```

---

## 8. Meilisearch (production)

```env
# .env pour Meilisearch
SCOUT_DRIVER=meilisearch
MEILISEARCH_HOST=http://127.0.0.1:7700
MEILISEARCH_KEY=masterKey
```

Meilisearch apporte :
- Recherche instantanée (< 50ms)
- Tolérance aux fautes de frappe
- Filtres facettés (par type, date, catégorie)
- Highlighting des résultats
- Synonymes configurables
