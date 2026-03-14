<?php

declare(strict_types=1);

namespace Ecommerce\Services;

use Ecommerce\Models\WishlistItem;
use Illuminate\Database\Eloquent\Collection;

class WishlistService
{
    /**
     * Get all wishlist items for a user with products loaded.
     *
     * @return Collection<int, WishlistItem>
     */
    public function getItems(int $userId): Collection
    {
        return WishlistItem::where('user_id', $userId)
            ->with(['product', 'variant'])
            ->orderByDesc('created_at')
            ->get();
    }

    /**
     * Add an item to the user's wishlist.
     * Silently ignores if already exists.
     */
    public function add(int $userId, int $productId, ?int $variantId = null): WishlistItem
    {
        return WishlistItem::firstOrCreate([
            'user_id' => $userId,
            'product_id' => $productId,
            'variant_id' => $variantId,
        ]);
    }

    /**
     * Remove an item from the user's wishlist.
     */
    public function remove(int $userId, int $productId, ?int $variantId = null): void
    {
        WishlistItem::where('user_id', $userId)
            ->where('product_id', $productId)
            ->where('variant_id', $variantId)
            ->delete();
    }

    /**
     * Check if a product is in the user's wishlist.
     */
    public function isInWishlist(int $userId, int $productId): bool
    {
        return WishlistItem::where('user_id', $userId)
            ->where('product_id', $productId)
            ->exists();
    }

    /**
     * Count the number of items in the user's wishlist.
     */
    public function count(int $userId): int
    {
        return WishlistItem::where('user_id', $userId)->count();
    }

    /**
     * Move a wishlist item to the cart and remove it from the wishlist.
     */
    public function moveToCart(int $userId, int $wishlistItemId): void
    {
        $item = WishlistItem::where('user_id', $userId)
            ->where('id', $wishlistItemId)
            ->firstOrFail();

        /** @var CartService $cartService */
        $cartService = app(CartService::class);

        $cartService->addItem([
            'product_id' => $item->product_id,
            'variant_id' => $item->variant_id,
            'quantity' => 1,
        ]);

        $item->delete();
    }
}
