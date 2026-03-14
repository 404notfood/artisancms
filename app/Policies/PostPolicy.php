<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Post;
use App\Models\User;

class PostPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('posts.read');
    }

    public function view(User $user, Post $post): bool
    {
        return $user->hasPermission('posts.read');
    }

    public function create(User $user): bool
    {
        return $user->hasPermission('posts.create');
    }

    public function update(User $user, Post $post): bool
    {
        if ($user->hasPermission('posts.update')) {
            return true;
        }

        return $user->hasPermission('posts.update.own') && $post->created_by === $user->id;
    }

    public function delete(User $user, Post $post): bool
    {
        return $user->hasPermission('posts.delete');
    }

    public function restore(User $user, Post $post): bool
    {
        return $user->hasPermission('posts.delete');
    }

    public function forceDelete(User $user, Post $post): bool
    {
        return $user->isAdmin();
    }
}
