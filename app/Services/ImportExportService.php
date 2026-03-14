<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Menu;
use App\Models\MenuItem;
use App\Models\Page;
use App\Models\Post;
use App\Models\Setting;
use App\Models\Taxonomy;
use App\Models\TaxonomyTerm;
use Illuminate\Support\Str;

class ImportExportService
{
    /**
     * Export all pages as array.
     *
     * @return array<int, array<string, mixed>>
     */
    public function exportPages(): array
    {
        return Page::with(['children', 'terms.taxonomy'])
            ->orderBy('order')
            ->get()
            ->map(fn (Page $page) => [
                'title' => $page->title,
                'slug' => $page->slug,
                'content' => $page->content,
                'status' => $page->status,
                'template' => $page->template,
                'meta_title' => $page->meta_title,
                'meta_description' => $page->meta_description,
                'meta_keywords' => $page->meta_keywords,
                'og_image' => $page->og_image,
                'parent_slug' => $page->parent?->slug,
                'order' => $page->order,
                'published_at' => $page->published_at?->toIso8601String(),
            ])
            ->toArray();
    }

    /**
     * Export all posts as array.
     *
     * @return array<int, array<string, mixed>>
     */
    public function exportPosts(): array
    {
        return Post::with(['terms.taxonomy'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn (Post $post) => [
                'title' => $post->title,
                'slug' => $post->slug,
                'content' => $post->content,
                'excerpt' => $post->excerpt,
                'status' => $post->status,
                'featured_image' => $post->featured_image,
                'published_at' => $post->published_at?->toIso8601String(),
                'taxonomies' => $post->terms->map(fn (TaxonomyTerm $term) => [
                    'taxonomy' => $term->taxonomy->slug ?? $term->taxonomy->name ?? '',
                    'term' => $term->slug,
                    'name' => $term->name,
                ])->toArray(),
            ])
            ->toArray();
    }

    /**
     * Export menus with items tree.
     *
     * @return array<int, array<string, mixed>>
     */
    public function exportMenus(): array
    {
        return Menu::with(['items' => fn ($q) => $q->orderBy('order')])
            ->get()
            ->map(fn (Menu $menu) => [
                'name' => $menu->name,
                'slug' => $menu->slug,
                'location' => $menu->location,
                'items' => $this->buildMenuItemsTree($menu->rootItems()->with('children')->get()),
            ])
            ->toArray();
    }

    /**
     * Export CMS settings.
     *
     * @return array<int, array<string, mixed>>
     */
    public function exportSettings(): array
    {
        return Setting::all()
            ->map(fn (Setting $setting) => [
                'group' => $setting->group,
                'key' => $setting->key,
                'value' => $setting->value,
                'type' => $setting->type,
            ])
            ->toArray();
    }

    /**
     * Full site export.
     *
     * @return array<string, mixed>
     */
    public function exportAll(): array
    {
        return [
            'version' => config('cms.version', '1.0.0'),
            'exported_at' => now()->toIso8601String(),
            'pages' => $this->exportPages(),
            'posts' => $this->exportPosts(),
            'menus' => $this->exportMenus(),
            'settings' => $this->exportSettings(),
            'taxonomies' => $this->exportTaxonomies(),
        ];
    }

    /**
     * Export taxonomies with terms.
     *
     * @return array<int, array<string, mixed>>
     */
    public function exportTaxonomies(): array
    {
        return Taxonomy::with('terms')
            ->get()
            ->map(fn (Taxonomy $taxonomy) => [
                'name' => $taxonomy->name,
                'slug' => $taxonomy->slug,
                'type' => $taxonomy->type,
                'description' => $taxonomy->description,
                'hierarchical' => $taxonomy->hierarchical,
                'terms' => $taxonomy->terms->map(fn (TaxonomyTerm $term) => [
                    'name' => $term->name,
                    'slug' => $term->slug,
                    'description' => $term->description ?? null,
                ])->toArray(),
            ])
            ->toArray();
    }

    /**
     * Import pages, handle slug conflicts.
     *
     * @param array<int, array<string, mixed>> $data
     * @return array{created: int, skipped: int, errors: list<string>}
     */
    public function importPages(array $data): array
    {
        $stats = ['created' => 0, 'skipped' => 0, 'errors' => []];

        foreach ($data as $pageData) {
            try {
                $slug = $pageData['slug'] ?? Str::slug($pageData['title'] ?? '');

                if (Page::where('slug', $slug)->exists()) {
                    $slug = $slug . '-' . Str::random(4);
                }

                $parentId = null;
                if (!empty($pageData['parent_slug'])) {
                    $parentId = Page::where('slug', $pageData['parent_slug'])->value('id');
                }

                Page::create([
                    'title' => $pageData['title'] ?? 'Sans titre',
                    'slug' => $slug,
                    'content' => $pageData['content'] ?? null,
                    'status' => $pageData['status'] ?? 'draft',
                    'template' => $pageData['template'] ?? null,
                    'meta_title' => $pageData['meta_title'] ?? null,
                    'meta_description' => $pageData['meta_description'] ?? null,
                    'meta_keywords' => $pageData['meta_keywords'] ?? null,
                    'og_image' => $pageData['og_image'] ?? null,
                    'parent_id' => $parentId,
                    'order' => $pageData['order'] ?? 0,
                    'published_at' => $pageData['published_at'] ?? null,
                    'created_by' => auth()->id(),
                ]);

                $stats['created']++;
            } catch (\Throwable $e) {
                $stats['errors'][] = sprintf(
                    'Page "%s": %s',
                    $pageData['title'] ?? 'inconnu',
                    $e->getMessage()
                );
            }
        }

        return $stats;
    }

    /**
     * Import posts, handle slug conflicts.
     *
     * @param array<int, array<string, mixed>> $data
     * @return array{created: int, skipped: int, errors: list<string>}
     */
    public function importPosts(array $data): array
    {
        $stats = ['created' => 0, 'skipped' => 0, 'errors' => []];

        foreach ($data as $postData) {
            try {
                $slug = $postData['slug'] ?? Str::slug($postData['title'] ?? '');

                if (Post::where('slug', $slug)->exists()) {
                    $slug = $slug . '-' . Str::random(4);
                }

                $post = Post::create([
                    'title' => $postData['title'] ?? 'Sans titre',
                    'slug' => $slug,
                    'content' => $postData['content'] ?? null,
                    'excerpt' => $postData['excerpt'] ?? null,
                    'status' => $postData['status'] ?? 'draft',
                    'featured_image' => $postData['featured_image'] ?? null,
                    'published_at' => $postData['published_at'] ?? null,
                    'created_by' => auth()->id(),
                ]);

                // Attach taxonomies if present
                if (!empty($postData['taxonomies'])) {
                    $this->attachTaxonomies($post, $postData['taxonomies']);
                }

                $stats['created']++;
            } catch (\Throwable $e) {
                $stats['errors'][] = sprintf(
                    'Article "%s": %s',
                    $postData['title'] ?? 'inconnu',
                    $e->getMessage()
                );
            }
        }

        return $stats;
    }

    /**
     * Import menus with items.
     *
     * @param array<int, array<string, mixed>> $data
     * @return array{created: int, skipped: int, errors: list<string>}
     */
    public function importMenus(array $data): array
    {
        $stats = ['created' => 0, 'skipped' => 0, 'errors' => []];

        foreach ($data as $menuData) {
            try {
                $slug = $menuData['slug'] ?? Str::slug($menuData['name'] ?? '');

                if (Menu::where('slug', $slug)->exists()) {
                    $slug = $slug . '-' . Str::random(4);
                }

                $menu = Menu::create([
                    'name' => $menuData['name'] ?? 'Menu',
                    'slug' => $slug,
                    'location' => $menuData['location'] ?? null,
                ]);

                if (!empty($menuData['items'])) {
                    $this->importMenuItems($menu, $menuData['items']);
                }

                $stats['created']++;
            } catch (\Throwable $e) {
                $stats['errors'][] = sprintf(
                    'Menu "%s": %s',
                    $menuData['name'] ?? 'inconnu',
                    $e->getMessage()
                );
            }
        }

        return $stats;
    }

    /**
     * Full import (pages + posts + menus + settings + taxonomies).
     *
     * @param array<string, mixed> $data
     * @return array<string, array{created: int, skipped: int, errors: list<string>}>
     */
    public function importAll(array $data): array
    {
        $results = [];

        if (!empty($data['taxonomies'])) {
            $results['taxonomies'] = $this->importTaxonomies($data['taxonomies']);
        }

        if (!empty($data['pages'])) {
            $results['pages'] = $this->importPages($data['pages']);
        }

        if (!empty($data['posts'])) {
            $results['posts'] = $this->importPosts($data['posts']);
        }

        if (!empty($data['menus'])) {
            $results['menus'] = $this->importMenus($data['menus']);
        }

        if (!empty($data['settings'])) {
            $results['settings'] = $this->importSettings($data['settings']);
        }

        return $results;
    }

    /**
     * Parse WordPress WXR XML export and import content.
     *
     * @return array<string, array{created: int, skipped: int, errors: list<string>}>
     */
    public function importFromWordPress(string $xmlContent): array
    {
        $results = [];

        try {
            $xml = simplexml_load_string($xmlContent, 'SimpleXMLElement', LIBXML_NOCDATA);

            if ($xml === false) {
                return ['global' => ['created' => 0, 'skipped' => 0, 'errors' => ['Fichier XML invalide.']]];
            }

            $channel = $xml->channel;
            $wpNamespace = 'http://wordpress.org/export/1.2/';
            $contentNamespace = 'http://purl.org/rss/1.0/modules/content/';
            $dcNamespace = 'http://purl.org/dc/elements/1.1/';

            $pages = [];
            $posts = [];
            $categories = [];
            $tags = [];

            // Extract categories
            foreach ($channel->children($wpNamespace)->category ?? [] as $cat) {
                $categories[] = [
                    'name' => (string) $cat->cat_name,
                    'slug' => (string) $cat->category_nicename,
                ];
            }

            // Extract tags
            foreach ($channel->children($wpNamespace)->tag ?? [] as $tag) {
                $tags[] = [
                    'name' => (string) $tag->tag_name,
                    'slug' => (string) $tag->tag_slug,
                ];
            }

            // Extract posts and pages
            foreach ($channel->item as $item) {
                $wp = $item->children($wpNamespace);
                $content = $item->children($contentNamespace);

                $postType = (string) ($wp->post_type ?? 'post');
                $status = (string) ($wp->status ?? 'draft');

                // Map WordPress status to ArtisanCMS status
                $mappedStatus = match ($status) {
                    'publish' => 'published',
                    'draft' => 'draft',
                    'pending' => 'draft',
                    'private' => 'draft',
                    default => 'draft',
                };

                // Get taxonomy terms for this item
                $itemTaxonomies = [];
                foreach ($item->category ?? [] as $cat) {
                    $domain = (string) $cat->attributes()->domain;
                    if ($domain === 'category' || $domain === 'post_tag') {
                        $itemTaxonomies[] = [
                            'taxonomy' => $domain === 'category' ? 'categories' : 'tags',
                            'term' => (string) $cat->attributes()->nicename,
                            'name' => (string) $cat,
                        ];
                    }
                }

                $htmlContent = (string) ($content->encoded ?? '');
                // Wrap HTML content in a basic block structure
                $blockContent = !empty($htmlContent) ? [
                    [
                        'type' => 'text-block',
                        'props' => ['content' => $htmlContent],
                    ],
                ] : null;

                $entry = [
                    'title' => (string) ($item->title ?? ''),
                    'slug' => (string) ($wp->post_name ?? Str::slug((string) ($item->title ?? ''))),
                    'content' => $blockContent,
                    'status' => $mappedStatus,
                    'published_at' => !empty((string) ($wp->post_date ?? '')) ? (string) $wp->post_date : null,
                ];

                if ($postType === 'page') {
                    $entry['template'] = null;
                    $entry['meta_title'] = null;
                    $entry['meta_description'] = null;
                    $pages[] = $entry;
                } else {
                    $excerpt = (string) ($item->children('http://wordpress.org/export/1.2/excerpt/')->encoded ?? '');
                    $entry['excerpt'] = $excerpt ?: null;
                    $entry['featured_image'] = null;
                    $entry['taxonomies'] = $itemTaxonomies;
                    $posts[] = $entry;
                }
            }

            // Import taxonomies (categories + tags)
            if (!empty($categories) || !empty($tags)) {
                $taxonomyData = [];

                if (!empty($categories)) {
                    $taxonomyData[] = [
                        'name' => 'Catégories',
                        'slug' => 'categories',
                        'type' => 'category',
                        'hierarchical' => true,
                        'terms' => $categories,
                    ];
                }

                if (!empty($tags)) {
                    $taxonomyData[] = [
                        'name' => 'Tags',
                        'slug' => 'tags',
                        'type' => 'tag',
                        'hierarchical' => false,
                        'terms' => $tags,
                    ];
                }

                $results['taxonomies'] = $this->importTaxonomies($taxonomyData);
            }

            if (!empty($pages)) {
                $results['pages'] = $this->importPages($pages);
            }

            if (!empty($posts)) {
                $results['posts'] = $this->importPosts($posts);
            }
        } catch (\Throwable $e) {
            $results['global'] = ['created' => 0, 'skipped' => 0, 'errors' => [$e->getMessage()]];
        }

        return $results;
    }

    // ─── Internal methods ─────────────────────────────────

    /**
     * Import taxonomies with terms.
     *
     * @param array<int, array<string, mixed>> $data
     * @return array{created: int, skipped: int, errors: list<string>}
     */
    protected function importTaxonomies(array $data): array
    {
        $stats = ['created' => 0, 'skipped' => 0, 'errors' => []];

        foreach ($data as $taxData) {
            try {
                $taxonomy = Taxonomy::firstOrCreate(
                    ['slug' => $taxData['slug'] ?? Str::slug($taxData['name'] ?? '')],
                    [
                        'name' => $taxData['name'] ?? '',
                        'type' => $taxData['type'] ?? 'category',
                        'description' => $taxData['description'] ?? null,
                        'hierarchical' => $taxData['hierarchical'] ?? false,
                    ],
                );

                foreach ($taxData['terms'] ?? [] as $termData) {
                    TaxonomyTerm::firstOrCreate(
                        [
                            'taxonomy_id' => $taxonomy->id,
                            'slug' => $termData['slug'] ?? Str::slug($termData['name'] ?? ''),
                        ],
                        [
                            'name' => $termData['name'] ?? '',
                            'description' => $termData['description'] ?? null,
                        ],
                    );
                }

                $stats['created']++;
            } catch (\Throwable $e) {
                $stats['errors'][] = sprintf(
                    'Taxonomie "%s": %s',
                    $taxData['name'] ?? 'inconnu',
                    $e->getMessage()
                );
            }
        }

        return $stats;
    }

    /**
     * Import settings.
     *
     * @param array<int, array<string, mixed>> $data
     * @return array{created: int, skipped: int, errors: list<string>}
     */
    protected function importSettings(array $data): array
    {
        $stats = ['created' => 0, 'skipped' => 0, 'errors' => []];

        foreach ($data as $settingData) {
            try {
                $key = ($settingData['group'] ?? 'general') . '.' . ($settingData['key'] ?? '');
                Setting::set($key, $settingData['value'] ?? null);
                $stats['created']++;
            } catch (\Throwable $e) {
                $stats['errors'][] = sprintf(
                    'Paramètre "%s.%s": %s',
                    $settingData['group'] ?? '',
                    $settingData['key'] ?? '',
                    $e->getMessage()
                );
            }
        }

        return $stats;
    }

    /**
     * Attach taxonomy terms to a post.
     *
     * @param array<int, array<string, string>> $taxonomies
     */
    protected function attachTaxonomies(Post $post, array $taxonomies): void
    {
        $termIds = [];

        foreach ($taxonomies as $taxData) {
            $taxonomy = Taxonomy::where('slug', $taxData['taxonomy'])->first();

            if (!$taxonomy) {
                continue;
            }

            $term = TaxonomyTerm::where('taxonomy_id', $taxonomy->id)
                ->where('slug', $taxData['term'])
                ->first();

            if ($term) {
                $termIds[] = $term->id;
            }
        }

        if (!empty($termIds)) {
            $post->terms()->syncWithoutDetaching($termIds);
        }
    }

    /**
     * Build menu items tree for export.
     *
     * @param \Illuminate\Database\Eloquent\Collection<int, MenuItem> $items
     * @return array<int, array<string, mixed>>
     */
    protected function buildMenuItemsTree($items): array
    {
        return $items->map(fn (MenuItem $item) => [
            'label' => $item->label,
            'type' => $item->type,
            'url' => $item->url,
            'target' => $item->target,
            'css_class' => $item->css_class,
            'icon' => $item->icon,
            'order' => $item->order,
            'children' => $item->children->isNotEmpty()
                ? $this->buildMenuItemsTree($item->children)
                : [],
        ])->toArray();
    }

    /**
     * Import menu items recursively.
     *
     * @param array<int, array<string, mixed>> $items
     */
    protected function importMenuItems(Menu $menu, array $items, ?int $parentId = null): void
    {
        foreach ($items as $index => $itemData) {
            $menuItem = MenuItem::create([
                'menu_id' => $menu->id,
                'parent_id' => $parentId,
                'label' => $itemData['label'] ?? '',
                'type' => $itemData['type'] ?? 'custom',
                'url' => $itemData['url'] ?? '#',
                'target' => $itemData['target'] ?? '_self',
                'css_class' => $itemData['css_class'] ?? null,
                'icon' => $itemData['icon'] ?? null,
                'order' => $itemData['order'] ?? $index,
            ]);

            if (!empty($itemData['children'])) {
                $this->importMenuItems($menu, $itemData['children'], $menuItem->id);
            }
        }
    }
}
