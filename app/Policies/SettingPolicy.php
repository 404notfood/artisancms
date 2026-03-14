<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Setting;
use App\Models\User;

class SettingPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('settings.read');
    }

    public function view(User $user, Setting $setting): bool
    {
        return $user->hasPermission('settings.read');
    }

    public function update(User $user, Setting $setting): bool
    {
        return $user->hasPermission('settings.update');
    }
}
