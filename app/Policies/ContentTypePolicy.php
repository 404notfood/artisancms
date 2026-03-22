<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\ContentType;
use App\Models\User;

class ContentTypePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('content_types.read');
    }

    public function view(User $user, ContentType $contentType): bool
    {
        return $user->hasPermission('content_types.read');
    }

    public function create(User $user): bool
    {
        return $user->hasPermission('content_types.create');
    }

    public function update(User $user, ContentType $contentType): bool
    {
        return $user->hasPermission('content_types.update');
    }

    public function delete(User $user, ContentType $contentType): bool
    {
        return $user->hasPermission('content_types.delete');
    }
}
