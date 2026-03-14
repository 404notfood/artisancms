<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Taxonomy;
use App\Models\User;

class TaxonomyPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('taxonomies.read');
    }

    public function view(User $user, Taxonomy $taxonomy): bool
    {
        return $user->hasPermission('taxonomies.read');
    }

    public function create(User $user): bool
    {
        return $user->hasPermission('taxonomies.create');
    }

    public function update(User $user, Taxonomy $taxonomy): bool
    {
        return $user->hasPermission('taxonomies.update');
    }

    public function delete(User $user, Taxonomy $taxonomy): bool
    {
        return $user->hasPermission('taxonomies.delete');
    }
}
