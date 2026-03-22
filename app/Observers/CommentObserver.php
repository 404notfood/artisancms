<?php

declare(strict_types=1);

namespace App\Observers;

use App\Models\Comment;
use Illuminate\Support\Facades\Cache;

class CommentObserver
{
    public function saved(Comment $comment): void
    {
        Cache::forget('cms.comments.count');
    }

    public function deleted(Comment $comment): void
    {
        Cache::forget('cms.comments.count');
    }
}
