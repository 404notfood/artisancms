<?php

declare(strict_types=1);

namespace Ecommerce\Payment\Drivers;

use Ecommerce\Models\Order;
use Ecommerce\Payment\PaymentDriverInterface;
use Ecommerce\Payment\PaymentResult;
use Ecommerce\Payment\WebhookResult;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * Cash on Delivery payment driver.
 *
 * Payment is collected when the order is delivered. The order is simply
 * marked as pending until the delivery confirms payment.
 */
class CodDriver implements PaymentDriverInterface
{
    /**
     * @param array<string, mixed> $config Driver configuration.
     */
    public function __construct(
        private readonly array $config = [],
    ) {}

    /**
     * Mark the order as pending payment (cash will be collected on delivery).
     *
     * @param Order $order
     * @param array<string, mixed> $data Additional payment data.
     */
    public function createPayment(Order $order, array $data): PaymentResult
    {
        // Generate a unique transaction reference for tracking
        $transactionId = 'COD-' . strtoupper(Str::random(12));

        return new PaymentResult(
            success: true,
            transactionId: $transactionId,
            redirectUrl: $data['success_url'] ?? null,
            status: 'pending',
        );
    }

    /**
     * COD does not use webhooks. Always returns a no-op success.
     */
    public function handleWebhook(Request $request): WebhookResult
    {
        return WebhookResult::failed('Le paiement a la livraison ne supporte pas les webhooks.');
    }
}
