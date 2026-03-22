<?php

declare(strict_types=1);

namespace App\Observers;

use App\Models\Redirect;
use Illuminate\Support\Facades\Cache;

class RedirectObserver
{
    public function saved(Redirect $redirect): void
    {
        Cache::forget('cms_redirects');
    }

    public function deleted(Redirect $redirect): void
    {
        Cache::forget('cms_redirects');
    }
}
