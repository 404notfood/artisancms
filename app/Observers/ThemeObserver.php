<?php

declare(strict_types=1);

namespace App\Observers;

use App\Models\CmsTheme;
use Illuminate\Support\Facades\Cache;

class ThemeObserver
{
    public function saved(CmsTheme $theme): void
    {
        $this->clearThemeCache();
    }

    public function deleted(CmsTheme $theme): void
    {
        $this->clearThemeCache();
    }

    private function clearThemeCache(): void
    {
        Cache::forget('cms.themes.discovered');
        Cache::forget('cms.theme.active_slug');
        Cache::forget('cms.theme.css_variables');
    }
}
