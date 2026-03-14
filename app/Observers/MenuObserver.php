<?php

declare(strict_types=1);

namespace App\Observers;

use App\Models\Menu;
use Illuminate\Support\Facades\Cache;

class MenuObserver
{
    public function saved(Menu $menu): void
    {
        if ($menu->location) {
            Cache::forget("cms.menus.{$menu->location}");
        }

        // If the location was changed, also invalidate the old location cache
        if ($menu->wasChanged('location')) {
            $oldLocation = $menu->getOriginal('location');
            if ($oldLocation) {
                Cache::forget("cms.menus.{$oldLocation}");
            }
        }
    }

    public function deleted(Menu $menu): void
    {
        if ($menu->location) {
            Cache::forget("cms.menus.{$menu->location}");
        }
    }
}
