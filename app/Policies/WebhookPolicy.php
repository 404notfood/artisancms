<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\User;
use App\Models\Webhook;

class WebhookPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('webhooks.read');
    }

    public function view(User $user, Webhook $webhook): bool
    {
        return $user->hasPermission('webhooks.read');
    }

    public function create(User $user): bool
    {
        return $user->hasPermission('webhooks.create');
    }

    public function update(User $user, Webhook $webhook): bool
    {
        return $user->hasPermission('webhooks.update');
    }

    public function delete(User $user, Webhook $webhook): bool
    {
        return $user->hasPermission('webhooks.delete');
    }
}
