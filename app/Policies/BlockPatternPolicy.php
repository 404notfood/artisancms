<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\BlockPattern;
use App\Models\User;

class BlockPatternPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('block_patterns.read');
    }

    public function create(User $user): bool
    {
        return $user->hasPermission('block_patterns.create');
    }

    public function update(User $user, BlockPattern $pattern): bool
    {
        return $user->hasPermission('block_patterns.update');
    }

    public function delete(User $user, BlockPattern $pattern): bool
    {
        return $user->hasPermission('block_patterns.delete');
    }
}
