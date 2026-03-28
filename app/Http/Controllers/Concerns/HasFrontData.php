<?php

declare(strict_types=1);

namespace App\Http\Controllers\Concerns;

use App\CMS\Facades\CMS;
use App\CMS\Themes\ThemeManager;
use App\Models\Menu;
use App\Services\SettingService;
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

        /** @var SettingService $settings */
        $settings = app(SettingService::class);
        $slug = $theme?->slug ?? 'default';

        return [
            'menus' => $menus,
            'theme' => [
                'slug' => $slug,
                'customizations' => $theme ? $themeManager->getAllCustomizations($theme->slug) : [],
                'layouts' => $themeConfig['layouts'] ?? [],
                'supports' => $themeConfig['supports'] ?? [],
                'style' => $themeConfig['style'] ?? null,
                'custom_css' => (string) $settings->get("theme.{$slug}_custom_css", ''),
                'custom_js' => (string) $settings->get("theme.{$slug}_custom_js", ''),
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
