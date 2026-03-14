<?php

declare(strict_types=1);

namespace App\Observers;

use App\Models\CmsPlugin;
use Illuminate\Support\Facades\Cache;

class PluginObserver
{
    public function saved(CmsPlugin $plugin): void
    {
        Cache::forget('cms.plugins.enabled');
    }

    public function deleted(CmsPlugin $plugin): void
    {
        Cache::forget('cms.plugins.enabled');
    }
}
