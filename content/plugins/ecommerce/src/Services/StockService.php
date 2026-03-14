<?php

declare(strict_types=1);

namespace Ecommerce\Services;

use Ecommerce\Models\Order;
use Ecommerce\Models\Product;
use Ecommerce\Models\ProductVariant;
use Ecommerce\Models\StockMovement;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class StockService
{
    /**
     * Record a stock movement and update product/variant stock accordingly.
     */
    public function recordMovement(
        int $productId,
        ?int $variantId,
        string $type,
        int $quantity,
        ?string $reference = null,
    ): StockMovement {
        $movement = StockMovement::create([
            'product_id' => $productId,
            'variant_id' => $variantId,
            'type' => $type,
            'quantity' => $quantity,
            'reference' => $reference,
            'created_by' => auth()->id(),
        ]);

        // Update the stock on the product or variant
        if ($variantId !== null) {
            $variant = ProductVariant::findOrFail($variantId);
            $variant->increment('stock', $quantity);
        }

        $product = Product::findOrFail($productId);
        $product->increment('stock', $quantity);

        return $movement;
    }

    /**
     * Deduct stock for each item in an order.
     * Creates a movement of type "sale" with negative quantity.
     */
    public function deductForOrder(Order $order): void
    {
        $order->load('items');

        foreach ($order->items as $item) {
            $this->recordMovement(
                $item->product_id,
                $item->variant_id,
                'sale',
                -$item->quantity,
                'Commande #' . $order->id,
            );
        }
    }

    /**
     * Restore stock on order cancellation.
     * Creates a movement of type "return" with positive quantity.
     */
    public function restoreForOrder(Order $order): void
    {
        $order->load('items');

        foreach ($order->items as $item) {
            $this->recordMovement(
                $item->product_id,
                $item->variant_id,
                'return',
                $item->quantity,
                'Annulation commande #' . $order->id,
            );
        }
    }

    /**
     * Get products where stock is at or below the low stock threshold.
     *
     * @return Collection<int, Product>
     */
    public function getLowStockProducts(): Collection
    {
        return Product::where('track_stock', true)
            ->whereColumn('stock', '<=', 'low_stock_threshold')
            ->orderBy('stock')
            ->get();
    }

    /**
     * Get paginated stock movement history for a product.
     */
    public function getMovements(int $productId, ?int $variantId = null): LengthAwarePaginator
    {
        $query = StockMovement::where('product_id', $productId)
            ->with('creator');

        if ($variantId !== null) {
            $query->where('variant_id', $variantId);
        }

        return $query->orderByDesc('created_at')->paginate(20);
    }
}
