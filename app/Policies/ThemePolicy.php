<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\CmsTheme;
use App\Models\User;

class ThemePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('themes.read');
    }

    public function view(User $user, CmsTheme $theme): bool
    {
        return $user->hasPermission('themes.read');
    }

    public function manage(User $user): bool
    {
        return $user->hasPermission('themes.manage');
    }
}
