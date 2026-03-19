<?php

declare(strict_types=1);

namespace MemberSpace\Http\Controllers\Concerns;

use App\CMS\Themes\ThemeManager;
use App\Models\Menu;

trait HasThemeAndMenus
{
    protected function themeAndMenus(): array
    {
        $themeManager = app(ThemeManager::class);

        $menus = Menu::with(['items' => fn ($q) => $q->orderBy('order')])
            ->get()
            ->keyBy('location');

        $theme = $themeManager->getActive();
        $config = $theme ? $themeManager->getThemeConfig($theme->slug) : [];

        return [
            'menus' => $menus,
            'theme' => [
                'slug' => $theme?->slug ?? 'default',
                'customizations' => $theme ? $themeManager->getAllCustomizations($theme->slug) : [],
                'layouts' => $config['layouts'] ?? [],
                'supports' => $config['supports'] ?? [],
                'style' => $config['style'] ?? null,
            ],
        ];
    }
}
