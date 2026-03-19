<?php

declare(strict_types=1);

namespace MemberSpace\Policies;

use App\Models\User;
use MemberSpace\Models\MemberProfile;

class MemberProfilePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('members.view') || $user->isAdmin();
    }

    public function view(User $user, MemberProfile $profile): bool
    {
        if ($profile->user_id === $user->id) {
            return true;
        }

        if ($user->isAdmin()) {
            return true;
        }

        return match ($profile->profile_visibility) {
            'public' => true,
            'members_only' => true,
            'private' => false,
            default => false,
        };
    }

    public function update(User $user, MemberProfile $profile): bool
    {
        return $profile->user_id === $user->id || $user->isAdmin();
    }

    public function delete(User $user, MemberProfile $profile): bool
    {
        return $user->isAdmin();
    }
}
