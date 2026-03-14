<?php

declare(strict_types=1);

namespace Ecommerce\Payment;

use Ecommerce\Models\Order;
use Illuminate\Http\Request;

interface PaymentDriverInterface
{
    /**
     * Create a payment for the given order.
     *
     * @param Order $order The order to process payment for.
     * @param array<string, mixed> $data Additional payment data (e.g. token, return URLs).
     * @return PaymentResult The result of the payment attempt.
     */
    public function createPayment(Order $order, array $data): PaymentResult;

    /**
     * Handle an incoming webhook from the payment provider.
     *
     * @param Request $request The incoming webhook request.
     * @return WebhookResult The result of webhook processing.
     */
    public function handleWebhook(Request $request): WebhookResult;
}
