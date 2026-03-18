<?php

declare(strict_types=1);

namespace Ecommerce\Policies;

use App\Models\User;
use Ecommerce\Models\Coupon;

class CouponPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('shop.coupons.read');
    }

    public function view(User $user, Coupon $coupon): bool
    {
        return $user->hasPermission('shop.coupons.read');
    }

    public function create(User $user): bool
    {
        return $user->hasPermission('shop.coupons.create');
    }

    public function update(User $user, Coupon $coupon): bool
    {
        return $user->hasPermission('shop.coupons.update');
    }

    public function delete(User $user, Coupon $coupon): bool
    {
        return $user->hasPermission('shop.coupons.delete');
    }
}
