<?php

declare(strict_types=1);

namespace Ecommerce\Services;

use App\CMS\Facades\CMS;
use Ecommerce\Mail\OrderConfirmationMail;
use Ecommerce\Mail\OrderShippedMail;
use Ecommerce\Mail\OrderStatusChangedMail;
use Ecommerce\Models\Order;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Mail;

class OrderService
{
    public function __construct(
        private readonly CartService $cartService,
        private readonly CouponService $couponService,
    ) {}

    /**
     * Get paginated orders with optional filters.
     *
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
