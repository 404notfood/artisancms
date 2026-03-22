<?php

declare(strict_types=1);

namespace App\Observers;

use App\Models\Post;
use Illuminate\Support\Facades\Cache;

class PostObserver
{
    public function saved(Post $post): void
    {
        Cache::forget("cms.posts.{$post->slug}");

        // If the slug was changed, also invalidate the old slug cache
        if ($post->wasChanged('slug')) {
            Cache::forget("cms.posts.{$post->getOriginal('slug')}");
        }
    }

    public function deleted(Post $post): void
    {
        Cache::forget("cms.posts.{$post->slug}");
    }
}
