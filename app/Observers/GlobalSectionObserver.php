<?php

declare(strict_types=1);

namespace App\Observers;

use App\Models\GlobalSection;
use Illuminate\Support\Facades\Cache;

class GlobalSectionObserver
{
    public function saved(GlobalSection $globalSection): void
    {
        Cache::forget('cms.global_section.active_header');
        Cache::forget('cms.global_section.active_footer');
    }

    public function deleted(GlobalSection $globalSection): void
    {
        Cache::forget('cms.global_section.active_header');
        Cache::forget('cms.global_section.active_footer');
    }
}
