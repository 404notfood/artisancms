<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Media;
use App\Models\User;

class MediaPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('media.read');
    }

    public function view(User $user, Media $media): bool
    {
        return $user->hasPermission('media.read');
    }

    public function create(User $user): bool
    {
        return $user->hasPermission('media.create');
    }

    public function update(User $user, Media $media): bool
    {
        return $user->hasPermission('media.update');
    }

    public function delete(User $user, Media $media): bool
    {
        return $user->hasPermission('media.delete');
    }
}
