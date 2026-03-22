<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\CustomFieldGroup;
use App\Models\User;

class CustomFieldGroupPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('custom_fields.read');
    }

    public function view(User $user, CustomFieldGroup $group): bool
    {
        return $user->hasPermission('custom_fields.read');
    }

    public function create(User $user): bool
    {
        return $user->hasPermission('custom_fields.create');
    }

    public function update(User $user, CustomFieldGroup $group): bool
    {
        return $user->hasPermission('custom_fields.update');
    }

    public function delete(User $user, CustomFieldGroup $group): bool
    {
        return $user->hasPermission('custom_fields.delete');
    }
}
