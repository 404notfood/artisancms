# Blueprint 13 - Cache & Performance

## Vue d'ensemble
Ce document définit la stratégie de cache et d'optimisation des performances d'ArtisanCMS. L'objectif est d'atteindre un score Lighthouse ≥ 90 sur les pages front et un TTFB < 200ms.

---

## 1. Couches de cache

```
┌─────────────────────────────────────────────────┐
│  Navigateur (HTTP Cache, Service Worker)        │  ← Couche 1
├─────────────────────────────────────────────────┤
│  CDN / Reverse Proxy (optionnel)                │  ← Couche 2
├─────────────────────────────────────────────────┤
│  Cache applicatif Laravel (file/redis/array)    │  ← Couche 3
│  ├── Settings                                   │
│  ├── Thèmes (manifeste + CSS variables)         │
│  ├── Plugins (liste activés)                    │
│  ├── Blocs (registry)                           │
│  ├── Menus (HTML pré-rendu)                     │
│  └── Pages (contenu JSON résolu)                │
├─────────────────────────────────────────────────┤
│  Cache requêtes DB (query cache MySQL)          │  ← Couche 4
└─────────────────────────────────────────────────┘
```

---

## 2. Configuration du driver de cache

```php
// config/cms.php — section cache
'cache' => [
    'driver' => env('CMS_CACHE_DRIVER', 'file'),  // file, redis, array (tests)
    'prefix' => 'cms',
    'ttl' => [
        'settings' => 3600,         // 1 heure
        'theme' => 3600,            // 1 heure
        'plugins' => 3600,          // 1 heure
        'blocks' => 3600,           // 1 heure
        'menus' => 1800,            // 30 minutes
        'pages' => 600,             // 10 minutes (front)
        'media_list' => 300,        // 5 minutes
    ],
],
```

```php
// Pour la production, recommander Redis :
// .env
// CACHE_STORE=redis
// REDIS_HOST=127.0.0.1
// REDIS_PORT=6379
```

---

## 3. Cache par domaine

### 3.1 Settings (le plus fréquent)

```php
// app/Services/SettingService.php
<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Cache;

class SettingService
{
    protected string $cacheKey = 'cms.settings.all';

    /**
     * Récupérer une valeur de setting (avec cache)
     */
    public function get(string $key, mixed $default = null): mixed
    {
        $settings = $this->all();
        return $settings[$key] ?? $default;
    }

    /**
     * Récupérer toutes les settings (chargées une seule fois)
     */
    public function all(): array
    {
        return Cache::remember($this->cacheKey, config('cms.cache.ttl.settings'), function () {
            return Setting::all()
                ->mapWithKeys(fn (Setting $s) => ["{$s->group}.{$s->key}" => $s->value])
                ->toArray();
        });
    }

    /**
     * Mettre à jour une setting (invalide le cache)
     */
    public function set(string $key, mixed $value): void
    {
        [$group, $settingKey] = explode('.', $key, 2);

        Setting::updateOrCreate(
            ['group' => $group, 'key' => $settingKey],
            ['value' => $value]
        );

        $this->clearCache();
    }

    /**
     * Mettre à jour un groupe entier
     */
    public function updateGroup(string $group, array $values): void
    {
        foreach ($values as $key => $value) {
            Setting::updateOrCreate(
                ['group' => $group, 'key' => $key],
                ['value' => $value]
            );
        }

        $this->clearCache();
    }

    public function clearCache(): void
    {
        Cache::forget($this->cacheKey);
    }
}
```

### 3.2 Thèmes

```php
// Les caches liés au thème sont dans ThemeManager (voir Blueprint 03)
// Clés de cache :
// - cms.themes.discovered → Liste des thèmes (TTL 1h)
// - cms.theme.active_slug → Slug du thème actif (TTL 1h)
// - cms.theme.css_variables → CSS variables générées (TTL 1h)

// Invalidation : ThemeManager::activate() efface les 3 clés
```

### 3.3 Plugins

```php
// Clés de cache :
// - cms.plugins.enabled → Liste des slugs des plugins activés (TTL 1h)

// Invalidation : PluginManager::activate() et ::deactivate() effacent la clé
```

### 3.4 Block Registry

```php
// app/CMS/Blocks/BlockRegistry.php
public function all(): array
{
    return Cache::remember('cms.blocks.registry', config('cms.cache.ttl.blocks'), function () {
        return Block::all()->keyBy('slug')->toArray();
    });
}

public function clearCache(): void
{
    Cache::forget('cms.blocks.registry');
}
```

### 3.5 Menus

```php
// app/Services/MenuService.php
public function getByLocation(string $location): ?array
{
    return Cache::remember("cms.menus.{$location}", config('cms.cache.ttl.menus'), function () use ($location) {
        $menu = Menu::with('items.children')
            ->where('location', $location)
            ->first();

        if (!$menu) return null;

        return [
            'name' => $menu->name,
            'items' => $this->buildTree($menu->items),
        ];
    });
}

public function clearCache(string $location = null): void
{
    if ($location) {
        Cache::forget("cms.menus.{$location}");
    } else {
        // Effacer tous les menus
        foreach (['header', 'footer', 'sidebar'] as $loc) {
            Cache::forget("cms.menus.{$loc}");
        }
    }
}
```

### 3.6 Pages front (contenu résolu)

```php
// app/Services/PageService.php
public function findBySlugCached(string $slug): ?Page
{
    return Cache::remember("cms.pages.{$slug}", config('cms.cache.ttl.pages'), function () use ($slug) {
        return Page::published()
            ->where('slug', $slug)
            ->with('author')
            ->first();
    });
}

// Invalidation : quand une page est mise à jour
public function update(Page $page, array $data): Page
{
    $page->update($data);
    Cache::forget("cms.pages.{$page->slug}");
    return $page;
}
```

---

## 4. Invalidation intelligente du cache

### Pattern Observer

```php
// app/Observers/PageObserver.php
<?php

declare(strict_types=1);

namespace App\Observers;

use App\Models\Page;
use Illuminate\Support\Facades\Cache;

class PageObserver
{
    public function saved(Page $page): void
    {
        Cache::forget("cms.pages.{$page->slug}");

        // Si le slug a changé, invalider l'ancien aussi
        if ($page->wasChanged('slug')) {
            Cache::forget("cms.pages.{$page->getOriginal('slug')}");
        }
    }

    public function deleted(Page $page): void
    {
        Cache::forget("cms.pages.{$page->slug}");
    }
}

// Enregistrer dans AppServiceProvider::boot()
// Page::observe(PageObserver::class);
```

### Commande de purge globale

```php
// app/Console/Commands/CMSCacheClear.php
<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class CMSCacheClear extends Command
{
    protected $signature = 'cms:cache:clear {--group= : Groupe spécifique (settings, themes, plugins, blocks, menus, pages)}';
    protected $description = 'Vider le cache CMS';

    public function handle(): void
    {
        $group = $this->option('group');

        if ($group) {
            $this->clearGroup($group);
            $this->info("Cache CMS '{$group}' vidé.");
        } else {
            // Tout vider
            $groups = ['settings', 'themes', 'plugins', 'blocks', 'menus', 'pages'];
            foreach ($groups as $g) {
                $this->clearGroup($g);
            }
            $this->info('Tout le cache CMS a été vidé.');
        }
    }

    protected function clearGroup(string $group): void
    {
        match ($group) {
            'settings' => app(\App\Services\SettingService::class)->clearCache(),
            'themes' => Cache::forget('cms.themes.discovered')
                && Cache::forget('cms.theme.active_slug')
                && Cache::forget('cms.theme.css_variables'),
            'plugins' => Cache::forget('cms.plugins.enabled'),
            'blocks' => app('cms.blocks')->clearCache(),
            'menus' => app(\App\Services\MenuService::class)->clearCache(),
            'pages' => $this->clearPagesCache(),
            default => $this->error("Groupe inconnu : {$group}"),
        };
    }

    protected function clearPagesCache(): void
    {
        // Avec Redis on peut faire Cache::flush('cms.pages.*')
        // Avec file driver, on supprime par slug connu
        $slugs = \App\Models\Page::pluck('slug');
        foreach ($slugs as $slug) {
            Cache::forget("cms.pages.{$slug}");
        }
    }
}
```

---

## 5. Performance PHP / Laravel

### 5.1 Eager Loading (prévention N+1)

```php
// MAUVAIS ❌ — N+1 queries
$pages = Page::paginate(20);
foreach ($pages as $page) {
    echo $page->author->name; // 1 query par page
}

// BON ✅ — Eager loading
$pages = Page::with('author')->paginate(20);
```

**Règle** : Toujours utiliser `with()` dans les controllers qui retournent des listes.

Relations à eager-loader systématiquement :
- Pages : `author`, `parent`, `children`
- Posts : `author`, `terms.taxonomy`
- Menus : `items` (+ items.children si tree)
- Taxonomies : `terms`

### 5.2 Select spécifique

```php
// Quand on n'a pas besoin de toutes les colonnes :
Page::select(['id', 'title', 'slug', 'status', 'updated_at', 'created_by'])
    ->with('author:id,name')
    ->paginate(20);
```

### 5.3 Index de base de données

Les index critiques sont définis dans le Blueprint 01. Vérifier que ces index existent :
- `pages` : index sur `(status, published_at)`, `slug`, `parent_id`
- `posts` : index sur `(status, published_at)`, `slug`
- `media` : index sur `mime_type`, `folder`
- `settings` : unique sur `(group, key)`
- `menu_items` : index sur `(menu_id, order)`
- `taxonomy_terms` : unique sur `(taxonomy_id, slug)`

### 5.4 Config et route caching (production)

```bash
# À exécuter lors du déploiement en production
php artisan config:cache    # Compile config en un seul fichier
php artisan route:cache     # Compile les routes
php artisan view:cache      # Compile les vues Blade
php artisan event:cache     # Compile les events
php artisan icons:cache     # Si on utilise blade-icons

# Pour revenir en dev
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

---

## 6. Performance Frontend (React)

### 6.1 Code splitting

```tsx
// Lazy loading des pages admin lourdes
import { lazy, Suspense } from 'react';

const BuilderEdit = lazy(() => import('@/pages/Builder/Edit'));
const MediaIndex = lazy(() => import('@/pages/Admin/Media/Index'));

// Dans le layout ou le routeur Inertia :
<Suspense fallback={<LoadingSkeleton />}>
    <BuilderEdit />
</Suspense>
```

### 6.2 Memoization

```tsx
// Bloc renderers — mémoiser pour éviter les re-renders inutiles
import { memo } from 'react';

export const HeadingRenderer = memo(function HeadingRenderer({ text, level, styles }: HeadingProps) {
    const Tag = `h${level}` as keyof JSX.IntrinsicElements;
    return <Tag style={styles}>{text}</Tag>;
});

// Le page builder a beaucoup de composants imbriqués.
// Mémoiser les blocs qui ne changent pas quand un autre bloc est sélectionné.
```

### 6.3 Virtualisation des listes longues

```bash
npm install @tanstack/react-virtual
```

```tsx
// Pour la media library (potentiellement des centaines d'images)
import { useVirtualizer } from '@tanstack/react-virtual';

// Pour la toolbox du builder si elle a beaucoup de blocs
```

### 6.4 Optimisation des images

```php
// MediaService — Générer des thumbnails optimisés à l'upload
// Utiliser le format WebP quand possible
// Lazy loading natif pour les images du front

// Dans le ImageRenderer du page builder :
// <img loading="lazy" decoding="async" ... />
```

### 6.5 Vite build optimization

```typescript
// vite.config.ts — Chunks séparés pour vendor et admin
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.tsx',
            refresh: true,
        }),
        react(),
    ],
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    'vendor-react': ['react', 'react-dom'],
                    'vendor-inertia': ['@inertiajs/react'],
                    'vendor-dnd': ['@dnd-kit/core', '@dnd-kit/sortable'],
                    'vendor-tiptap': ['@tiptap/react', '@tiptap/starter-kit'],
                },
            },
        },
    },
});
```

---

## 7. Performance du Page Builder

Le builder est la page la plus lourde. Optimisations spécifiques :

### 7.1 Debounce des mises à jour de style
```tsx
// Ne pas mettre à jour le store à chaque frappe dans les inputs de style
import { useDebouncedCallback } from 'use-debounce';

const debouncedUpdate = useDebouncedCallback((value: string) => {
    updateBlockStyles(blockId, device, { padding: value });
}, 300);
```

### 7.2 Auto-save intelligent
```tsx
// Auto-save uniquement quand le builder est "idle" (pas de drag en cours)
// Debounce de 3 secondes après la dernière action
// Ne pas auto-save si rien n'a changé (isDirty check)
```

### 7.3 Canvas rendering
```tsx
// Utiliser un iframe pour le canvas du builder → isolation CSS
// Le thème CSS ne polluera pas l'admin UI et vice versa
// Communication iframe ↔ parent via postMessage
```

---

## 8. Monitoring et métriques

### Headers de debug (dev uniquement)
```php
// app/Http/Middleware/DebugPerformance.php (dev seulement)
class DebugPerformance
{
    public function handle(Request $request, Closure $next)
    {
        $start = microtime(true);
        $response = $next($request);
        $duration = round((microtime(true) - $start) * 1000, 2);

        if (app()->isLocal()) {
            $response->headers->set('X-Response-Time', "{$duration}ms");
            $response->headers->set('X-Query-Count', (string) count(DB::getQueryLog()));
        }

        return $response;
    }
}
```

### Seuils d'alerte

| Métrique | Seuil acceptable | Action si dépassé |
|----------|-----------------|-------------------|
| TTFB | < 200ms | Vérifier le cache et les queries |
| Nombre de queries par page | < 15 | Ajouter du eager loading |
| Taille de la réponse Inertia | < 500 Ko | Paginer ou lazy-load |
| Temps de sauvegarde builder | < 500ms | Optimiser la validation JSON |
| Temps de chargement admin | < 2s | Code splitting |

---

## 9. Résumé des clés de cache

| Clé | TTL | Invalidation |
|-----|-----|-------------|
| `cms.settings.all` | 1h | `SettingService::set()` |
| `cms.themes.discovered` | 1h | `ThemeManager::activate()` |
| `cms.theme.active_slug` | 1h | `ThemeManager::activate()` |
| `cms.theme.css_variables` | 1h | `ThemeManager::saveCustomization()` |
| `cms.plugins.enabled` | 1h | `PluginManager::activate/deactivate()` |
| `cms.blocks.registry` | 1h | `BlockRegistry::register()` |
| `cms.menus.{location}` | 30min | `MenuService::save()` |
| `cms.pages.{slug}` | 10min | `PageObserver::saved()` |
