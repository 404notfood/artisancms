# Blueprint 24 - Templates de sites (Starter Kits)

## Vue d'ensemble

Les **templates de sites** (starter kits) sont des ensembles complets et prets a l'emploi qui permettent de demarrer un site web en un clic. Un template inclut tout ce qui constitue un site fonctionnel : pages avec leur contenu de blocs, articles de demonstration, menus de navigation, medias, taxonomies, settings du site et surcharges de theme.

**Objectifs :**
- Permettre aux utilisateurs non-techniques de demarrer rapidement avec un site professionnel
- Offrir des templates specialises par secteur d'activite (restaurant, agence, portfolio, etc.)
- Proposer le choix du template lors du wizard d'installation (etape optionnelle)
- Permettre l'installation de templates a tout moment depuis l'admin
- Fournir aux developpeurs les outils pour creer et exporter leurs propres templates

**Templates disponibles :**

| Template | Categorie | Pages | Description |
|----------|-----------|-------|-------------|
| Restaurant | business | 6 | Site complet pour restaurant avec carte, reservation, galerie |
| Agence Web | business | 7 | Site vitrine pour agence digitale avec portfolio et services |
| Portfolio | creative | 5 | Portfolio personnel pour createurs et freelances |
| Blog | content | 4 | Blog moderne avec categories, archives et sidebar |
| E-commerce | business | 8 | Vitrine e-commerce avec catalogue produits (sans paiement) |
| Landing Page | marketing | 2 | Page d'atterrissage optimisee conversion + page mentions |
| Corporate | business | 8 | Site institutionnel multi-pages complet |
| Site vierge | - | 1 | Page d'accueil vide, aucun contenu pre-rempli |

---

## 1. Structure d'un template

```
content/templates/
├── restaurant/
│   ├── artisan-template.json    # Manifeste du template
│   ├── thumbnail.jpg            # Preview card (800x600)
│   ├── screenshots/             # Captures d'ecran du site
│   │   ├── home.jpg
│   │   ├── menu.jpg
│   │   ├── about.jpg
│   │   └── contact.jpg
│   ├── data/
│   │   ├── pages.json           # Pages avec contenu blocs (JSON)
│   │   ├── posts.json           # Articles de demonstration
│   │   ├── menus.json           # Menus de navigation (header, footer)
│   │   ├── settings.json        # Settings du site (nom, description, etc.)
│   │   └── taxonomies.json      # Categories, tags
│   ├── media/                   # Images de demonstration
│   │   ├── hero.jpg
│   │   ├── about.jpg
│   │   ├── gallery-1.jpg
│   │   ├── gallery-2.jpg
│   │   ├── team-1.jpg
│   │   └── ...
│   └── theme-overrides/         # Surcharges du theme par defaut
│       └── settings.json        # Couleurs, fonts adaptees au template
├── agency/
│   ├── artisan-template.json
│   ├── thumbnail.jpg
│   └── ...
├── portfolio/
│   └── ...
└── blank/
    ├── artisan-template.json
    ├── thumbnail.jpg
    └── data/
        ├── pages.json           # Une seule page d'accueil vide
        ├── menus.json           # Menu vide
        └── settings.json        # Settings minimaux
```

---

## 2. Manifeste artisan-template.json

```json
{
  "name": "Restaurant",
  "slug": "restaurant",
  "version": "1.0.0",
  "description": "Template complet pour un site de restaurant avec carte, reservation et galerie photo.",
  "category": "business",
  "tags": ["restaurant", "food", "reservation", "carte"],
  "preview_url": "https://demo.artisancms.dev/restaurant",
  "author": {
    "name": "ArtisanCMS",
    "url": "https://artisancms.dev"
  },
  "license": "MIT",
  "requires": {
    "cms": ">=1.0.0",
    "theme": "default",
    "plugins": []
  },
  "pages_count": 6,
  "posts_count": 3,
  "features": ["hero", "menu-carte", "reservation", "galerie", "contact", "temoignages"],
  "data_files": {
    "pages": "data/pages.json",
    "posts": "data/posts.json",
    "menus": "data/menus.json",
    "settings": "data/settings.json",
    "taxonomies": "data/taxonomies.json"
  },
  "media_directory": "media/",
  "theme_overrides": "theme-overrides/settings.json",
  "thumbnail": "thumbnail.jpg",
  "screenshots": [
    "screenshots/home.jpg",
    "screenshots/menu.jpg",
    "screenshots/about.jpg",
    "screenshots/contact.jpg"
  ]
}
```

### Categories de templates

| Categorie | Slug | Description |
|-----------|------|-------------|
| Business | `business` | Sites professionnels et commerciaux |
| Creatif | `creative` | Portfolios, sites artistiques |
| Contenu | `content` | Blogs, magazines, sites de contenu |
| Marketing | `marketing` | Landing pages, sites promotionnels |
| Communaute | `community` | Forums, sites communautaires |

---

## 3. TemplateService

### Service principal (`app/Services/TemplateService.php`)

```php
<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Page;
use App\Models\Post;
use App\Models\Menu;
use App\Models\MenuItem;
use App\Models\Media;
use App\Models\Setting;
use App\Models\Taxonomy;
use App\Models\TaxonomyTerm;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class TemplateService
{
    protected string $templatesPath;

    public function __construct()
    {
        $this->templatesPath = base_path('content/templates');
    }

    /**
     * Decouvrir tous les templates disponibles dans content/templates/
     *
     * @return array<string, array> Templates indexes par slug
     */
    public function discover(): array
    {
        return Cache::remember('cms.templates.discovered', 3600, function () {
            $templates = [];

            if (!File::isDirectory($this->templatesPath)) {
                return $templates;
            }

            foreach (File::directories($this->templatesPath) as $dir) {
                $manifestPath = $dir . '/artisan-template.json';

                if (!File::exists($manifestPath)) {
                    continue;
                }

                $manifest = json_decode(File::get($manifestPath), true);

                if (json_last_error() !== JSON_ERROR_NONE) {
                    Log::warning("Template manifest invalide: {$manifestPath}");
                    continue;
                }

                $manifest['path'] = $dir;
                $manifest['installed'] = false;
                $templates[$manifest['slug']] = $manifest;
            }

            return $templates;
        });
    }

    /**
     * Obtenir les details d'un template avec ses screenshots
     *
     * @param string $slug Slug du template
     * @return array|null Infos du template ou null si introuvable
     */
    public function preview(string $slug): ?array
    {
        $templates = $this->discover();
        $template = $templates[$slug] ?? null;

        if (!$template) {
            return null;
        }

        // Charger les screenshots en base64 pour l'affichage
        $screenshots = [];
        foreach ($template['screenshots'] ?? [] as $screenshotPath) {
            $fullPath = $template['path'] . '/' . $screenshotPath;
            if (File::exists($fullPath)) {
                $screenshots[] = [
                    'path' => $screenshotPath,
                    'url' => $this->getTemplatAssetUrl($slug, $screenshotPath),
                ];
            }
        }

        $template['screenshots_data'] = $screenshots;

        // Charger le thumbnail
        $thumbnailPath = $template['path'] . '/' . ($template['thumbnail'] ?? 'thumbnail.jpg');
        if (File::exists($thumbnailPath)) {
            $template['thumbnail_url'] = $this->getTemplatAssetUrl($slug, $template['thumbnail'] ?? 'thumbnail.jpg');
        }

        return $template;
    }

    /**
     * Installer un template complet (pages, posts, menus, media, settings)
     *
     * @param string $slug Slug du template a installer
     * @param int $userId ID de l'utilisateur qui installe
     * @param array $options Options d'installation
     * @return array Rapport d'installation
     *
     * @throws \RuntimeException Si le template est introuvable
     * @throws \Exception Si l'installation echoue (rollback automatique)
     */
    public function install(string $slug, int $userId, array $options = []): array
    {
        $templates = $this->discover();
        $template = $templates[$slug] ?? null;

        if (!$template) {
            throw new \RuntimeException("Template '{$slug}' introuvable.");
        }

        $templatePath = $template['path'];
        $report = [
            'template' => $slug,
            'pages_created' => 0,
            'posts_created' => 0,
            'menus_created' => 0,
            'media_imported' => 0,
            'taxonomies_created' => 0,
            'settings_applied' => 0,
            'skipped' => [],
            'errors' => [],
        ];

        // Option : ecraser les donnees existantes ou non
        $overwrite = $options['overwrite'] ?? false;

        DB::beginTransaction();

        try {
            // 1. Importer les medias en premier (les pages y font reference)
            $mediaMap = $this->importMedia($templatePath, $report);

            // 2. Importer les taxonomies
            $this->importTaxonomies($templatePath, $report);

            // 3. Importer les pages
            $this->importPages($templatePath, $userId, $mediaMap, $overwrite, $report);

            // 4. Importer les posts
            $this->importPosts($templatePath, $userId, $mediaMap, $overwrite, $report);

            // 5. Importer les menus
            $this->importMenus($templatePath, $overwrite, $report);

            // 6. Appliquer les settings
            $this->importSettings($templatePath, $overwrite, $report);

            // 7. Appliquer les surcharges de theme
            $this->applyThemeOverrides($templatePath, $template);

            DB::commit();

            // Vider les caches pertinents
            Cache::forget('cms.templates.discovered');
            Cache::forget('cms.theme.css_variables');
            Cache::forget('cms.settings');

            Log::info("Template '{$slug}' installe avec succes.", $report);

            return $report;

        } catch (\Exception $e) {
            DB::rollBack();

            // Nettoyer les medias deja copies
            $this->cleanupImportedMedia($mediaMap ?? []);

            Log::error("Echec installation template '{$slug}': " . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            throw $e;
        }
    }

    /**
     * Lister les templates par categorie
     *
     * @param string|null $category Filtrer par categorie (null = toutes)
     * @return array Templates groupes par categorie
     */
    public function listByCategory(?string $category = null): array
    {
        $templates = $this->discover();

        if ($category) {
            $templates = array_filter($templates, fn(array $t) => ($t['category'] ?? '') === $category);
        }

        $grouped = [];
        foreach ($templates as $slug => $template) {
            $cat = $template['category'] ?? 'other';
            $grouped[$cat][$slug] = $template;
        }

        return $grouped;
    }

    /**
     * Verifier les conflits potentiels avant installation
     *
     * @param string $slug Slug du template
     * @return array Liste des conflits detectes
     */
    public function checkConflicts(string $slug): array
    {
        $templates = $this->discover();
        $template = $templates[$slug] ?? null;

        if (!$template) {
            return ['error' => "Template '{$slug}' introuvable."];
        }

        $templatePath = $template['path'];
        $conflicts = [];

        // Verifier les pages existantes
        $pagesFile = $templatePath . '/data/pages.json';
        if (File::exists($pagesFile)) {
            $pages = json_decode(File::get($pagesFile), true) ?? [];
            foreach ($pages as $page) {
                $existingPage = Page::where('slug', $page['slug'])->first();
                if ($existingPage) {
                    $conflicts[] = [
                        'type' => 'page',
                        'slug' => $page['slug'],
                        'title' => $page['title'],
                        'existing_title' => $existingPage->title,
                    ];
                }
            }
        }

        // Verifier les menus existants
        $menusFile = $templatePath . '/data/menus.json';
        if (File::exists($menusFile)) {
            $menus = json_decode(File::get($menusFile), true) ?? [];
            foreach ($menus as $menu) {
                $existingMenu = Menu::where('location', $menu['location'])->first();
                if ($existingMenu) {
                    $conflicts[] = [
                        'type' => 'menu',
                        'location' => $menu['location'],
                        'name' => $menu['name'],
                        'existing_name' => $existingMenu->name,
                    ];
                }
            }
        }

        return $conflicts;
    }

    // -------------------------------------------------------
    // Methodes privees d'import
    // -------------------------------------------------------

    /**
     * Importer les medias du template dans le storage public
     *
     * @return array<string, string> Mapping ancien chemin => nouveau chemin
     */
    protected function importMedia(string $templatePath, array &$report): array
    {
        $mediaDir = $templatePath . '/media';
        $mediaMap = [];

        if (!File::isDirectory($mediaDir)) {
            return $mediaMap;
        }

        $files = File::allFiles($mediaDir);

        foreach ($files as $file) {
            $originalName = $file->getFilename();
            $extension = $file->getExtension();
            $mimeType = mime_content_type($file->getPathname());
            $size = $file->getSize();

            // Generer un nom unique pour eviter les collisions
            $storedName = Str::uuid() . '.' . $extension;
            $storagePath = 'media/' . date('Y/m') . '/' . $storedName;

            // Copier vers le storage public
            Storage::disk('public')->put($storagePath, File::get($file->getPathname()));

            // Creer l'entree en base de donnees
            $media = Media::create([
                'filename' => $originalName,
                'path' => $storagePath,
                'mime_type' => $mimeType,
                'size' => $size,
                'alt' => pathinfo($originalName, PATHINFO_FILENAME),
                'disk' => 'public',
            ]);

            // Mapper le chemin relatif du template vers le nouveau chemin
            $relativePath = 'media/' . $file->getRelativePathname();
            $mediaMap[$relativePath] = $storagePath;
            $mediaMap[$originalName] = $storagePath;
            $mediaMap['__media_ids'][$originalName] = $media->id;

            $report['media_imported']++;
        }

        return $mediaMap;
    }

    /**
     * Importer les taxonomies (categories, tags)
     */
    protected function importTaxonomies(string $templatePath, array &$report): void
    {
        $file = $templatePath . '/data/taxonomies.json';

        if (!File::exists($file)) {
            return;
        }

        $taxonomies = json_decode(File::get($file), true) ?? [];

        foreach ($taxonomies as $taxonomyData) {
            $taxonomy = Taxonomy::firstOrCreate(
                ['slug' => $taxonomyData['slug']],
                [
                    'name' => $taxonomyData['name'],
                    'type' => $taxonomyData['type'] ?? 'category',
                    'description' => $taxonomyData['description'] ?? null,
                ]
            );

            foreach ($taxonomyData['terms'] ?? [] as $termData) {
                TaxonomyTerm::firstOrCreate(
                    [
                        'taxonomy_id' => $taxonomy->id,
                        'slug' => $termData['slug'],
                    ],
                    [
                        'name' => $termData['name'],
                        'description' => $termData['description'] ?? null,
                        'order' => $termData['order'] ?? 0,
                    ]
                );

                $report['taxonomies_created']++;
            }
        }
    }

    /**
     * Importer les pages du template
     */
    protected function importPages(
        string $templatePath,
        int $userId,
        array $mediaMap,
        bool $overwrite,
        array &$report,
    ): void {
        $file = $templatePath . '/data/pages.json';

        if (!File::exists($file)) {
            return;
        }

        $pages = json_decode(File::get($file), true) ?? [];

        foreach ($pages as $pageData) {
            $existingPage = Page::where('slug', $pageData['slug'])->first();

            if ($existingPage && !$overwrite) {
                $report['skipped'][] = [
                    'type' => 'page',
                    'slug' => $pageData['slug'],
                    'reason' => 'Page existante (slug duplique)',
                ];
                continue;
            }

            // Remplacer les references media dans le contenu JSON
            $content = $this->replaceMediaReferences($pageData['content'] ?? [], $mediaMap);

            $attributes = [
                'title' => $pageData['title'],
                'slug' => $pageData['slug'],
                'content' => $content,
                'status' => $pageData['status'] ?? 'published',
                'template' => $pageData['template'] ?? 'default',
                'meta_title' => $pageData['meta_title'] ?? $pageData['title'],
                'meta_description' => $pageData['meta_description'] ?? null,
                'order' => $pageData['order'] ?? 0,
                'created_by' => $userId,
                'published_at' => now(),
            ];

            if ($existingPage && $overwrite) {
                $existingPage->update($attributes);
            } else {
                // Gerer les slugs dupliques si necessaire
                $attributes['slug'] = $this->ensureUniqueSlug(
                    $pageData['slug'],
                    Page::class,
                );
                Page::create($attributes);
            }

            // Definir comme page d'accueil si indique
            if ($pageData['is_homepage'] ?? false) {
                Setting::set('homepage_id', Page::where('slug', $attributes['slug'])->value('id'));
            }

            $report['pages_created']++;
        }
    }

    /**
     * Importer les articles de demonstration
     */
    protected function importPosts(
        string $templatePath,
        int $userId,
        array $mediaMap,
        bool $overwrite,
        array &$report,
    ): void {
        $file = $templatePath . '/data/posts.json';

        if (!File::exists($file)) {
            return;
        }

        $posts = json_decode(File::get($file), true) ?? [];

        foreach ($posts as $postData) {
            $existingPost = Post::where('slug', $postData['slug'])->first();

            if ($existingPost && !$overwrite) {
                $report['skipped'][] = [
                    'type' => 'post',
                    'slug' => $postData['slug'],
                    'reason' => 'Article existant (slug duplique)',
                ];
                continue;
            }

            $content = $this->replaceMediaReferences($postData['content'] ?? [], $mediaMap);

            // Resoudre l'image mise en avant
            $featuredImage = null;
            if (isset($postData['featured_image'])) {
                $featuredImage = $mediaMap[$postData['featured_image']] ?? $postData['featured_image'];
            }

            $attributes = [
                'title' => $postData['title'],
                'slug' => $postData['slug'],
                'content' => $content,
                'excerpt' => $postData['excerpt'] ?? null,
                'status' => $postData['status'] ?? 'published',
                'featured_image' => $featuredImage,
                'created_by' => $userId,
                'published_at' => now()->subDays(rand(1, 30)),
            ];

            if ($existingPost && $overwrite) {
                $existingPost->update($attributes);
            } else {
                $attributes['slug'] = $this->ensureUniqueSlug(
                    $postData['slug'],
                    Post::class,
                );
                $post = Post::create($attributes);
            }

            // Associer les taxonomies
            if (isset($postData['taxonomies'])) {
                $this->attachTaxonomies(
                    $existingPost ?? $post,
                    $postData['taxonomies'],
                );
            }

            $report['posts_created']++;
        }
    }

    /**
     * Importer les menus de navigation
     */
    protected function importMenus(string $templatePath, bool $overwrite, array &$report): void
    {
        $file = $templatePath . '/data/menus.json';

        if (!File::exists($file)) {
            return;
        }

        $menus = json_decode(File::get($file), true) ?? [];

        foreach ($menus as $menuData) {
            $existingMenu = Menu::where('location', $menuData['location'])->first();

            if ($existingMenu && !$overwrite) {
                $report['skipped'][] = [
                    'type' => 'menu',
                    'location' => $menuData['location'],
                    'reason' => 'Menu existant a cet emplacement',
                ];
                continue;
            }

            if ($existingMenu && $overwrite) {
                // Supprimer les anciens items
                $existingMenu->items()->delete();
                $menu = $existingMenu;
                $menu->update(['name' => $menuData['name']]);
            } else {
                $menu = Menu::create([
                    'name' => $menuData['name'],
                    'location' => $menuData['location'],
                ]);
            }

            // Creer les items du menu
            $this->createMenuItems($menu, $menuData['items'] ?? [], null);

            $report['menus_created']++;
        }
    }

    /**
     * Creer recursivement les items d'un menu
     */
    protected function createMenuItems(Menu $menu, array $items, ?int $parentId): void
    {
        foreach ($items as $index => $itemData) {
            // Resoudre l'URL vers une page si c'est une reference de page
            $url = $itemData['url'] ?? '#';
            $pageId = null;

            if (isset($itemData['page_slug'])) {
                $page = Page::where('slug', $itemData['page_slug'])->first();
                if ($page) {
                    $pageId = $page->id;
                    $url = '/' . $page->slug;
                }
            }

            $menuItem = MenuItem::create([
                'menu_id' => $menu->id,
                'parent_id' => $parentId,
                'title' => $itemData['title'],
                'url' => $url,
                'page_id' => $pageId,
                'target' => $itemData['target'] ?? '_self',
                'order' => $itemData['order'] ?? $index,
            ]);

            // Items enfants (sous-menus)
            if (!empty($itemData['children'])) {
                $this->createMenuItems($menu, $itemData['children'], $menuItem->id);
            }
        }
    }

    /**
     * Appliquer les settings du template
     */
    protected function importSettings(string $templatePath, bool $overwrite, array &$report): void
    {
        $file = $templatePath . '/data/settings.json';

        if (!File::exists($file)) {
            return;
        }

        $settings = json_decode(File::get($file), true) ?? [];

        foreach ($settings as $key => $value) {
            $existing = Setting::where('key', $key)->first();

            if ($existing && !$overwrite) {
                $report['skipped'][] = [
                    'type' => 'setting',
                    'key' => $key,
                    'reason' => 'Setting existant',
                ];
                continue;
            }

            Setting::set($key, $value);
            $report['settings_applied']++;
        }
    }

    /**
     * Appliquer les surcharges de theme du template
     */
    protected function applyThemeOverrides(string $templatePath, array $template): void
    {
        $overridesFile = $templatePath . '/' . ($template['theme_overrides'] ?? 'theme-overrides/settings.json');

        if (!File::exists($overridesFile)) {
            return;
        }

        $overrides = json_decode(File::get($overridesFile), true);

        if (!$overrides) {
            return;
        }

        $themeSlug = $template['requires']['theme'] ?? 'default';

        // Mettre a jour les customizations du theme actif
        $themeManager = app('cms.themes');
        $themeManager->saveCustomization($themeSlug, $overrides);
    }

    // -------------------------------------------------------
    // Utilitaires
    // -------------------------------------------------------

    /**
     * Remplacer les references media dans le contenu JSON des blocs
     * Les templates referent aux medias par nom de fichier ; cette methode
     * les remplace par les chemins reels apres import.
     */
    protected function replaceMediaReferences(array $content, array $mediaMap): array
    {
        array_walk_recursive($content, function (&$value) use ($mediaMap) {
            if (is_string($value)) {
                foreach ($mediaMap as $original => $replacement) {
                    if (str_starts_with($original, '__')) {
                        continue; // Ignorer les cles speciales
                    }
                    if (str_contains($value, $original)) {
                        $value = str_replace($original, '/storage/' . $replacement, $value);
                    }
                }
            }
        });

        return $content;
    }

    /**
     * Generer un slug unique pour eviter les doublons
     */
    protected function ensureUniqueSlug(string $slug, string $modelClass): string
    {
        $originalSlug = $slug;
        $counter = 1;

        while ($modelClass::where('slug', $slug)->exists()) {
            $slug = $originalSlug . '-' . $counter;
            $counter++;
        }

        return $slug;
    }

    /**
     * Associer des taxonomies a un modele (post, page)
     */
    protected function attachTaxonomies(Post $model, array $taxonomies): void
    {
        foreach ($taxonomies as $taxonomySlug => $termSlugs) {
            $taxonomy = Taxonomy::where('slug', $taxonomySlug)->first();
            if (!$taxonomy) {
                continue;
            }

            $termIds = TaxonomyTerm::where('taxonomy_id', $taxonomy->id)
                ->whereIn('slug', $termSlugs)
                ->pluck('id')
                ->toArray();

            if (!empty($termIds)) {
                $model->terms()->syncWithoutDetaching($termIds);
            }
        }
    }

    /**
     * Generer l'URL publique d'un asset de template (pour le preview)
     */
    protected function getTemplatAssetUrl(string $slug, string $relativePath): string
    {
        return url("content/templates/{$slug}/{$relativePath}");
    }

    /**
     * Nettoyer les medias importes en cas d'echec (rollback)
     */
    protected function cleanupImportedMedia(array $mediaMap): void
    {
        foreach ($mediaMap as $key => $path) {
            if (str_starts_with($key, '__')) {
                continue;
            }
            if (Storage::disk('public')->exists($path)) {
                Storage::disk('public')->delete($path);
            }
        }
    }
}
```

---

## 4. Integration wizard d'installation

Le template est propose comme **etape optionnelle** dans le wizard d'installation, inseree apres le choix de la langue (etape 2) et avant la verification des prerequis (etape 3).

### Flux mis a jour du wizard

```
Etape 1 : Choix du stack (Laravel / Next.js)
Etape 2 : Langue
Etape 3 : Choix du template (NOUVEAU - optionnel)  ← ici
Etape 4 : Verification prerequis
Etape 5 : Base de donnees
Etape 6 : Informations du site
Etape 7 : Compte administrateur
Etape 8 : Installation & resultat
```

### Controller d'installation (ajout)

```php
<?php

declare(strict_types=1);

namespace App\Http\Controllers\Install;

use App\Services\TemplateService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InstallTemplateController
{
    public function __construct(
        protected TemplateService $templateService,
    ) {}

    /**
     * Afficher la grille de selection des templates
     */
    public function show()
    {
        $templates = $this->templateService->discover();

        // Ajouter les thumbnails pour chaque template
        $templatesWithPreview = [];
        foreach ($templates as $slug => $template) {
            $preview = $this->templateService->preview($slug);
            $templatesWithPreview[$slug] = $preview ?? $template;
        }

        return Inertia::render('Install/TemplateStep', [
            'templates' => $templatesWithPreview,
            'categories' => [
                'business' => __('install.template_category_business'),
                'creative' => __('install.template_category_creative'),
                'content' => __('install.template_category_content'),
                'marketing' => __('install.template_category_marketing'),
            ],
        ]);
    }

    /**
     * Sauvegarder le choix du template en session
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'template' => ['nullable', 'string', 'max:100'],
        ]);

        // Stocker le choix en session pour l'appliquer a la fin du wizard
        session(['install.template' => $validated['template']]);

        return redirect()->route('install.step', ['step' => 4]);
    }
}
```

### Composant React de selection (`resources/js/pages/Install/TemplateStep.tsx`)

```tsx
import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Eye } from 'lucide-react';

interface Template {
  name: string;
  slug: string;
  description: string;
  category: string;
  pages_count: number;
  features: string[];
  thumbnail_url?: string;
  screenshots_data?: Array<{ path: string; url: string }>;
}

interface Props {
  templates: Record<string, Template>;
  categories: Record<string, string>;
}

export default function TemplateStep({ templates, categories }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [previewSlug, setPreviewSlug] = useState<string | null>(null);
  const { post, processing } = useForm({ template: '' });

  const handleSubmit = () => {
    post(route('install.template.store'), {
      data: { template: selected },
    });
  };

  const categoryList = Object.entries(categories);
  const templateList = Object.values(templates);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-heading font-bold">
          {__('install.choose_template')}
        </h2>
        <p className="text-muted-foreground mt-2">
          {__('install.choose_template_description')}
        </p>
      </div>

      {/* Option site vierge */}
      <Card
        className={`cursor-pointer border-2 transition-colors ${
          selected === null
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50'
        }`}
        onClick={() => setSelected(null)}
      >
        <CardContent className="flex items-center gap-4 p-4">
          {selected === null && <Check className="h-5 w-5 text-primary" />}
          <div>
            <h3 className="font-semibold">{__('install.blank_site')}</h3>
            <p className="text-sm text-muted-foreground">
              {__('install.blank_site_description')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Grille de templates par categorie */}
      {categoryList.map(([catSlug, catName]) => {
        const catTemplates = templateList.filter(
          (t) => t.category === catSlug
        );
        if (catTemplates.length === 0) return null;

        return (
          <div key={catSlug}>
            <h3 className="text-lg font-semibold mb-4">{catName}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {catTemplates.map((template) => (
                <Card
                  key={template.slug}
                  className={`cursor-pointer border-2 transition-colors ${
                    selected === template.slug
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelected(template.slug)}
                >
                  {template.thumbnail_url && (
                    <div className="aspect-video overflow-hidden rounded-t-lg">
                      <img
                        src={template.thumbnail_url}
                        alt={template.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold">{template.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {template.description}
                        </p>
                      </div>
                      {selected === template.slug && (
                        <Check className="h-5 w-5 text-primary flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <Badge variant="secondary">
                        {template.pages_count} pages
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewSlug(template.slug);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        {__('install.preview')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}

      {/* Actions */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={() => history.back()}>
          {__('install.previous')}
        </Button>
        <Button onClick={handleSubmit} disabled={processing}>
          {__('install.next')}
        </Button>
      </div>

      {/* Modal preview */}
      {previewSlug && (
        <TemplatePreviewModal
          template={templates[previewSlug]}
          onClose={() => setPreviewSlug(null)}
          onSelect={() => {
            setSelected(previewSlug);
            setPreviewSlug(null);
          }}
        />
      )}
    </div>
  );
}
```

### Application du template a la fin de l'installation

Le template choisi est applique a l'etape finale, apres la creation de la base de donnees et du compte administrateur :

```php
// Dans InstallController::finalize()
// Apres la creation des tables et du compte admin...

$templateSlug = session('install.template');

if ($templateSlug) {
    $templateService = app(TemplateService::class);
    $templateService->install($templateSlug, $adminUser->id, [
        'overwrite' => true, // Premier install, pas de conflit possible
    ]);
}
```

---

## 5. Interface admin

### Controller admin (`app/Http/Controllers/Admin/TemplateController.php`)

```php
<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\TemplateService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TemplateController extends Controller
{
    public function __construct(
        protected TemplateService $templateService,
    ) {}

    /**
     * Afficher la liste des templates disponibles
     * GET /admin/templates
     */
    public function index()
    {
        $templates = [];
        foreach ($this->templateService->discover() as $slug => $template) {
            $templates[$slug] = $this->templateService->preview($slug) ?? $template;
        }

        return Inertia::render('Admin/Templates/Index', [
            'templates' => $templates,
            'categories' => $this->templateService->listByCategory(),
        ]);
    }

    /**
     * Afficher le detail / preview d'un template
     * GET /admin/templates/{slug}
     */
    public function show(string $slug)
    {
        $template = $this->templateService->preview($slug);

        if (!$template) {
            abort(404);
        }

        $conflicts = $this->templateService->checkConflicts($slug);

        return Inertia::render('Admin/Templates/Show', [
            'template' => $template,
            'conflicts' => $conflicts,
        ]);
    }

    /**
     * Installer un template
     * POST /admin/templates/{slug}/install
     */
    public function install(Request $request, string $slug)
    {
        $validated = $request->validate([
            'overwrite' => ['boolean'],
        ]);

        try {
            $report = $this->templateService->install(
                $slug,
                $request->user()->id,
                ['overwrite' => $validated['overwrite'] ?? false],
            );

            return back()->with('success', __('admin.template_installed', [
                'name' => $report['template'],
                'pages' => $report['pages_created'],
            ]));

        } catch (\Exception $e) {
            return back()->with('error', __('admin.template_install_failed', [
                'error' => $e->getMessage(),
            ]));
        }
    }
}
```

### Routes admin

```php
// routes/admin.php (ajout)

Route::prefix('templates')->name('admin.templates.')->group(function () {
    Route::get('/', [TemplateController::class, 'index'])->name('index');
    Route::get('/{slug}', [TemplateController::class, 'show'])->name('show');
    Route::post('/{slug}/install', [TemplateController::class, 'install'])->name('install');
});
```

### Composant React admin (`resources/js/pages/Admin/Templates/Index.tsx`)

```tsx
import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Eye, Download, AlertTriangle } from 'lucide-react';

interface Template {
  name: string;
  slug: string;
  description: string;
  category: string;
  pages_count: number;
  posts_count: number;
  features: string[];
  thumbnail_url?: string;
  screenshots_data?: Array<{ path: string; url: string }>;
  preview_url?: string;
}

interface Props {
  templates: Record<string, Template>;
  categories: Record<string, Record<string, Template>>;
}

export default function TemplatesIndex({ templates, categories }: Props) {
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [installSlug, setInstallSlug] = useState<string | null>(null);
  const [installing, setInstalling] = useState(false);

  const handleInstall = (slug: string, overwrite: boolean = false) => {
    setInstalling(true);
    router.post(
      route('admin.templates.install', { slug }),
      { overwrite },
      {
        onFinish: () => {
          setInstalling(false);
          setInstallSlug(null);
        },
      }
    );
  };

  return (
    <AdminLayout title={__('admin.templates')}>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-heading font-bold">
            {__('admin.site_templates')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {__('admin.templates_description')}
          </p>
        </div>

        {/* Grille par categorie */}
        {Object.entries(categories).map(([catSlug, catTemplates]) => (
          <section key={catSlug}>
            <h2 className="text-lg font-semibold mb-4 capitalize">{catSlug}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.values(catTemplates).map((template) => (
                <Card key={template.slug} className="overflow-hidden">
                  {template.thumbnail_url && (
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={template.thumbnail_url}
                        alt={template.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <CardContent className="p-4 space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg">{template.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {template.description}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">
                        {template.pages_count} pages
                      </Badge>
                      {template.posts_count > 0 && (
                        <Badge variant="secondary">
                          {template.posts_count} articles
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewTemplate(template)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        {__('admin.preview')}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setInstallSlug(template.slug)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        {__('admin.install')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Modal preview avec screenshots */}
      <Dialog
        open={previewTemplate !== null}
        onOpenChange={() => setPreviewTemplate(null)}
      >
        <DialogContent className="max-w-4xl">
          {previewTemplate && (
            <>
              <DialogHeader>
                <DialogTitle>{previewTemplate.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  {previewTemplate.description}
                </p>
                {/* Carousel de screenshots */}
                <div className="grid grid-cols-2 gap-4">
                  {previewTemplate.screenshots_data?.map((screenshot, i) => (
                    <img
                      key={i}
                      src={screenshot.url}
                      alt={`Screenshot ${i + 1}`}
                      className="rounded-lg border"
                    />
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {previewTemplate.features.map((feature) => (
                    <Badge key={feature} variant="outline">
                      {feature}
                    </Badge>
                  ))}
                </div>
                {previewTemplate.preview_url && (
                  <a
                    href={previewTemplate.preview_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm"
                  >
                    {__('admin.view_live_demo')}
                  </a>
                )}
              </div>
              <DialogFooter>
                <Button
                  onClick={() => {
                    setInstallSlug(previewTemplate.slug);
                    setPreviewTemplate(null);
                  }}
                >
                  <Download className="h-4 w-4 mr-1" />
                  {__('admin.install_this_template')}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation d'installation */}
      <AlertDialog
        open={installSlug !== null}
        onOpenChange={() => setInstallSlug(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              <AlertTriangle className="h-5 w-5 text-amber-500 inline mr-2" />
              {__('admin.confirm_template_install')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {__('admin.template_install_warning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{__('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => installSlug && handleInstall(installSlug)}
              disabled={installing}
            >
              {installing
                ? __('admin.installing')
                : __('admin.confirm_install')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
```

---

## 6. Template de base : "Restaurant"

### Contenu detaille du template

Le template **Restaurant** est le template de reference. Il illustre toutes les fonctionnalites du page builder et sert d'exemple pour la creation de templates custom.

#### Page Accueil (`pages.json` - extrait)

```json
[
  {
    "title": "Accueil",
    "slug": "accueil",
    "is_homepage": true,
    "status": "published",
    "template": "full-width",
    "meta_title": "La Belle Assiette - Restaurant gastronomique",
    "meta_description": "Decouvrez La Belle Assiette, restaurant gastronomique au coeur de la ville. Cuisine francaise raffinee, produits locaux et de saison.",
    "order": 0,
    "content": [
      {
        "id": "hero-1",
        "type": "hero-section",
        "props": {
          "title": "La Belle Assiette",
          "subtitle": "Cuisine francaise raffinee",
          "description": "Une experience culinaire unique avec des produits frais et locaux, au coeur de la ville.",
          "background_image": "media/hero.jpg",
          "overlay_opacity": 0.5,
          "cta_text": "Reserver une table",
          "cta_link": "/reservation",
          "cta_secondary_text": "Voir la carte",
          "cta_secondary_link": "/carte",
          "height": "full",
          "text_align": "center"
        }
      },
      {
        "id": "intro-1",
        "type": "section",
        "props": { "padding": "lg", "background": "white" },
        "children": [
          {
            "id": "intro-grid",
            "type": "grid",
            "props": { "columns": 2, "gap": "lg", "align": "center" },
            "children": [
              {
                "id": "intro-image",
                "type": "image",
                "props": {
                  "src": "media/about.jpg",
                  "alt": "Notre restaurant",
                  "rounded": true
                }
              },
              {
                "id": "intro-text",
                "type": "text-block",
                "props": {
                  "title": "Bienvenue chez nous",
                  "content": "Depuis 2010, La Belle Assiette vous propose une cuisine francaise authentique et creative. Notre chef et son equipe selectionnent chaque jour les meilleurs produits du marche pour vous offrir une experience gastronomique inoubliable.",
                  "title_level": "h2"
                }
              }
            ]
          }
        ]
      },
      {
        "id": "menu-preview",
        "type": "section",
        "props": { "padding": "lg", "background": "light" },
        "children": [
          {
            "id": "menu-heading",
            "type": "heading",
            "props": {
              "text": "Notre carte",
              "level": "h2",
              "align": "center"
            }
          },
          {
            "id": "menu-grid",
            "type": "grid",
            "props": { "columns": 3, "gap": "md" },
            "children": [
              {
                "id": "menu-entrees",
                "type": "card",
                "props": {
                  "title": "Entrees",
                  "description": "Foie gras maison, Salade de chevre chaud, Veloute de saison...",
                  "icon": "utensils",
                  "link": "/carte#entrees"
                }
              },
              {
                "id": "menu-plats",
                "type": "card",
                "props": {
                  "title": "Plats",
                  "description": "Filet de boeuf, Pavee de saumon, Risotto aux cepes...",
                  "icon": "chef-hat",
                  "link": "/carte#plats"
                }
              },
              {
                "id": "menu-desserts",
                "type": "card",
                "props": {
                  "title": "Desserts",
                  "description": "Creme brulee, Fondant au chocolat, Tarte tatin...",
                  "icon": "cake",
                  "link": "/carte#desserts"
                }
              }
            ]
          }
        ]
      },
      {
        "id": "testimonials",
        "type": "section",
        "props": { "padding": "lg", "background": "white" },
        "children": [
          {
            "id": "testi-heading",
            "type": "heading",
            "props": {
              "text": "Ce que disent nos clients",
              "level": "h2",
              "align": "center"
            }
          },
          {
            "id": "testi-grid",
            "type": "grid",
            "props": { "columns": 3, "gap": "md" },
            "children": [
              {
                "id": "testi-1",
                "type": "testimonial",
                "props": {
                  "quote": "Une experience culinaire exceptionnelle. Le filet de boeuf etait parfaitement cuit.",
                  "author": "Marie D.",
                  "rating": 5
                }
              },
              {
                "id": "testi-2",
                "type": "testimonial",
                "props": {
                  "quote": "Cadre magnifique et service impeccable. Nous reviendrons avec plaisir.",
                  "author": "Pierre L.",
                  "rating": 5
                }
              },
              {
                "id": "testi-3",
                "type": "testimonial",
                "props": {
                  "quote": "Le menu degustation est un voyage culinaire. Chaque plat est une decouverte.",
                  "author": "Sophie M.",
                  "rating": 5
                }
              }
            ]
          }
        ]
      },
      {
        "id": "cta-reservation",
        "type": "cta-section",
        "props": {
          "title": "Reservez votre table",
          "description": "Pour une soiree inoubliable, reservez des maintenant.",
          "button_text": "Reserver",
          "button_link": "/reservation",
          "background": "primary",
          "text_color": "white"
        }
      }
    ]
  }
]
```

#### Page A propos

| Bloc | Type | Contenu |
|------|------|---------|
| Hero | `hero-section` | Photo du restaurant, titre "Notre histoire" |
| Histoire | `text-block` + `image` | Texte fondation du restaurant + photo ancienne |
| Equipe | `grid` de `team-member` | Chef, sous-chef, sommelier avec photos et bios |
| Valeurs | `grid` de `card` | Produits locaux, fait maison, convivialite |

#### Page Menu / Carte

| Bloc | Type | Contenu |
|------|------|---------|
| En-tete | `heading` | "Notre carte" |
| Entrees | `menu-category` | Liste de plats avec nom, description, prix |
| Plats | `menu-category` | Liste de plats principaux |
| Desserts | `menu-category` | Liste de desserts |
| Vins | `menu-category` | Selection de vins |
| Note | `text-block` | "Menu sous reserve de disponibilite des produits" |

#### Page Reservation

| Bloc | Type | Contenu |
|------|------|---------|
| Hero | `hero-section` | Image de salle, "Reservez votre table" |
| Formulaire | `form` | Nom, email, telephone, date, heure, nombre de convives, message |
| Horaires | `grid` de `info-card` | Horaires d'ouverture par jour |
| Carte | `map` | Localisation Google Maps (iframe) |

#### Page Contact

| Bloc | Type | Contenu |
|------|------|---------|
| Coordonnees | `grid` (2 colonnes) | Formulaire de contact + infos (adresse, tel, email) |
| Carte | `map` | Localisation Google Maps |
| Horaires | `info-card` | Horaires d'ouverture |

#### Page Blog

| Bloc | Type | Contenu |
|------|------|---------|
| En-tete | `heading` | "Nos actualites" |
| Liste articles | `post-list` | Grille des 6 derniers articles |

#### Articles de demonstration (`posts.json`)

| Titre | Slug | Categorie | Extrait |
|-------|------|-----------|---------|
| Notre nouveau menu d'automne | `nouveau-menu-automne` | Actualites | Decouvrez les nouvelles saveurs de saison... |
| Soiree degustation de vins | `soiree-degustation-vins` | Evenements | Rejoignez-nous pour une soiree exceptionnelle... |
| Rencontre avec notre chef | `rencontre-avec-notre-chef` | Coulisses | Portrait de notre chef et sa philosophie culinaire... |

#### Menus de navigation (`menus.json`)

```json
[
  {
    "name": "Navigation principale",
    "location": "header",
    "items": [
      { "title": "Accueil", "page_slug": "accueil", "order": 0 },
      { "title": "La carte", "page_slug": "carte", "order": 1 },
      { "title": "A propos", "page_slug": "a-propos", "order": 2 },
      { "title": "Blog", "page_slug": "blog", "order": 3 },
      { "title": "Contact", "page_slug": "contact", "order": 4 },
      {
        "title": "Reserver",
        "page_slug": "reservation",
        "order": 5
      }
    ]
  },
  {
    "name": "Pied de page",
    "location": "footer",
    "items": [
      { "title": "Mentions legales", "url": "/mentions-legales", "order": 0 },
      { "title": "Politique de confidentialite", "url": "/confidentialite", "order": 1 },
      { "title": "Contact", "page_slug": "contact", "order": 2 }
    ]
  }
]
```

#### Settings du site (`settings.json`)

```json
{
  "site_name": "La Belle Assiette",
  "site_description": "Restaurant gastronomique - Cuisine francaise raffinee",
  "site_tagline": "Cuisine francaise raffinee, produits locaux et de saison",
  "contact_email": "contact@labeleassiette.fr",
  "contact_phone": "+33 1 23 45 67 89",
  "contact_address": "12 Rue de la Gastronomie, 75001 Paris",
  "social_facebook": "https://facebook.com/labeleassiette",
  "social_instagram": "https://instagram.com/labeleassiette",
  "opening_hours": {
    "monday": "Ferme",
    "tuesday": "12:00 - 14:30, 19:00 - 22:30",
    "wednesday": "12:00 - 14:30, 19:00 - 22:30",
    "thursday": "12:00 - 14:30, 19:00 - 22:30",
    "friday": "12:00 - 14:30, 19:00 - 23:00",
    "saturday": "12:00 - 14:30, 19:00 - 23:00",
    "sunday": "12:00 - 15:00"
  }
}
```

#### Surcharges de theme (`theme-overrides/settings.json`)

```json
{
  "colors": {
    "primary": "#8B4513",
    "secondary": "#D2691E",
    "accent": "#DAA520",
    "background": "#FFF8F0",
    "text": "#2C1810"
  },
  "fonts": {
    "heading": "Playfair Display",
    "body": "Lato"
  },
  "layout": {
    "container_width": "1280px",
    "border_radius": "0.5rem"
  }
}
```

---

## 7. Creation de templates custom

### Commande `cms:template:create`

Scaffold un nouveau template vide avec la structure de fichiers complete.

```php
<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class TemplateCreateCommand extends Command
{
    protected $signature = 'cms:template:create
        {name : Nom du template (ex: "Mon Template")}
        {--category=business : Categorie (business, creative, content, marketing)}
        {--description= : Description du template}';

    protected $description = 'Creer un nouveau template de site vide';

    public function handle(): int
    {
        $name = $this->argument('name');
        $slug = Str::slug($name);
        $category = $this->option('category');
        $description = $this->option('description') ?? "Template {$name} pour ArtisanCMS";

        $templatePath = base_path("content/templates/{$slug}");

        if (File::isDirectory($templatePath)) {
            $this->error("Le template '{$slug}' existe deja dans content/templates/");
            return self::FAILURE;
        }

        $this->info("Creation du template '{$name}'...");

        // Creer la structure de dossiers
        $directories = [
            $templatePath,
            "{$templatePath}/screenshots",
            "{$templatePath}/data",
            "{$templatePath}/media",
            "{$templatePath}/theme-overrides",
        ];

        foreach ($directories as $dir) {
            File::makeDirectory($dir, 0755, true);
        }

        // Creer le manifeste
        $manifest = [
            'name' => $name,
            'slug' => $slug,
            'version' => '1.0.0',
            'description' => $description,
            'category' => $category,
            'tags' => [],
            'preview_url' => '',
            'author' => [
                'name' => 'ArtisanCMS',
                'url' => 'https://artisancms.dev',
            ],
            'license' => 'MIT',
            'requires' => [
                'cms' => '>=1.0.0',
                'theme' => 'default',
                'plugins' => [],
            ],
            'pages_count' => 1,
            'posts_count' => 0,
            'features' => [],
            'data_files' => [
                'pages' => 'data/pages.json',
                'posts' => 'data/posts.json',
                'menus' => 'data/menus.json',
                'settings' => 'data/settings.json',
                'taxonomies' => 'data/taxonomies.json',
            ],
            'media_directory' => 'media/',
            'theme_overrides' => 'theme-overrides/settings.json',
            'thumbnail' => 'thumbnail.jpg',
            'screenshots' => [],
        ];

        File::put(
            "{$templatePath}/artisan-template.json",
            json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        );

        // Creer les fichiers de donnees par defaut
        $defaultPages = [
            [
                'title' => 'Accueil',
                'slug' => 'accueil',
                'is_homepage' => true,
                'status' => 'published',
                'template' => 'default',
                'meta_title' => $name,
                'meta_description' => $description,
                'order' => 0,
                'content' => [
                    [
                        'id' => 'hero-1',
                        'type' => 'hero-section',
                        'props' => [
                            'title' => $name,
                            'subtitle' => $description,
                            'cta_text' => 'En savoir plus',
                            'cta_link' => '#',
                        ],
                    ],
                ],
            ],
        ];

        $this->writeJsonFile("{$templatePath}/data/pages.json", $defaultPages);
        $this->writeJsonFile("{$templatePath}/data/posts.json", []);
        $this->writeJsonFile("{$templatePath}/data/menus.json", [
            [
                'name' => 'Navigation principale',
                'location' => 'header',
                'items' => [
                    ['title' => 'Accueil', 'page_slug' => 'accueil', 'order' => 0],
                ],
            ],
        ]);
        $this->writeJsonFile("{$templatePath}/data/settings.json", [
            'site_name' => $name,
            'site_description' => $description,
        ]);
        $this->writeJsonFile("{$templatePath}/data/taxonomies.json", []);
        $this->writeJsonFile("{$templatePath}/theme-overrides/settings.json", [
            'colors' => [
                'primary' => '#3b82f6',
                'secondary' => '#64748b',
                'accent' => '#f59e0b',
                'background' => '#ffffff',
                'text' => '#1e293b',
            ],
            'fonts' => [
                'heading' => 'Inter',
                'body' => 'Inter',
            ],
        ]);

        $this->newLine();
        $this->info("Template '{$name}' cree avec succes !");
        $this->newLine();
        $this->line("  Emplacement : content/templates/{$slug}/");
        $this->line("  Manifeste   : content/templates/{$slug}/artisan-template.json");
        $this->newLine();
        $this->line('Prochaines etapes :');
        $this->line("  1. Ajoutez vos images dans content/templates/{$slug}/media/");
        $this->line("  2. Editez les fichiers JSON dans content/templates/{$slug}/data/");
        $this->line("  3. Ajoutez un thumbnail (800x600) : content/templates/{$slug}/thumbnail.jpg");
        $this->line("  4. Ajoutez des screenshots dans content/templates/{$slug}/screenshots/");

        return self::SUCCESS;
    }

    protected function writeJsonFile(string $path, array $data): void
    {
        File::put($path, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    }
}
```

---

### Commande `cms:template:export`

Exporte le site actuel (pages, posts, menus, media, settings) comme un template reutilisable.

```php
<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Page;
use App\Models\Post;
use App\Models\Menu;
use App\Models\Media;
use App\Models\Setting;
use App\Models\Taxonomy;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class TemplateExportCommand extends Command
{
    protected $signature = 'cms:template:export
        {name : Nom du template a creer}
        {--category=business : Categorie du template}
        {--description= : Description du template}
        {--include-drafts : Inclure les pages et posts en brouillon}
        {--media-limit=50 : Nombre maximum de medias a exporter}';

    protected $description = 'Exporter le site actuel comme template reutilisable';

    public function handle(): int
    {
        $name = $this->argument('name');
        $slug = Str::slug($name);
        $category = $this->option('category');
        $description = $this->option('description') ?? "Template exporte depuis le site actuel";
        $includeDrafts = $this->option('include-drafts');
        $mediaLimit = (int) $this->option('media-limit');

        $templatePath = base_path("content/templates/{$slug}");

        if (File::isDirectory($templatePath)) {
            if (!$this->confirm("Le template '{$slug}' existe deja. Ecraser ?")) {
                return self::FAILURE;
            }
            File::deleteDirectory($templatePath);
        }

        $this->info("Export du site comme template '{$name}'...");
        $this->newLine();

        // Creer la structure
        foreach (['screenshots', 'data', 'media', 'theme-overrides'] as $dir) {
            File::makeDirectory("{$templatePath}/{$dir}", 0755, true);
        }

        // 1. Exporter les pages
        $this->task('Export des pages', function () use ($templatePath, $includeDrafts) {
            return $this->exportPages($templatePath, $includeDrafts);
        });

        // 2. Exporter les posts
        $this->task('Export des articles', function () use ($templatePath, $includeDrafts) {
            return $this->exportPosts($templatePath, $includeDrafts);
        });

        // 3. Exporter les menus
        $this->task('Export des menus', function () use ($templatePath) {
            return $this->exportMenus($templatePath);
        });

        // 4. Exporter les settings
        $this->task('Export des settings', function () use ($templatePath) {
            return $this->exportSettings($templatePath);
        });

        // 5. Exporter les taxonomies
        $this->task('Export des taxonomies', function () use ($templatePath) {
            return $this->exportTaxonomies($templatePath);
        });

        // 6. Exporter les medias references
        $mediaCount = 0;
        $this->task('Export des medias', function () use ($templatePath, $mediaLimit, &$mediaCount) {
            $mediaCount = $this->exportMedia($templatePath, $mediaLimit);
            return true;
        });

        // 7. Exporter les surcharges de theme
        $this->task('Export des surcharges de theme', function () use ($templatePath) {
            return $this->exportThemeOverrides($templatePath);
        });

        // 8. Creer le manifeste
        $pagesCount = Page::where('status', 'published')->count();
        $postsCount = Post::where('status', 'published')->count();

        $manifest = [
            'name' => $name,
            'slug' => $slug,
            'version' => '1.0.0',
            'description' => $description,
            'category' => $category,
            'tags' => [],
            'preview_url' => '',
            'author' => [
                'name' => Setting::get('site_name', 'ArtisanCMS'),
                'url' => config('app.url'),
            ],
            'license' => 'MIT',
            'requires' => [
                'cms' => '>=1.0.0',
                'theme' => $this->getActiveThemeSlug(),
                'plugins' => $this->getActivePluginSlugs(),
            ],
            'pages_count' => $pagesCount,
            'posts_count' => $postsCount,
            'features' => $this->detectFeatures(),
            'data_files' => [
                'pages' => 'data/pages.json',
                'posts' => 'data/posts.json',
                'menus' => 'data/menus.json',
                'settings' => 'data/settings.json',
                'taxonomies' => 'data/taxonomies.json',
            ],
            'media_directory' => 'media/',
            'theme_overrides' => 'theme-overrides/settings.json',
            'thumbnail' => 'thumbnail.jpg',
            'screenshots' => [],
        ];

        File::put(
            "{$templatePath}/artisan-template.json",
            json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        );

        $this->newLine();
        $this->info("Template '{$name}' exporte avec succes !");
        $this->table(
            ['Element', 'Nombre'],
            [
                ['Pages', $pagesCount],
                ['Articles', $postsCount],
                ['Menus', Menu::count()],
                ['Medias', $mediaCount],
                ['Taxonomies', Taxonomy::count()],
            ],
        );
        $this->newLine();
        $this->line("Emplacement : content/templates/{$slug}/");
        $this->warn("N'oubliez pas d'ajouter un thumbnail.jpg (800x600) et des screenshots.");

        return self::SUCCESS;
    }

    protected function exportPages(string $templatePath, bool $includeDrafts): bool
    {
        $query = Page::query()->orderBy('order');

        if (!$includeDrafts) {
            $query->where('status', 'published');
        }

        $pages = $query->get()->map(function (Page $page) {
            $homepageId = Setting::get('homepage_id');

            return [
                'title' => $page->title,
                'slug' => $page->slug,
                'is_homepage' => $page->id === (int) $homepageId,
                'status' => $page->status,
                'template' => $page->template,
                'meta_title' => $page->meta_title,
                'meta_description' => $page->meta_description,
                'order' => $page->order,
                'content' => $page->content ?? [],
            ];
        })->toArray();

        $this->writeJsonFile("{$templatePath}/data/pages.json", $pages);

        return true;
    }

    protected function exportPosts(string $templatePath, bool $includeDrafts): bool
    {
        $query = Post::query()->orderBy('published_at', 'desc');

        if (!$includeDrafts) {
            $query->where('status', 'published');
        }

        $posts = $query->get()->map(function (Post $post) {
            $data = [
                'title' => $post->title,
                'slug' => $post->slug,
                'status' => $post->status,
                'excerpt' => $post->excerpt,
                'featured_image' => $post->featured_image
                    ? basename($post->featured_image)
                    : null,
                'content' => $post->content ?? [],
            ];

            // Ajouter les taxonomies associees
            if ($post->terms && $post->terms->isNotEmpty()) {
                $taxonomies = [];
                foreach ($post->terms as $term) {
                    $taxSlug = $term->taxonomy->slug;
                    $taxonomies[$taxSlug][] = $term->slug;
                }
                $data['taxonomies'] = $taxonomies;
            }

            return $data;
        })->toArray();

        $this->writeJsonFile("{$templatePath}/data/posts.json", $posts);

        return true;
    }

    protected function exportMenus(string $templatePath): bool
    {
        $menus = Menu::with('items')->get()->map(function (Menu $menu) {
            return [
                'name' => $menu->name,
                'location' => $menu->location,
                'items' => $this->exportMenuItems($menu->items->whereNull('parent_id')),
            ];
        })->toArray();

        $this->writeJsonFile("{$templatePath}/data/menus.json", $menus);

        return true;
    }

    protected function exportMenuItems($items): array
    {
        return $items->map(function (mixed $item) {
            $data = [
                'title' => $item->title,
                'order' => $item->order,
                'target' => $item->target ?? '_self',
            ];

            // Reference a une page par slug plutot que par ID
            if ($item->page_id) {
                $page = Page::find($item->page_id);
                if ($page) {
                    $data['page_slug'] = $page->slug;
                }
            } else {
                $data['url'] = $item->url;
            }

            // Sous-items recursifs
            if ($item->children && $item->children->isNotEmpty()) {
                $data['children'] = $this->exportMenuItems($item->children);
            }

            return $data;
        })->values()->toArray();
    }

    protected function exportSettings(string $templatePath): bool
    {
        // Exporter uniquement les settings pertinents pour un template
        $exportKeys = [
            'site_name', 'site_description', 'site_tagline',
            'contact_email', 'contact_phone', 'contact_address',
            'social_facebook', 'social_instagram', 'social_twitter',
            'social_linkedin', 'social_youtube',
            'opening_hours', 'footer_text',
        ];

        $settings = [];
        foreach ($exportKeys as $key) {
            $value = Setting::get($key);
            if ($value !== null) {
                $settings[$key] = $value;
            }
        }

        $this->writeJsonFile("{$templatePath}/data/settings.json", $settings);

        return true;
    }

    protected function exportTaxonomies(string $templatePath): bool
    {
        $taxonomies = Taxonomy::with('terms')->get()->map(function (Taxonomy $taxonomy) {
            return [
                'name' => $taxonomy->name,
                'slug' => $taxonomy->slug,
                'type' => $taxonomy->type,
                'description' => $taxonomy->description,
                'terms' => $taxonomy->terms->map(function ($term) {
                    return [
                        'name' => $term->name,
                        'slug' => $term->slug,
                        'description' => $term->description,
                        'order' => $term->order,
                    ];
                })->toArray(),
            ];
        })->toArray();

        $this->writeJsonFile("{$templatePath}/data/taxonomies.json", $taxonomies);

        return true;
    }

    protected function exportMedia(string $templatePath, int $limit): int
    {
        $medias = Media::orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();

        $count = 0;

        foreach ($medias as $media) {
            if (Storage::disk($media->disk ?? 'public')->exists($media->path)) {
                $content = Storage::disk($media->disk ?? 'public')->get($media->path);
                File::put("{$templatePath}/media/{$media->filename}", $content);
                $count++;
            }
        }

        return $count;
    }

    protected function exportThemeOverrides(string $templatePath): bool
    {
        $themeManager = app('cms.themes');
        $activeTheme = $themeManager->getActive();

        if (!$activeTheme) {
            return false;
        }

        $overrides = $activeTheme['active_settings'] ?? [];

        if (empty($overrides)) {
            // Utiliser les valeurs par defaut du theme
            $overrides = [
                'colors' => [],
                'fonts' => [],
            ];
            foreach ($activeTheme['customization']['colors'] ?? [] as $key => $config) {
                $overrides['colors'][$key] = $config['default'];
            }
            foreach ($activeTheme['customization']['fonts'] ?? [] as $key => $config) {
                $overrides['fonts'][$key] = $config['default'];
            }
        }

        $this->writeJsonFile("{$templatePath}/theme-overrides/settings.json", $overrides);

        return true;
    }

    protected function getActiveThemeSlug(): string
    {
        $themeManager = app('cms.themes');
        $active = $themeManager->getActive();
        return $active['slug'] ?? 'default';
    }

    protected function getActivePluginSlugs(): array
    {
        return \App\Models\CmsPlugin::where('enabled', true)
            ->pluck('slug')
            ->toArray();
    }

    protected function detectFeatures(): array
    {
        $features = [];

        // Detecter les types de blocs utilises dans les pages
        $pages = Page::whereNotNull('content')->get();

        foreach ($pages as $page) {
            $this->extractBlockTypes($page->content ?? [], $features);
        }

        return array_unique($features);
    }

    protected function extractBlockTypes(array $blocks, array &$features): void
    {
        foreach ($blocks as $block) {
            if (isset($block['type'])) {
                $features[] = $block['type'];
            }
            if (isset($block['children'])) {
                $this->extractBlockTypes($block['children'], $features);
            }
        }
    }

    protected function writeJsonFile(string $path, array $data): void
    {
        File::put($path, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    }
}
```

---

## 8. Hooks et evenements

Le systeme de templates s'integre avec le systeme de hooks CMS existant :

| Hook | Arguments | Description |
|------|-----------|-------------|
| `template.installing` | slug, manifest | Avant l'installation d'un template |
| `template.installed` | slug, report | Apres installation reussie |
| `template.install_failed` | slug, exception | Apres echec d'installation |

| Filtre | Valeur | Description |
|--------|--------|-------------|
| `template.manifest` | array | Modifier le manifeste avant traitement |
| `template.page_data` | array | Modifier les donnees d'une page avant import |
| `template.post_data` | array | Modifier les donnees d'un article avant import |
| `template.settings` | array | Modifier les settings avant application |

Usage dans un plugin :

```php
use App\CMS\Facades\CMS;

// Modifier les donnees d'une page importee par un template
CMS::filter('template.page_data', function (array $pageData) {
    // Ajouter un bloc tracking a chaque page
    $pageData['content'][] = [
        'id' => 'tracking-' . uniqid(),
        'type' => 'tracking-pixel',
        'props' => ['provider' => 'analytics'],
    ];
    return $pageData;
});

// Reagir apres installation d'un template
CMS::hook('template.installed', function (string $slug, array $report) {
    \Log::info("Template {$slug} installe : {$report['pages_created']} pages creees.");
});
```

---

## 9. Fichiers de traduction

```php
// resources/lang/fr/install.php (ajouts)
return [
    // ...
    'choose_template' => 'Choisissez un modele de site',
    'choose_template_description' => 'Selectionnez un template pour demarrer avec un site pre-configure, ou choisissez un site vierge.',
    'blank_site' => 'Site vierge',
    'blank_site_description' => 'Commencez avec une page d\'accueil vide et construisez votre site de zero.',
    'preview' => 'Apercu',
    'template_category_business' => 'Business',
    'template_category_creative' => 'Creatif',
    'template_category_content' => 'Contenu',
    'template_category_marketing' => 'Marketing',
];

// resources/lang/fr/admin.php (ajouts)
return [
    // ...
    'templates' => 'Templates',
    'site_templates' => 'Templates de sites',
    'templates_description' => 'Installez un template pour demarrer rapidement avec un site complet et pre-configure.',
    'install' => 'Installer',
    'installing' => 'Installation en cours...',
    'preview' => 'Apercu',
    'confirm_template_install' => 'Installer ce template ?',
    'template_install_warning' => 'L\'installation va creer de nouvelles pages, articles et menus. Les elements existants avec le meme slug seront ignores sauf si vous choisissez de les ecraser.',
    'confirm_install' => 'Confirmer l\'installation',
    'install_this_template' => 'Installer ce template',
    'view_live_demo' => 'Voir la demo en ligne',
    'template_installed' => 'Template ":name" installe avec succes (:pages pages creees).',
    'template_install_failed' => 'Echec de l\'installation : :error',
];
```

---

## 10. Recapitulatif des fichiers

| Fichier | Role |
|---------|------|
| `app/Services/TemplateService.php` | Service principal : decouverte, installation, preview, conflits |
| `app/Http/Controllers/Install/InstallTemplateController.php` | Etape template dans le wizard |
| `app/Http/Controllers/Admin/TemplateController.php` | Interface admin pour gerer les templates |
| `app/Console/Commands/TemplateCreateCommand.php` | `php artisan cms:template:create` |
| `app/Console/Commands/TemplateExportCommand.php` | `php artisan cms:template:export` |
| `resources/js/pages/Install/TemplateStep.tsx` | Page React de selection (wizard) |
| `resources/js/pages/Admin/Templates/Index.tsx` | Page React admin (liste + install) |
| `content/templates/*/artisan-template.json` | Manifeste de chaque template |
| `content/templates/*/data/*.json` | Donnees du template (pages, posts, menus, etc.) |
| `content/templates/*/media/` | Images de demonstration |
| `content/templates/*/theme-overrides/settings.json` | Surcharges de couleurs/fonts du theme |
