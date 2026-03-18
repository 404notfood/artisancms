<?php

declare(strict_types=1);

namespace Ecommerce\Policies;

use App\Models\User;
use Ecommerce\Models\Product;

class ProductPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('shop.products.read');
    }

    public function view(User $user, Product $product): bool
    {
        return $user->hasPermission('shop.products.read');
    }

    public function create(User $user): bool
    {
        return $user->hasPermission('shop.products.create');
    }

    public function update(User $user, Product $product): bool
    {
        return $user->hasPermission('shop.products.update');
    }

    public function delete(User $user, Product $product): bool
    {
        return $user->hasPermission('shop.products.delete');
    }
}
