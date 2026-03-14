<?php

declare(strict_types=1);

namespace App\Observers;

use App\Models\Setting;
use Illuminate\Support\Facades\Cache;

class SettingObserver
{
    public function saved(Setting $setting): void
    {
        Cache::forget('cms.settings.all');
    }

    public function deleted(Setting $setting): void
    {
        Cache::forget('cms.settings.all');
    }
}
