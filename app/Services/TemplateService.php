<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\CmsTheme;
use App\Models\Media;
use App\Models\Menu;
use App\Models\MenuItem;
use App\Models\Page;
use App\Models\Post;
use App\Models\Setting;
use App\Models\Taxonomy;
use App\Models\TaxonomyTerm;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
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
     * Discover all available templates in content/templates/.
     *
     * @return array<string, array<string, mixed>> Templates indexed by slug
     */
    public function discover(): array
    {
        return Cache::remember('cms.templates.discovered', 3600, function (): array {
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
     * Get template details with screenshots for preview.
     *
     * @param string $slug Template slug
     * @return array<string, mixed>|null Template info or null if not found
     */
    public function preview(string $slug): ?array
    {
        $templates = $this->discover();
        $template = $templates[$slug] ?? null;

        if ($template === null) {
            return null;
        }

        // Load screenshots for display
        $screenshots = [];
        foreach ($template['screenshots'] ?? [] as $screenshotPath) {
            $fullPath = $template['path'] . '/' . $screenshotPath;
            if (File::exists($fullPath)) {
                $screenshots[] = [
                    'path' => $screenshotPath,
                    'url' => $this->getTemplateAssetUrl($slug, $screenshotPath),
                ];
            }
        }

        $template['screenshots_data'] = $screenshots;

        // Load thumbnail
        $thumbnailPath = $template['path'] . '/' . ($template['thumbnail'] ?? 'thumbnail.jpg');
        if (File::exists($thumbnailPath)) {
            $template['thumbnail_url'] = $this->getTemplateAssetUrl(
                $slug,
                $template['thumbnail'] ?? 'thumbnail.jpg',
            );
        }

        return $template;
    }

    /**
     * Install a full template (pages, posts, menus, media, settings).
     *
     * @param string $slug Template slug to install
     * @param int $userId ID of the user performing the install
     * @param array<string, mixed> $options Installation options
     * @return array<string, mixed> Installation report
     *
     * @throws \RuntimeException If the template is not found
     * @throws \Exception If installation fails (automatic rollback)
     */
    public function install(string $slug, int $userId, array $options = []): array
    {
        $templates = $this->discover();
        $template = $templates[$slug] ?? null;

        if ($template === null) {
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

        $overwrite = $options['overwrite'] ?? false;

        DB::beginTransaction();

        try {
            // 1. Import media first (pages reference them)
            $mediaMap = $this->importMedia($templatePath, $report);

            // 2. Import taxonomies
            $this->importTaxonomies($templatePath, $report);

            // 3. Import pages
            $this->importPages($templatePath, $userId, $mediaMap, $overwrite, $report);

            // 4. Import posts
            $this->importPosts($templatePath, $userId, $mediaMap, $overwrite, $report);

            // 5. Import menus
            $this->importMenus($templatePath, $overwrite, $report);

            // 6. Apply settings
            $this->importSettings($templatePath, $overwrite, $report);

            // 7. Apply theme overrides
            $this->applyThemeOverrides($templatePath, $template);

            DB::commit();

            // Clear relevant caches
            Cache::forget('cms.templates.discovered');
            Cache::forget('cms.theme.css_variables');
            Cache::forget('cms.settings');

            Log::info("Template '{$slug}' installe avec succes.", $report);

            return $report;
        } catch (\Exception $e) {
            DB::rollBack();

            // Clean up already copied media files
            $this->cleanupImportedMedia($mediaMap ?? []);

            Log::error("Echec installation template '{$slug}': " . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            throw $e;
        }
    }

    /**
     * Export current site content as a reusable template.
     *
     * @param int $userId ID of the user performing the export
     * @return array<string, mixed> Export report
     */
    public function export(int $userId): array
    {
        $slug = 'export-' . date('Y-m-d-His');
        $templatePath = $this->templatesPath . '/' . $slug;

        // Create directory structure
        $directories = [
            $templatePath,
            $templatePath . '/data',
            $templatePath . '/media',
            $templatePath . '/screenshots',
            $templatePath . '/theme-overrides',
        ];

        foreach ($directories as $dir) {
            File::makeDirectory($dir, 0755, true, true);
        }

        $report = [
            'slug' => $slug,
            'path' => $templatePath,
            'pages_exported' => 0,
            'posts_exported' => 0,
            'menus_exported' => 0,
            'media_exported' => 0,
            'settings_exported' => 0,
            'taxonomies_exported' => 0,
        ];

        // Export pages
        $pages = Page::where('status', 'published')->orderBy('order')->get();
        $pagesData = $pages->map(fn (Page $page): array => [
            'title' => $page->title,
            'slug' => $page->slug,
            'status' => $page->status,
            'template' => $page->template ?? 'default',
            'content' => $page->content ?? [],
            'meta_title' => $page->meta_title,
            'meta_description' => $page->meta_description,
            'order' => $page->order ?? 0,
        ])->values()->toArray();
        $this->writeJsonFile($templatePath . '/data/pages.json', $pagesData);
        $report['pages_exported'] = count($pagesData);

        // Export posts
        $posts = Post::where('status', 'published')->orderBy('created_at', 'desc')->get();
        $postsData = $posts->map(fn (Post $post): array => [
            'title' => $post->title,
            'slug' => $post->slug,
            'status' => $post->status,
            'content' => $post->content ?? [],
            'excerpt' => $post->excerpt,
            'featured_image' => $post->featured_image,
        ])->values()->toArray();
        $this->writeJsonFile($templatePath . '/data/posts.json', $postsData);
        $report['posts_exported'] = count($postsData);

        // Export menus with items
        $menus = Menu::with('items')->get();
        $menusData = $menus->map(fn (Menu $menu): array => [
            'name' => $menu->name,
            'location' => $menu->location,
            'items' => $menu->items->map(fn (MenuItem $item): array => [
                'label' => $item->label,
                'url' => $item->url,
                'target' => $item->target ?? '_self',
                'order' => $item->order ?? 0,
            ])->values()->toArray(),
        ])->values()->toArray();
        $this->writeJsonFile($templatePath . '/data/menus.json', $menusData);
        $report['menus_exported'] = count($menusData);

        // Export settings (grouped)
        $settings = Setting::all();
        $settingsData = [];
        foreach ($settings as $setting) {
            $group = $setting->group ?? 'general';
            if (!isset($settingsData[$group])) {
                $settingsData[$group] = [];
            }
            $settingsData[$group][$setting->key] = $setting->value;
        }
        $this->writeJsonFile($templatePath . '/data/settings.json', $settingsData);
        $report['settings_exported'] = $settings->count();

        // Export taxonomies
        $taxonomies = Taxonomy::with('terms')->get();
        $taxonomiesData = $taxonomies->map(fn (Taxonomy $taxonomy): array => [
            'name' => $taxonomy->name,
            'slug' => $taxonomy->slug,
            'type' => $taxonomy->type,
            'description' => $taxonomy->description,
            'terms' => $taxonomy->terms->map(fn (TaxonomyTerm $term): array => [
                'name' => $term->name,
                'slug' => $term->slug,
                'description' => $term->description,
                'order' => $term->order ?? 0,
            ])->values()->toArray(),
        ])->values()->toArray();
        $this->writeJsonFile($templatePath . '/data/taxonomies.json', $taxonomiesData);
        $report['taxonomies_exported'] = $taxonomies->count();

        // Copy media files
        $mediaFiles = Media::limit(50)->get();
        foreach ($mediaFiles as $media) {
            if (Storage::disk($media->disk ?? 'public')->exists($media->path)) {
                $destPath = $templatePath . '/media/' . $media->filename;
                File::copy(
                    Storage::disk($media->disk ?? 'public')->path($media->path),
                    $destPath,
                );
                $report['media_exported']++;
            }
        }

        // Create manifest
        $siteName = Setting::get('general.site_name', 'Site export');
        $siteDescription = Setting::get('general.site_description', 'Template exporte depuis le site actuel');

        $manifest = [
            'name' => is_string($siteName) ? $siteName : 'Site export',
            'slug' => $slug,
            'version' => '1.0.0',
            'description' => is_string($siteDescription) ? $siteDescription : 'Template exporte depuis le site actuel',
            'category' => 'other',
            'tags' => ['export', 'custom'],
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
            'pages_count' => $report['pages_exported'],
            'posts_count' => $report['posts_exported'],
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
            $templatePath . '/artisan-template.json',
            json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        );

        // Clear cache so new template is discoverable
        Cache::forget('cms.templates.discovered');

        Log::info("Template exporte: {$slug}", $report);

        return $report;
    }

    /**
     * List templates grouped by category.
     *
     * @param string|null $category Filter by category (null = all)
     * @return array<string, array<string, mixed>> Templates grouped by category
     */
    public function listByCategory(?string $category = null): array
    {
        $templates = $this->discover();

        if ($category !== null) {
            $templates = array_filter(
                $templates,
                fn (array $t): bool => ($t['category'] ?? '') === $category,
            );
        }

        $grouped = [];
        foreach ($templates as $slug => $template) {
            $cat = $template['category'] ?? 'other';
            $grouped[$cat][$slug] = $template;
        }

        return $grouped;
    }

    /**
     * Check potential conflicts before installation.
     *
     * @param string $slug Template slug
     * @return array<int|string, mixed> List of detected conflicts
     */
    public function checkConflicts(string $slug): array
    {
        $templates = $this->discover();
        $template = $templates[$slug] ?? null;

        if ($template === null) {
            return ['error' => "Template '{$slug}' introuvable."];
        }

        $templatePath = $template['path'];
        $conflicts = [];

        // Check existing pages
        $pagesFile = $templatePath . '/data/pages.json';
        if (File::exists($pagesFile)) {
            $pages = json_decode(File::get($pagesFile), true) ?? [];
            foreach ($pages as $page) {
                $existingPage = Page::where('slug', $page['slug'])->first();
                if ($existingPage !== null) {
                    $conflicts[] = [
                        'type' => 'page',
                        'slug' => $page['slug'],
                        'title' => $page['title'],
                        'existing_title' => $existingPage->title,
                    ];
                }
            }
        }

        // Check existing menus
        $menusFile = $templatePath . '/data/menus.json';
        if (File::exists($menusFile)) {
            $menus = json_decode(File::get($menusFile), true) ?? [];
            foreach ($menus as $menu) {
                $existingMenu = Menu::where('location', $menu['location'])->first();
                if ($existingMenu !== null) {
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
    // Private import helpers
    // -------------------------------------------------------

    /**
     * Import template media files into public storage.
     *
     * @return array<string, mixed> Mapping of old path => new storage path
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
            $mimeType = (string) mime_content_type($file->getPathname());
            $size = $file->getSize();

            // Generate unique name to avoid collisions
            $storedName = Str::uuid()->toString() . '.' . $extension;
            $storagePath = 'media/' . date('Y/m') . '/' . $storedName;

            // Copy to public storage
            Storage::disk('public')->put($storagePath, File::get($file->getPathname()));

            // Create database entry
            $media = Media::create([
                'filename' => $storedName,
                'original_filename' => $originalName,
                'path' => $storagePath,
                'mime_type' => $mimeType,
                'size' => $size,
                'alt_text' => pathinfo($originalName, PATHINFO_FILENAME),
                'disk' => 'public',
            ]);

            // Map template relative path to new storage path
            $relativePath = 'media/' . $file->getRelativePathname();
            $mediaMap[$relativePath] = $storagePath;
            $mediaMap[$originalName] = $storagePath;
            $mediaMap['__media_ids'][$originalName] = $media->id;

            $report['media_imported']++;
        }

        return $mediaMap;
    }

    /**
     * Import taxonomies (categories, tags) from template.
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
                ],
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
                    ],
                );

                $report['taxonomies_created']++;
            }
        }
    }

    /**
     * Import pages from template data.
     *
     * @param array<string, mixed> $mediaMap Media path mapping
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

            if ($existingPage !== null && !$overwrite) {
                $report['skipped'][] = [
                    'type' => 'page',
                    'slug' => $pageData['slug'],
                    'reason' => 'Page existante (slug duplique)',
                ];
                continue;
            }

            // Replace media references in JSON content
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

            if ($existingPage !== null && $overwrite) {
                $existingPage->update($attributes);
            } else {
                $attributes['slug'] = $this->ensureUniqueSlug(
                    $pageData['slug'],
                    Page::class,
                );
                Page::create($attributes);
            }

            // Set as homepage if indicated
            if ($pageData['is_homepage'] ?? false) {
                Setting::set('homepage_id', (string) Page::where('slug', $attributes['slug'])->value('id'));
            }

            $report['pages_created']++;
        }
    }

    /**
     * Import demo posts from template data.
     *
     * @param array<string, mixed> $mediaMap Media path mapping
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

            if ($existingPost !== null && !$overwrite) {
                $report['skipped'][] = [
                    'type' => 'post',
                    'slug' => $postData['slug'],
                    'reason' => 'Article existant (slug duplique)',
                ];
                continue;
            }

            $content = $this->replaceMediaReferences($postData['content'] ?? [], $mediaMap);

            // Resolve featured image
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

            $post = null;

            if ($existingPost !== null && $overwrite) {
                $existingPost->update($attributes);
            } else {
                $attributes['slug'] = $this->ensureUniqueSlug(
                    $postData['slug'],
                    Post::class,
                );
                $post = Post::create($attributes);
            }

            // Attach taxonomies if provided
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
     * Import navigation menus from template data.
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

            if ($existingMenu !== null && !$overwrite) {
                $report['skipped'][] = [
                    'type' => 'menu',
                    'location' => $menuData['location'],
                    'reason' => 'Menu existant a cet emplacement',
                ];
                continue;
            }

            if ($existingMenu !== null && $overwrite) {
                // Delete old items before replacing
                $existingMenu->items()->delete();
                $menu = $existingMenu;
                $menu->update(['name' => $menuData['name']]);
            } else {
                $menu = Menu::create([
                    'name' => $menuData['name'],
                    'slug' => Str::slug($menuData['name']),
                    'location' => $menuData['location'],
                ]);
            }

            // Create menu items
            $this->createMenuItems($menu, $menuData['items'] ?? [], null);

            $report['menus_created']++;
        }
    }

    /**
     * Recursively create menu items.
     *
     * @param array<int, array<string, mixed>> $items
     */
    protected function createMenuItems(Menu $menu, array $items, ?int $parentId): void
    {
        foreach ($items as $index => $itemData) {
            // Resolve URL to a page if it's a page reference
            $url = $itemData['url'] ?? '#';
            $linkableId = null;
            $linkableType = null;

            if (isset($itemData['page_slug'])) {
                $page = Page::where('slug', $itemData['page_slug'])->first();
                if ($page !== null) {
                    $linkableId = $page->id;
                    $linkableType = Page::class;
                    $url = '/' . $page->slug;
                }
            }

            $menuItem = MenuItem::create([
                'menu_id' => $menu->id,
                'parent_id' => $parentId,
                'label' => $itemData['label'] ?? $itemData['title'] ?? '',
                'type' => $linkableType !== null ? 'page' : 'url',
                'url' => $url,
                'linkable_id' => $linkableId,
                'linkable_type' => $linkableType,
                'target' => $itemData['target'] ?? '_self',
                'order' => $itemData['order'] ?? $index,
            ]);

            // Child items (sub-menus)
            if (!empty($itemData['children'])) {
                $this->createMenuItems($menu, $itemData['children'], $menuItem->id);
            }
        }
    }

    /**
     * Apply template settings to the site.
     */
    protected function importSettings(string $templatePath, bool $overwrite, array &$report): void
    {
        $file = $templatePath . '/data/settings.json';

        if (!File::exists($file)) {
            return;
        }

        $settings = json_decode(File::get($file), true) ?? [];

        foreach ($settings as $group => $values) {
            if (is_array($values)) {
                // Grouped settings: { "general": { "site_name": "..." } }
                foreach ($values as $key => $value) {
                    $fullKey = $group . '.' . $key;
                    $existing = Setting::where('group', $group)->where('key', $key)->first();

                    if ($existing !== null && !$overwrite) {
                        $report['skipped'][] = [
                            'type' => 'setting',
                            'key' => $fullKey,
                            'reason' => 'Setting existant',
                        ];
                        continue;
                    }

                    Setting::set($fullKey, $value);
                    $report['settings_applied']++;
                }
            } else {
                // Flat settings: { "site_name": "..." }
                $existing = Setting::where('key', $group)->first();

                if ($existing !== null && !$overwrite) {
                    $report['skipped'][] = [
                        'type' => 'setting',
                        'key' => $group,
                        'reason' => 'Setting existant',
                    ];
                    continue;
                }

                Setting::set($group, $values);
                $report['settings_applied']++;
            }
        }
    }

    /**
     * Apply theme overrides from template.
     *
     * @param array<string, mixed> $template Template manifest data
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

        // Update theme customizations on the active theme model
        $theme = CmsTheme::where('slug', $themeSlug)->first();
        if ($theme !== null) {
            $theme->update(['customizations' => $overrides]);
        }
    }

    // -------------------------------------------------------
    // Utilities
    // -------------------------------------------------------

    /**
     * Replace media references in block JSON content.
     * Templates refer to media by filename; this method replaces them
     * with actual storage paths after import.
     *
     * @param array<string, mixed> $content Block tree content
     * @param array<string, mixed> $mediaMap Media path mapping
     * @return array<string, mixed> Content with replaced paths
     */
    protected function replaceMediaReferences(array $content, array $mediaMap): array
    {
        array_walk_recursive($content, function (mixed &$value) use ($mediaMap): void {
            if (is_string($value)) {
                foreach ($mediaMap as $original => $replacement) {
                    if (str_starts_with((string) $original, '__')) {
                        continue; // Skip special keys
                    }
                    if (is_string($replacement) && str_contains($value, (string) $original)) {
                        $value = str_replace((string) $original, '/storage/' . $replacement, $value);
                    }
                }
            }
        });

        return $content;
    }

    /**
     * Generate a unique slug to avoid duplicates.
     *
     * @param class-string<\Illuminate\Database\Eloquent\Model> $modelClass
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
     * Attach taxonomies to a model (post, page).
     *
     * @param array<string, array<int, string>> $taxonomies Mapping of taxonomy slug => term slugs
     */
    protected function attachTaxonomies(Post $model, array $taxonomies): void
    {
        foreach ($taxonomies as $taxonomySlug => $termSlugs) {
            $taxonomy = Taxonomy::where('slug', $taxonomySlug)->first();
            if ($taxonomy === null) {
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
     * Generate a public URL for a template asset (for preview).
     */
    protected function getTemplateAssetUrl(string $slug, string $relativePath): string
    {
        return url("content/templates/{$slug}/{$relativePath}");
    }

    /**
     * Clean up imported media on failure (rollback).
     *
     * @param array<string, mixed> $mediaMap Media path mapping to clean up
     */
    protected function cleanupImportedMedia(array $mediaMap): void
    {
        foreach ($mediaMap as $key => $path) {
            if (str_starts_with((string) $key, '__')) {
                continue;
            }
            if (is_string($path) && Storage::disk('public')->exists($path)) {
                Storage::disk('public')->delete($path);
            }
        }
    }

    /**
     * Write data as a formatted JSON file.
     *
     * @param array<mixed> $data
     */
    protected function writeJsonFile(string $path, array $data): void
    {
        File::put(
            $path,
            json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        );
    }
}
