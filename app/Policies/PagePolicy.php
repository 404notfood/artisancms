<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Page;
use App\Models\User;

class PagePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('pages.read');
    }

    public function view(User $user, Page $page): bool
    {
        return $user->hasPermission('pages.read');
    }

    public function create(User $user): bool
    {
        return $user->hasPermission('pages.create');
    }

    public function update(User $user, Page $page): bool
    {
        if ($user->hasPermission('pages.update')) {
            return true;
        }

        return $user->hasPermission('pages.update.own') && $page->created_by === $user->id;
    }

    public function delete(User $user, Page $page): bool
    {
        return $user->hasPermission('pages.delete');
    }

    public function restore(User $user, Page $page): bool
    {
        return $user->hasPermission('pages.delete');
    }

    public function forceDelete(User $user, Page $page): bool
    {
        return $user->isAdmin();
    }
}
