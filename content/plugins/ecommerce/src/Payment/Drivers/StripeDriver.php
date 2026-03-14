<?php

declare(strict_types=1);

namespace Ecommerce\Payment\Drivers;

use Ecommerce\Models\Order;
use Ecommerce\Payment\PaymentDriverInterface;
use Ecommerce\Payment\PaymentResult;
use Ecommerce\Payment\WebhookResult;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class StripeDriver implements PaymentDriverInterface
{
    private const API_BASE = 'https://api.stripe.com/v1';

    /**
     * @param array<string, mixed> $config Driver configuration (secret_key, webhook_secret, etc.)
     */
    public function __construct(
        private readonly array $config,
    ) {}

    /**
     * Create a Stripe PaymentIntent for the given order.
     *
     * @param Order $order
     * @param array<string, mixed> $data Additional data (success_url, cancel_url).
     */
    public function createPayment(Order $order, array $data): PaymentResult
    {
        $secretKey = $this->config['secret_key'] ?? '';

        if (empty($secretKey)) {
            return PaymentResult::failed('Cle API Stripe non configuree.');
        }

        try {
            $response = Http::withBasicAuth($secretKey, '')
                ->asForm()
                ->post(self::API_BASE . '/payment_intents', [
                    'amount' => (int) round($order->total * 100), // Stripe uses cents
                    'currency' => strtolower($this->config['currency'] ?? 'eur'),
                    'metadata' => [
                        'order_id' => (string) $order->id,
                    ],
                    'automatic_payment_methods' => ['enabled' => 'true'],
                ]);

            if ($response->failed()) {
                $error = $response->json('error.message', 'Erreur Stripe inconnue.');
                Log::error('Stripe createPayment failed', [
                    'order_id' => $order->id,
                    'error' => $error,
                ]);

                return PaymentResult::failed($error);
            }

            $intent = $response->json();
            $clientSecret = $intent['client_secret'] ?? null;

            // If a success_url is provided, build a redirect URL for Checkout Session flow
            if (!empty($data['success_url'])) {
                return PaymentResult::pending(
                    transactionId: $intent['id'],
                    redirectUrl: $data['success_url'] . '?payment_intent=' . $intent['id'],
                );
            }

            // For client-side confirmation (e.g. Stripe.js), return the client secret
            return PaymentResult::pending(
                transactionId: $intent['id'],
                redirectUrl: $clientSecret ?? '',
            );
        } catch (\Throwable $e) {
            Log::error('Stripe createPayment exception', [
                'order_id' => $order->id,
                'message' => $e->getMessage(),
            ]);

            return PaymentResult::failed('Erreur lors de la creation du paiement Stripe.');
        }
    }

    /**
     * Handle Stripe webhook events.
     */
    public function handleWebhook(Request $request): WebhookResult
    {
        $payload = $request->getContent();
        $sigHeader = $request->header('Stripe-Signature', '');
        $webhookSecret = $this->config['webhook_secret'] ?? '';

        // Verify webhook signature if secret is configured
        if (!empty($webhookSecret)) {
            if (!$this->verifySignature($payload, $sigHeader, $webhookSecret)) {
                return WebhookResult::failed('Signature webhook invalide.');
            }
        }

        $event = json_decode($payload, true);

        if ($event === null) {
            return WebhookResult::failed('Payload webhook invalide.');
        }

        $type = $event['type'] ?? '';
        $object = $event['data']['object'] ?? [];

        return match ($type) {
            'payment_intent.succeeded' => WebhookResult::success(
                transactionId: $object['id'] ?? '',
                status: 'paid',
            ),
            'payment_intent.payment_failed' => WebhookResult::failed(
                $object['last_payment_error']['message'] ?? 'Paiement echoue.',
            ),
            default => WebhookResult::success(
                transactionId: $object['id'] ?? '',
                status: 'pending',
            ),
        };
    }

    /**
     * Verify Stripe webhook signature (v1).
     */
    private function verifySignature(string $payload, string $sigHeader, string $secret): bool
    {
        $elements = explode(',', $sigHeader);
        $timestamp = null;
        $signatures = [];

        foreach ($elements as $element) {
            $parts = explode('=', $element, 2);
            if (count($parts) === 2) {
                if ($parts[0] === 't') {
                    $timestamp = $parts[1];
                } elseif ($parts[0] === 'v1') {
                    $signatures[] = $parts[1];
                }
            }
        }

        if ($timestamp === null || empty($signatures)) {
            return false;
        }

        $signedPayload = $timestamp . '.' . $payload;
        $expectedSignature = hash_hmac('sha256', $signedPayload, $secret);

        foreach ($signatures as $signature) {
            if (hash_equals($expectedSignature, $signature)) {
                return true;
            }
        }

        return false;
    }
}
