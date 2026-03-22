<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Comment;
use App\Models\User;

class CommentPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('comments.read');
    }

    public function moderate(User $user, Comment $comment): bool
    {
        return $user->hasPermission('comments.moderate');
    }

    public function delete(User $user, Comment $comment): bool
    {
        return $user->hasPermission('comments.delete');
    }
}
