<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\ContentEntry;
use App\Models\User;

class ContentEntryPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('content_entries.read');
    }

    public function view(User $user, ContentEntry $entry): bool
    {
        return $user->hasPermission('content_entries.read');
    }

    public function create(User $user): bool
    {
        return $user->hasPermission('content_entries.create');
    }

    public function update(User $user, ContentEntry $entry): bool
    {
        if ($user->hasPermission('content_entries.update')) {
            return true;
        }

        return $user->hasPermission('content_entries.update.own') && $entry->created_by === $user->id;
    }

    public function delete(User $user, ContentEntry $entry): bool
    {
        return $user->hasPermission('content_entries.delete');
    }
}
