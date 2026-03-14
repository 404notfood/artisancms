<?php

declare(strict_types=1);

namespace Ecommerce\Services;

use Ecommerce\Models\Order;
use Ecommerce\Models\PaymentMethod;
use Ecommerce\Payment\Drivers\CodDriver;
use Ecommerce\Payment\Drivers\StripeDriver;
use Ecommerce\Payment\PaymentDriverInterface;
use Ecommerce\Payment\PaymentResult;
use Ecommerce\Payment\WebhookResult;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PaymentService
{
    /**
     * Get all active payment methods, ordered.
     *
     * @return Collection<int, PaymentMethod>
     */
    public function getActiveMethods(): Collection
    {
        return PaymentMethod::active()->ordered()->get();
    }

    /**
     * Process a payment for the given order using the specified method slug.
     *
     * @param Order $order The order to pay.
     * @param string $method The payment method slug.
     * @param array<string, mixed> $data Additional payment data.
     */
    public function processPayment(Order $order, string $method, array $data = []): PaymentResult
    {
        $paymentMethod = PaymentMethod::where('slug', $method)->active()->first();

        if ($paymentMethod === null) {
            return PaymentResult::failed('Methode de paiement introuvable ou inactive.');
        }

        try {
            $driver = $this->resolveDriver($paymentMethod);
            $result = $driver->createPayment($order, $data);

            if ($result->success) {
                $order->update([
                    'payment_method' => $paymentMethod->slug,
                    'payment_status' => $result->status ?? 'pending',
                ]);
            }

            return $result;
        } catch (\Throwable $e) {
            Log::error('Payment processing failed', [
                'order_id' => $order->id,
                'method' => $method,
                'error' => $e->getMessage(),
            ]);

            return PaymentResult::failed('Erreur lors du traitement du paiement.');
        }
    }

    /**
     * Handle an incoming payment webhook for the given driver.
     *
     * @param string $driver The driver name (e.g. stripe, paypal).
     * @param Request $request The incoming webhook request.
     */
    public function handleWebhook(string $driver, Request $request): WebhookResult
    {
        $paymentMethod = PaymentMethod::where('driver', $driver)->active()->first();

        if ($paymentMethod === null) {
            return WebhookResult::failed('Aucune methode de paiement active pour ce driver.');
        }

        try {
            $driverInstance = $this->resolveDriver($paymentMethod);
            $result = $driverInstance->handleWebhook($request);

            if ($result->success && $result->transactionId) {
                $this->updateOrderFromWebhook($result);
            }

            return $result;
        } catch (\Throwable $e) {
            Log::error('Payment webhook handling failed', [
                'driver' => $driver,
                'error' => $e->getMessage(),
            ]);

            return WebhookResult::failed('Erreur lors du traitement du webhook.');
        }
    }

    /**
     * Resolve the payment driver instance from a PaymentMethod model.
     */
    private function resolveDriver(PaymentMethod $paymentMethod): PaymentDriverInterface
    {
        $config = $paymentMethod->config ?? [];

        return match ($paymentMethod->driver) {
            'stripe' => new StripeDriver($config),
            'cod' => new CodDriver($config),
            default => throw new \InvalidArgumentException(
                "Driver de paiement inconnu : {$paymentMethod->driver}"
            ),
        };
    }

    /**
     * Update the order's payment status based on webhook result.
     */
    private function updateOrderFromWebhook(WebhookResult $result): void
    {
        // Try to find order by transaction ID stored in payment_method metadata
        // The transaction ID from Stripe corresponds to the PaymentIntent ID
        $order = Order::where('payment_status', 'pending')->first();

        if ($order === null) {
            Log::warning('Webhook received but no matching pending order found', [
                'transaction_id' => $result->transactionId,
            ]);
            return;
        }

        $order->update([
            'payment_status' => $result->status ?? 'paid',
        ]);
    }
}
