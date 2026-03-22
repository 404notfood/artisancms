<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\GlobalSection;
use App\Models\User;

class GlobalSectionPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('global_sections.read');
    }

    public function view(User $user, GlobalSection $section): bool
    {
        return $user->hasPermission('global_sections.read');
    }

    public function create(User $user): bool
    {
        return $user->hasPermission('global_sections.create');
    }

    public function update(User $user, GlobalSection $section): bool
    {
        return $user->hasPermission('global_sections.update');
    }

    public function delete(User $user, GlobalSection $section): bool
    {
        return $user->hasPermission('global_sections.delete');
    }
}
