<?php

declare(strict_types=1);

namespace Ecommerce\Services;

use App\CMS\Facades\CMS;
use Ecommerce\Mail\OrderConfirmationMail;
use Ecommerce\Mail\OrderShippedMail;
use Ecommerce\Mail\OrderStatusChangedMail;
use Ecommerce\Models\Coupon;
use Ecommerce\Models\Order;
use Ecommerce\Models\OrderItem;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class OrderService
{
    public function __construct(
        private readonly CartService $cartService,
        private readonly CouponService $couponService,
        private readonly StockService $stockService,
    ) {}

    /**
     * Calculate the totals (subtotal, tax, shipping, discount) for a set of cart items.
     *
     * @param Collection $items Cart items collection.
     * @param array<string, mixed> $settings E-commerce settings.
     * @param string|null $couponCode Session coupon code.
     * @return array{subtotal: float, tax: float, shipping: float, discount: float, total: float, coupon: ?Coupon}
     */
    public function calculateTotals(Collection $items, array $settings, ?string $couponCode = null): array
    {
        $subtotal = $items->sum(fn ($item) => $item->getTotal());
        $taxRate = (float) ($settings['tax_rate'] ?? 20);
        $tax = round($subtotal * $taxRate / 100, 2);
        $shippingCost = (float) ($settings['shipping_cost'] ?? 5.99);
        $freeThreshold = (float) ($settings['free_shipping_threshold'] ?? 50);
        $shipping = $subtotal >= $freeThreshold ? 0.0 : $shippingCost;

        $discount = 0.0;
        $coupon = null;

        if ($couponCode) {
            $coupon = $this->couponService->findByCode($couponCode);
            if ($coupon && $coupon->isUsable()) {
                $discount = $this->calculateCouponDiscount($coupon, $subtotal);
            } else {
                $coupon = null;
            }
        }

        $total = max(0.0, $subtotal + $tax + $shipping - $discount);
        $total = (float) CMS::applyFilter('ecommerce.checkout.total', $total, $subtotal, $tax, $shipping, $discount);

        return compact('subtotal', 'tax', 'shipping', 'discount', 'total', 'coupon');
    }

    /**
     * Calculate the discount amount for a coupon on a given subtotal.
     */
    public function calculateCouponDiscount(Coupon $coupon, float $subtotal): float
    {
        if ($coupon->min_order !== null && $subtotal < (float) $coupon->min_order) {
            return 0.0;
        }

        return $coupon->type === 'percentage'
            ? round($subtotal * (float) $coupon->value / 100, 2)
            : min((float) $coupon->value, $subtotal);
    }

    /**
     * Create an order from the current cart within a DB transaction.
     *
     * @param array<string, mixed> $data Validated checkout form data.
     * @param Collection $items Cart items.
     * @param array<string, mixed> $totals Calculated totals from calculateTotals().
     */
    public function createFromCart(array $data, Collection $items, array $totals): Order
    {
        $shippingAddress = $data['shipping_address'];
        $billingAddress = !empty($data['billing_same_as_shipping'])
            ? $shippingAddress
            : ($data['billing_address'] ?? $shippingAddress);

        $order = DB::transaction(function () use ($data, $items, $totals, $shippingAddress, $billingAddress) {
            $order = Order::create([
                'user_id' => auth()->id(),
                'status' => 'pending',
                'subtotal' => $totals['subtotal'],
                'tax' => $totals['tax'],
                'shipping' => $totals['shipping'],
                'discount' => $totals['discount'],
                'total' => $totals['total'],
                'payment_method' => $data['payment_method'],
                'payment_status' => 'pending',
                'shipping_address' => $shippingAddress,
                'billing_address' => $billingAddress,
                'notes' => $data['notes'] ?? null,
            ]);

            foreach ($items as $item) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $item->product_id,
                    'variant_id' => $item->variant_id,
                    'name' => $item->product->name . ($item->variant ? ' - ' . $item->variant->name : ''),
                    'price' => $item->getPrice(),
                    'quantity' => $item->quantity,
                    'total' => $item->getTotal(),
                ]);
            }

            $this->stockService->deductForOrder($order);

            if ($totals['coupon']) {
                $totals['coupon']->increment('used_count');
            }

            return $order;
        });

        $this->cartService->clear();

        CMS::fire('ecommerce.order.created', $order);

        return $order;
    }

    /**
     * Verify stock availability for all items. Returns the first error or null.
     */
    public function checkStock(Collection $items): ?string
    {
        foreach ($items as $item) {
            $available = $item->variant ? $item->variant->stock : $item->product->stock;
            if ($item->quantity > $available) {
                return "Stock insuffisant pour {$item->product->name}. Disponible : {$available}.";
            }
        }

        return null;
    }

    /**
     * @param array<string, mixed> $filters
     */
    public function all(array $filters = []): LengthAwarePaginator
    {
        $query = Order::with('user');

        if (!empty($filters['status'])) {
            $query->byStatus($filters['status']);
        }

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('id', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($q2) use ($search) {
                      $q2->where('name', 'like', "%{$search}%")
                         ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        $query->recent();

        return $query->paginate((int) ($filters['per_page'] ?? 15));
    }

    /**
     * Send order confirmation email after order creation.
     */
    public function sendConfirmation(Order $order): void
    {
        $order->loadMissing(['items', 'user']);

        if ($order->user) {
            Mail::to($order->user)->queue(new OrderConfirmationMail($order));
        } elseif ($billingEmail = $this->getOrderEmail($order)) {
            Mail::to($billingEmail)->queue(new OrderConfirmationMail($order));
        }
    }

    /**
     * Update the status of an order and send appropriate notifications.
     */
    public function updateStatus(Order $order, string $status, ?string $trackingNumber = null): Order
    {
        $previousStatus = $order->status;

        $order->update([
            'status' => $status,
            'completed_at' => $status === 'completed' ? now() : $order->completed_at,
        ]);

        $order = $order->fresh();
        $order->loadMissing(['items', 'user']);

        // Send notifications only if status actually changed
        if ($previousStatus !== $status) {
            $this->sendStatusNotification($order, $status, $trackingNumber);
            CMS::fire('ecommerce.order.status_changed', $order, $previousStatus, $status);
        }

        return $order;
    }

    /**
     * Send status change notification emails.
     */
    private function sendStatusNotification(Order $order, string $status, ?string $trackingNumber = null): void
    {
        $recipient = $order->user ?? $this->getOrderEmail($order);

        if ($recipient === null) {
            return;
        }

        // Specific email for shipped status
        if ($status === 'shipped' && $trackingNumber !== null) {
            Mail::to($recipient)->queue(new OrderShippedMail(
                $order,
                $trackingNumber,
            ));

            return;
        }

        // General status change email for other statuses
        if (in_array($status, ['processing', 'shipped', 'completed'], true)) {
            Mail::to($recipient)->queue(new OrderStatusChangedMail(
                $order,
                $status,
                $trackingNumber,
            ));
        }
    }

    /**
     * Extract customer email from order billing address.
     */
    private function getOrderEmail(Order $order): ?string
    {
        $billingAddress = $order->billing_address;

        if (is_array($billingAddress) && !empty($billingAddress['email'])) {
            return $billingAddress['email'];
        }

        return null;
    }
}
