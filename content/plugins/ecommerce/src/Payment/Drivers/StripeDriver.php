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

    public function __construct(
        private readonly array $config,
    ) {}

    public function createPayment(Order $order, array $data): PaymentResult
    {
        $secretKey = $this->config['secret_key'] ?? '';

        if (empty($secretKey)) {
            return PaymentResult::failed('Cle API Stripe non configuree.');
        }

        try {
            $amountInCents = (int) round((float) $order->total * 100);
            $currency = strtolower($this->config['currency'] ?? 'eur');

            $response = Http::withBasicAuth($secretKey, '')
                ->asForm()
                ->post(self::API_BASE . '/payment_intents', [
                    'amount' => $amountInCents,
                    'currency' => $currency,
                    'metadata[order_id]' => (string) $order->id,
                    'automatic_payment_methods[enabled]' => 'true',
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

            if (!empty($data['success_url'])) {
                $separator = str_contains($data['success_url'], '?') ? '&' : '?';
                $redirectUrl = $data['success_url'] . $separator . 'payment_intent=' . $intent['id'];

                return PaymentResult::pending(
                    transactionId: $intent['id'],
                    redirectUrl: $redirectUrl,
                );
            }

            // Client-side confirmation (Stripe.js)
            return PaymentResult::pending(
                transactionId: $intent['id'],
                clientSecret: $intent['client_secret'] ?? null,
            );
        } catch (\Throwable $e) {
            Log::error('Stripe createPayment exception', [
                'order_id' => $order->id,
                'message' => $e->getMessage(),
            ]);

            return PaymentResult::failed('Erreur lors de la creation du paiement Stripe.');
        }
    }

    public function handleWebhook(Request $request): WebhookResult
    {
        $payload = $request->getContent();
        $sigHeader = $request->header('Stripe-Signature', '');
        $webhookSecret = $this->config['webhook_secret'] ?? '';

        if (empty($webhookSecret)) {
            Log::warning('Stripe webhook rejected: no webhook_secret configured.');
            return WebhookResult::failed('Webhook secret non configure.');
        }

        if (!$this->verifySignature($payload, $sigHeader, $webhookSecret)) {
            Log::warning('Stripe webhook rejected: invalid signature.');
            return WebhookResult::failed('Signature webhook invalide.');
        }

        $event = json_decode($payload, true);

        if (!is_array($event) || empty($event['type'])) {
            return WebhookResult::failed('Payload webhook invalide.');
        }

        $type = $event['type'];
        $object = $event['data']['object'] ?? [];
        $transactionId = $object['id'] ?? '';

        Log::info('Stripe webhook received', ['type' => $type, 'transaction_id' => $transactionId]);

        return match ($type) {
            'payment_intent.succeeded' => WebhookResult::success(
                transactionId: $transactionId,
                status: 'paid',
            ),
            'payment_intent.payment_failed' => WebhookResult::failed(
                $object['last_payment_error']['message'] ?? 'Paiement echoue.',
            ),
            'charge.refunded' => WebhookResult::success(
                transactionId: $object['payment_intent'] ?? $transactionId,
                status: 'refunded',
            ),
            default => WebhookResult::success(
                transactionId: $transactionId,
                status: 'pending',
            ),
        };
    }

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

        // Reject webhooks older than 5 minutes to prevent replay attacks
        if (abs(time() - (int) $timestamp) > 300) {
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
