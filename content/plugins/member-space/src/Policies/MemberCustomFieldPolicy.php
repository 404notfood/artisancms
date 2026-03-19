<?php

declare(strict_types=1);

namespace MemberSpace\Policies;

use App\Models\User;

class MemberCustomFieldPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('members.view') || $user->isAdmin();
    }

    public function create(User $user): bool
    {
        return $user->hasPermission('members.manage') || $user->isAdmin();
    }

    public function update(User $user): bool
    {
        return $user->hasPermission('members.manage') || $user->isAdmin();
    }

    public function delete(User $user): bool
    {
        return $user->isAdmin();
    }
}
