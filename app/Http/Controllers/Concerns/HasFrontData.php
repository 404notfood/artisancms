<?php

declare(strict_types=1);

namespace App\Http\Controllers\Concerns;

use App\CMS\Facades\CMS;
use App\CMS\Themes\ThemeManager;
use App\Models\Menu;
use Illuminate\Database\Eloquent\Model;

trait HasFrontData
{
    /**
     * @return array{menus: mixed, theme: array<string, mixed>}
     */
    private function frontData(): array
    {
        /** @var ThemeManager $themeManager */
        $themeManager = app(ThemeManager::class);

        $menus = Menu::with(['items' => fn ($q) => $q->orderBy('order')])
            ->get()
            ->keyBy('location');

        $theme = $themeManager->getActive();
        $themeConfig = $theme ? $themeManager->getThemeConfig($theme->slug) : [];

        return [
            'menus' => $menus,
            'theme' => [
                'slug' => $theme?->slug ?? 'default',
                'customizations' => $theme ? $themeManager->getAllCustomizations($theme->slug) : [],
                'layouts' => $themeConfig['layouts'] ?? [],
                'supports' => $themeConfig['supports'] ?? [],
                'style' => $themeConfig['style'] ?? null,
            ],
        ];
    }

    /**
     * Build SEO meta data for a page or post by applying the page.head filter chain.
     *
     * @return array<string, mixed>
     */
    private function buildSeoMeta(Model $entity): array
    {
        return CMS::applyFilter('page.head', [], $entity);
    }
}
