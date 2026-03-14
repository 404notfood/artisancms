<?php

declare(strict_types=1);

namespace Ecommerce\Observers;

use App\Models\User;
use Ecommerce\Models\Product;
use Ecommerce\Notifications\LowStockNotification;

class ProductStockObserver
{
    /**
     * Handle the Product "updated" event.
     * If stock changed and is now below the threshold, notify admins.
     */
    public function updated(Product $product): void
    {
        if (!$product->track_stock) {
            return;
        }

        // Only act when stock column actually changed
        if (!$product->wasChanged('stock')) {
            return;
        }

        $previousStock = (int) $product->getOriginal('stock');
        $currentStock = (int) $product->stock;
        $threshold = (int) $product->low_stock_threshold;

        // Only trigger if we just crossed below the threshold
        if ($currentStock <= $threshold && $previousStock > $threshold) {
            $this->notifyAdmins($product);
        }
    }

    /**
     * Send low stock notification to all admin users.
     */
    private function notifyAdmins(Product $product): void
    {
        $admins = User::whereHas('role', function ($query) {
            $query->where('slug', 'admin');
        })->get();

        foreach ($admins as $admin) {
            $admin->notify(new LowStockNotification($product));
        }
    }
}
