<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Menu;
use App\Models\MenuItem;
use App\Models\Page;
use App\Models\Setting;
use Illuminate\Support\Facades\DB;

class SiteTemplateService
{
    /**
     * Get all available templates from content/templates/ directory.
     *
     * @return array<int, array<string, mixed>>
     */
    public function getAvailableTemplates(): array
    {
        $templates = [];
        $templatesDir = base_path('content/templates');

        if (!is_dir($templatesDir)) {
            return [];
        }

        foreach (glob("{$templatesDir}/*/artisan-template.json") ?: [] as $manifestFile) {
            $content = file_get_contents($manifestFile);
            if ($content === false) continue;

            $manifest = json_decode($content, true);
            if (!is_array($manifest)) continue;

            $templateDir = dirname($manifestFile);
            $slug = $manifest['slug'] ?? basename($templateDir);
            $manifest['preview_image'] = $this->getPreviewImage($templateDir, $slug);
            $templates[] = $manifest;
        }

        return $templates;
    }

    /**
     * Install a template by its slug.
     */
    public function install(string $slug): void
    {
        $templatePath = base_path("content/templates/{$slug}");
        $manifestFile = "{$templatePath}/artisan-template.json";

        if (!file_exists($manifestFile)) {
            throw new \RuntimeException("Template '{$slug}' introuvable dans content/templates/");
        }

        $content = file_get_contents($manifestFile);
        if ($content === false) {
            throw new \RuntimeException("Impossible de lire le template '{$slug}'");
        }

        $manifest = json_decode($content, true);
        if (!is_array($manifest)) {
            throw new \RuntimeException("Format du template '{$slug}' invalide");
        }

        DB::transaction(function () use ($manifest): void {
            $pageIdMap = [];

            // Install pages
            foreach ($manifest['pages'] ?? [] as $pageData) {
                $page = Page::create([
                    'title'            => $pageData['title'],
                    'slug'             => $pageData['slug'],
                    'content'          => $pageData['content'] ?? ['blocks' => []],
                    'status'           => 'published',
                    'template'         => $pageData['template'] ?? 'default',
                    'meta_title'       => $pageData['meta_title'] ?? $pageData['title'],
                    'meta_description' => $pageData['meta_description'] ?? null,
                    'published_at'     => now(),
                    'created_by'       => auth()->id() ?? 1,
                ]);
                $pageIdMap[$pageData['id']] = $page->id;
            }

            // Install menus
            foreach ($manifest['menus'] ?? [] as $menuData) {
                $menu = Menu::create([
                    'name'     => $menuData['name'],
                    'slug'     => $menuData['slug'],
                    'location' => $menuData['location'] ?? null,
                ]);

                foreach ($menuData['items'] ?? [] as $order => $item) {
                    $pageId = isset($item['page_id']) ? ($pageIdMap[$item['page_id']] ?? null) : null;
                    MenuItem::create([
                        'menu_id'   => $menu->id,
                        'parent_id' => null,
                        'label'     => $item['label'],
                        'url'       => $pageId ? null : ($item['url'] ?? '#'),
                        'page_id'   => $pageId,
                        'target'    => $item['target'] ?? '_self',
                        'order'     => $item['order'] ?? $order,
                    ]);
                }
            }

            // Apply settings
            foreach ($manifest['settings'] ?? [] as $key => $value) {
                Setting::set($key, $value);
            }
        });
    }

    /**
     * Export current site content as a template manifest.
     *
     * @return array<string, mixed>
     */
    public function export(string $name, string $slug): array
    {
        $pages = Page::where('status', 'published')->get()->map(fn ($p) => [
            'id'               => (string)$p->id,
            'title'            => $p->title,
            'slug'             => $p->slug,
            'content'          => $p->content,
            'template'         => $p->template,
            'meta_title'       => $p->meta_title,
            'meta_description' => $p->meta_description,
        ])->toArray();

        $menus = Menu::with('items')->get()->map(fn ($m) => [
            'name'     => $m->name,
            'slug'     => $m->slug,
            'location' => $m->location,
            'items'    => $m->items->map(fn ($i) => [
                'label'   => $i->label,
                'url'     => $i->url,
                'page_id' => $i->page_id ? (string)$i->page_id : null,
                'target'  => $i->target ?? '_self',
                'order'   => $i->order,
            ])->toArray(),
        ])->toArray();

        return [
            'name'        => $name,
            'slug'        => $slug,
            'version'     => '1.0.0',
            'category'    => 'custom',
            'description' => "Template exporté depuis ArtisanCMS",
            'pages'       => $pages,
            'menus'       => $menus,
            'settings'    => [],
        ];
    }

    private function getPreviewImage(string $templatePath, string $slug): ?string
    {
        foreach (['jpg', 'jpeg', 'png', 'webp'] as $ext) {
            if (file_exists("{$templatePath}/preview.{$ext}")) {
                return "/content/templates/{$slug}/preview.{$ext}";
            }
        }
        return null;
    }
}
