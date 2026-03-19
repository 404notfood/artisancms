<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('users.read');
    }

    public function view(User $user, User $model): bool
    {
        return $user->hasPermission('users.read');
    }

    public function create(User $user): bool
    {
        return $user->hasPermission('users.create');
    }

    public function update(User $user, User $model): bool
    {
        return $user->hasPermission('users.update');
    }

    public function delete(User $user, User $model): bool
    {
        // Cannot delete self
        if ($user->id === $model->id) {
            return false;
        }

        // Cannot delete the last admin
        if ($model->isAdmin()) {
            $adminCount = User::whereHas('role', fn ($q) => $q->where('slug', 'admin'))->count();
            if ($adminCount <= 1) {
                return false;
            }
        }

        return $user->hasPermission('users.delete');
    }
}
