<?php

declare(strict_types=1);

namespace App\Observers;

use App\Models\Page;
use Illuminate\Support\Facades\Cache;

class PageObserver
{
    public function saved(Page $page): void
    {
        Cache::forget("cms.pages.{$page->slug}");

        // If the slug was changed, also invalidate the old slug cache
        if ($page->wasChanged('slug')) {
            Cache::forget("cms.pages.{$page->getOriginal('slug')}");
        }
    }

    public function deleted(Page $page): void
    {
        Cache::forget("cms.pages.{$page->slug}");
    }
}
