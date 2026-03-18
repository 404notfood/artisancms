<?php

declare(strict_types=1);

namespace Ecommerce\Policies;

use App\Models\User;
use Ecommerce\Models\Order;

class OrderPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('shop.orders.read');
    }

    public function view(User $user, Order $order): bool
    {
        return $user->hasPermission('shop.orders.read');
    }

    public function update(User $user, Order $order): bool
    {
        return $user->hasPermission('shop.orders.update');
    }
}
