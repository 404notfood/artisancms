<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\User;
use App\Models\WidgetArea;

class WidgetAreaPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('widgets.read');
    }

    public function create(User $user): bool
    {
        return $user->hasPermission('widgets.create');
    }

    public function update(User $user, WidgetArea $area): bool
    {
        return $user->hasPermission('widgets.update');
    }

    public function delete(User $user, WidgetArea $area): bool
    {
        return $user->hasPermission('widgets.delete');
    }
}
