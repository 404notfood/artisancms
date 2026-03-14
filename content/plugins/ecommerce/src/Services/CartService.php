<?php

declare(strict_types=1);

namespace Ecommerce\Services;

use Ecommerce\Models\CartItem;
use Illuminate\Database\Eloquent\Collection;

class CartService
{
    /**
     * Get all cart items for the current user or session.
     *
     * @return Collection<int, CartItem>
     */
    public function getItems(): Collection
    {
        return CartItem::with(['product', 'variant'])
            ->where($this->ownerCondition())
            ->get();
    }

    /**
     * Add an item to the cart.
     *
     * @param array<string, mixed> $data
     */
    public function addItem(array $data): CartItem
    {
        $condition = $this->ownerCondition();
        $condition['product_id'] = $data['product_id'];
        $condition['variant_id'] = $data['variant_id'] ?? null;

        $existing = CartItem::where($condition)->first();

        if ($existing) {
            $existing->increment('quantity', (int) ($data['quantity'] ?? 1));
            return $existing->fresh();
        }

        return CartItem::create(array_merge($condition, [
            'quantity' => (int) ($data['quantity'] ?? 1),
        ]));
    }

    /**
     * Update the quantity of a cart item.
     */
    public function updateQuantity(CartItem $cartItem, int $quantity): CartItem
    {
        $cartItem->update(['quantity' => $quantity]);

        return $cartItem->fresh();
    }

    /**
     * Remove a cart item.
     */
    public function removeItem(CartItem $cartItem): void
    {
        $cartItem->delete();
    }

    /**
     * Clear all cart items for the current user or session.
     */
    public function clear(): void
    {
        CartItem::where($this->ownerCondition())->delete();
    }

    /**
     * Get the owner condition (user or session).
     *
     * @return array<string, mixed>
     */
    private function ownerCondition(): array
    {
        if (auth()->check()) {
            return ['user_id' => auth()->id()];
        }

        return ['session_id' => session()->getId()];
    }
}
