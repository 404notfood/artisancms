<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\CmsPlugin;
use App\Models\User;

class PluginPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('plugins.read');
    }

    public function view(User $user, CmsPlugin $plugin): bool
    {
        return $user->hasPermission('plugins.read');
    }

    public function manage(User $user): bool
    {
        return $user->hasPermission('plugins.manage');
    }
}
