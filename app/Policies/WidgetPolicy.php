<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\User;
use App\Models\Widget;

class WidgetPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('widgets.read');
    }

    public function create(User $user): bool
    {
        return $user->hasPermission('widgets.create');
    }

    public function update(User $user, Widget $widget): bool
    {
        return $user->hasPermission('widgets.update');
    }

    public function delete(User $user, Widget $widget): bool
    {
        return $user->hasPermission('widgets.delete');
    }
}
