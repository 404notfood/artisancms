<?php

declare(strict_types=1);

namespace Ecommerce\Http\Controllers\Concerns;

use App\CMS\Themes\ThemeManager;
use App\Models\Menu;

trait HasThemeAndMenus
{
    private function themeAndMenus(): array
    {
        /** @var ThemeManager $themeManager */
        $themeManager = app(ThemeManager::class);

        $menus = Menu::with(['items' => function ($query) {
            $query->orderBy('order');
        }])->get()->keyBy('location');

        $theme = $themeManager->getActive();
        $themeConfig = $theme ? $themeManager->getThemeConfig($theme->slug) : [];

        return [
            'menus' => $menus,
            'theme' => [
                'slug'           => $theme?->slug ?? 'default',
                'customizations' => $theme ? $themeManager->getAllCustomizations($theme->slug) : [],
                'layouts'        => $themeConfig['layouts'] ?? [],
                'supports'       => $themeConfig['supports'] ?? [],
            ],
        ];
    }
}
