<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Page;
use App\Models\Menu;
use App\Models\Post;
use App\Models\PreviewToken;
use App\CMS\Themes\ThemeManager;
use Inertia\Inertia;
use Inertia\Response;

class FrontController extends Controller
{
    public function __construct(
        private readonly ThemeManager $themeManager,
    ) {}

    public function home(): Response
    {
        $page = Page::where('slug', 'home')
            ->where('status', 'published')
            ->first();

        if (!$page) {
            $page = Page::where('status', 'published')
                ->orderBy('created_at')
                ->first();
        }

        return $this->renderPage($page);
    }

    public function show(string $slug): Response
    {
        $page = Page::where('slug', $slug)
            ->where('status', 'published')
            ->firstOrFail();

        return $this->renderPage($page);
    }

    public function preview(string $token): Response
    {
        $previewToken = PreviewToken::where('token', $token)
            ->valid()
            ->firstOrFail();

        $previewable = $previewToken->previewable;

        if (!$previewable) {
            abort(404);
        }

        $menus = Menu::with(['items' => function ($query) {
            $query->orderBy('order');
        }])->get()->keyBy('location');

        $theme = $this->themeManager->getActive();
        $themeConfig = $theme ? $this->themeManager->getThemeConfig($theme->slug) : [];

        $data = [
            'menus' => $menus,
            'theme' => [
                'customizations' => $theme?->customizations ?? $this->getDefaultCustomizations($themeConfig),
                'layouts' => $themeConfig['layouts'] ?? [],
            ],
            'isPreview' => true,
        ];

        if ($previewable instanceof Page) {
            $data['page'] = $previewable;
            return Inertia::render('Front/Page', $data);
        }

        if ($previewable instanceof Post) {
            $previewable->load('terms');
            $data['post'] = $previewable;
            return Inertia::render('Front/Page', $data);
        }

        abort(404);
    }

    private function renderPage(?Page $page): Response
    {
        $menus = Menu::with(['items' => function ($query) {
            $query->orderBy('order');
        }])->get()->keyBy('location');

        $theme = $this->themeManager->getActive();
        $themeConfig = $theme ? $this->themeManager->getThemeConfig($theme->slug) : [];

        return Inertia::render('Front/Page', [
            'page' => $page,
            'menus' => $menus,
            'theme' => [
                'customizations' => $theme?->customizations ?? $this->getDefaultCustomizations($themeConfig),
                'layouts' => $themeConfig['layouts'] ?? [],
            ],
        ]);
    }

    /**
     * Extract default values from theme customization config.
     *
     * @param array<string, mixed> $themeConfig
     * @return array<string, string>
     */
    private function getDefaultCustomizations(array $themeConfig): array
    {
        if (!isset($themeConfig['customization'])) {
            return [];
        }

        $defaults = [];

        /** @var array<string, array<string, mixed>> $items */
        foreach ($themeConfig['customization'] as $group => $items) {
            if (!is_array($items)) {
                continue;
            }
            foreach ($items as $key => $config) {
                if (is_array($config) && isset($config['default'])) {
                    $defaults["{$group}.{$key}"] = (string) $config['default'];
                }
            }
        }

        return $defaults;
    }
}
