<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Popup;
use App\Models\User;

class PopupPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('popups.read');
    }

    public function view(User $user, Popup $popup): bool
    {
        return $user->hasPermission('popups.read');
    }

    public function create(User $user): bool
    {
        return $user->hasPermission('popups.create');
    }

    public function update(User $user, Popup $popup): bool
    {
        return $user->hasPermission('popups.update');
    }

    public function delete(User $user, Popup $popup): bool
    {
        return $user->hasPermission('popups.delete');
    }
}
