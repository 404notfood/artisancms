<?php

declare(strict_types=1);

namespace App\Http\Controllers\Front;

use App\CMS\Themes\ThemeManager;
use App\Http\Controllers\Controller;
use App\Models\Menu;
use App\Models\Page;
use App\Models\Post;
use App\Models\Setting;
use Inertia\Inertia;
use Inertia\Response;

class ErrorController extends Controller
{
    public function __construct(
        private readonly ThemeManager $themeManager,
    ) {}

    /**
     * Render the custom 404 page with Inertia.
     */
    public function notFound(): Response
    {
        $recentPages = Page::where('status', 'published')
            ->select(['id', 'title', 'slug'])
            ->orderByDesc('published_at')
            ->limit(5)
            ->get()
            ->map(fn (Page $p) => [
                'title' => $p->title,
                'url' => "/{$p->slug}",
            ]);

        $recentPosts = Post::published()
            ->select(['id', 'title', 'slug', 'published_at'])
            ->orderByDesc('published_at')
            ->limit(5)
            ->get()
            ->map(fn (Post $p) => [
                'title' => $p->title,
                'url' => "/blog/{$p->slug}",
            ]);

        return Inertia::render('Front/Error404', [
            ...$this->frontData(),
            'recentPages' => $recentPages,
            'recentPosts' => $recentPosts,
        ]);
    }

    /**
     * Render the maintenance page with Inertia.
     */
    public function maintenance(): Response|\Illuminate\Http\RedirectResponse
    {
        $settingService = app(\App\Services\SettingService::class);
        $enabled = $settingService->get('maintenance.enabled');

        if ($enabled !== '1' && $enabled !== 'true' && $enabled !== true) {
            return redirect('/');
        }

        return Inertia::render('Front/Maintenance', [
            'message' => $settingService->get('maintenance.message', 'Le site est actuellement en maintenance. Merci de votre patience.'),
        ]);
    }

    /**
     * Get shared front-end data (menus, theme).
     *
     * @return array<string, mixed>
     */
    private function frontData(): array
    {
        $menus = Menu::with(['items' => function ($query): void {
            $query->orderBy('order');
        }])->get()->keyBy('location');

        $theme = $this->themeManager->getActive();
        $themeConfig = $theme ? $this->themeManager->getThemeConfig($theme->slug) : [];

        return [
            'menus' => $menus,
            'theme' => [
                'customizations' => $theme?->customizations ?? [],
                'layouts' => $themeConfig['layouts'] ?? [],
            ],
        ];
    }
}
