<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\DesignToken;
use App\Models\User;

class DesignTokenPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('design_tokens.read');
    }

    public function create(User $user): bool
    {
        return $user->hasPermission('design_tokens.create');
    }

    public function update(User $user, DesignToken $token): bool
    {
        return $user->hasPermission('design_tokens.update');
    }

    public function delete(User $user, DesignToken $token): bool
    {
        return $user->hasPermission('design_tokens.delete');
    }
}
