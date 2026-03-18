<?php

declare(strict_types=1);

namespace Ecommerce\Services;

use App\CMS\Facades\CMS;
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
    private const DRIVER_MAP = [
        'stripe' => StripeDriver::class,
        'cod' => CodDriver::class,
    ];

    /**
     * @return Collection<int, PaymentMethod>
     */
    public function getActiveMethods(): Collection
    {
        return PaymentMethod::active()->ordered()->get();
    }

    public function processPayment(Order $order, string $method, array $data = []): PaymentResult
    {
        $paymentMethod = PaymentMethod::where('slug', $method)->active()->first();

        if (!$paymentMethod) {
            return PaymentResult::failed('Methode de paiement introuvable ou inactive.');
        }

        if ($order->isPaid()) {
            return PaymentResult::failed('Cette commande est deja payee.');
        }

        try {
            $driver = $this->resolveDriver($paymentMethod);
            $result = $driver->createPayment($order, $data);

            if ($result->success) {
                $updateData = [
                    'payment_method' => $paymentMethod->slug,
                    'payment_status' => $result->status ?? Order::PAYMENT_PENDING,
                ];

                if ($result->transactionId) {
                    $updateData['transaction_id'] = $result->transactionId;
                }

                $order->update($updateData);
                CMS::fire('ecommerce.payment.processed', $order, $result);
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

    public function handleWebhook(string $driver, Request $request): WebhookResult
    {
        $paymentMethod = PaymentMethod::where('driver', $driver)->active()->first();

        if (!$paymentMethod) {
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

    private function resolveDriver(PaymentMethod $paymentMethod): PaymentDriverInterface
    {
        $config = $paymentMethod->config ?? [];
        $driverClass = self::DRIVER_MAP[$paymentMethod->driver] ?? null;

        if (!$driverClass) {
            throw new \InvalidArgumentException(
                "Driver de paiement inconnu : {$paymentMethod->driver}"
            );
        }

        return new $driverClass($config);
    }

    private function updateOrderFromWebhook(WebhookResult $result): void
    {
        $order = Order::where('transaction_id', $result->transactionId)->first();

        if (!$order) {
            Log::warning('Webhook: no order found for transaction', [
                'transaction_id' => $result->transactionId,
            ]);
            return;
        }

        $paymentStatus = $result->status ?? Order::PAYMENT_PAID;
        $order->update(['payment_status' => $paymentStatus]);

        // Auto-advance order status when payment is confirmed
        if ($paymentStatus === Order::PAYMENT_PAID && $order->isPending()) {
            $order->transitionTo(Order::STATUS_PROCESSING);
        }

        CMS::fire('ecommerce.payment.webhook_processed', $order, $result);
    }
}
