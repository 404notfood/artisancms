<?php

declare(strict_types=1);

namespace App\Services;

use App\CMS\Facades\CMS;
use App\Jobs\WebhookDispatchJob;
use App\Models\Webhook;
use App\Models\WebhookDelivery;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class WebhookService
{
    /**
     * Dispatch an event to all matching enabled webhooks via queue.
     *
     * @param array<string, mixed> $data
     */
    public function dispatch(string $event, array $data): void
    {
        $webhooks = Webhook::enabled()
            ->listeningTo($event)
            ->get();

        if ($webhooks->isEmpty()) {
            return;
        }

        $payload = $this->buildPayload($event, $data);

        foreach ($webhooks as $webhook) {
            WebhookDispatchJob::dispatch($webhook, $event, $payload);
        }
    }

    /**
     * Send a webhook synchronously and record the delivery.
     *
     * @param array<string, mixed> $payload
     */
    public function send(Webhook $webhook, string $event, array $payload, int $attempt = 1): WebhookDelivery
    {
        $payloadJson = (string) json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $headers = $this->buildHeaders($webhook, $event, $payloadJson);

        // Create delivery record with pending status
        $delivery = WebhookDelivery::create([
            'webhook_id'      => $webhook->id,
            'event'           => $event,
            'payload'         => $payload,
            'request_headers' => $headers,
            'status'          => 'pending',
            'attempt'         => $attempt,
            'created_at'      => now(),
        ]);

        $startTime = microtime(true);

        try {
            $response = Http::timeout($webhook->timeout)
                ->withHeaders($headers)
                ->withBody($payloadJson, 'application/json')
                ->post($webhook->url);

            $durationMs = (int) ((microtime(true) - $startTime) * 1000);
            $isSuccess = $response->successful();

            $delivery->update([
                'response_code' => $response->status(),
                'response_body' => mb_substr($response->body(), 0, 10240),
                'duration_ms'   => $durationMs,
                'status'        => $isSuccess ? 'success' : 'failed',
                'error_message' => $isSuccess ? null : "HTTP {$response->status()}",
            ]);

            $this->updateWebhookStatus($webhook, $isSuccess);
        } catch (\Throwable $e) {
            $durationMs = (int) ((microtime(true) - $startTime) * 1000);

            $delivery->update([
                'duration_ms'   => $durationMs,
                'status'        => 'failed',
                'error_message' => mb_substr($e->getMessage(), 0, 1000),
            ]);

            $this->updateWebhookStatus($webhook, false);

            Log::warning('Webhook delivery failed', [
                'webhook_id' => $webhook->id,
                'event'      => $event,
                'attempt'    => $attempt,
                'error'      => $e->getMessage(),
            ]);
        }

        return $delivery;
    }

    /**
     * Send a test ping event synchronously.
     */
    public function test(Webhook $webhook): WebhookDelivery
    {
        $payload = $this->buildPayload('ping', [
            'message' => 'Webhook test from ArtisanCMS',
        ]);

        return $this->send($webhook, 'ping', $payload);
    }

    /**
     * Generate a random HMAC secret.
     */
    public function generateSecret(): string
    {
        return 'whsec_' . Str::random(40);
    }

    /**
     * Get all available webhook events with category and description.
     *
     * @return array<string, array{category: string, description: string}>
     */
    public function getAvailableEvents(): array
    {
        $events = [
            'page.created' => [
                'category'    => __('cms.webhooks.category_content'),
                'description' => __('cms.webhooks.event_page_created'),
            ],
            'page.updated' => [
                'category'    => __('cms.webhooks.category_content'),
                'description' => __('cms.webhooks.event_page_updated'),
            ],
            'page.published' => [
                'category'    => __('cms.webhooks.category_content'),
                'description' => __('cms.webhooks.event_page_published'),
            ],
            'page.deleted' => [
                'category'    => __('cms.webhooks.category_content'),
                'description' => __('cms.webhooks.event_page_deleted'),
            ],
            'post.created' => [
                'category'    => __('cms.webhooks.category_content'),
                'description' => __('cms.webhooks.event_post_created'),
            ],
            'post.updated' => [
                'category'    => __('cms.webhooks.category_content'),
                'description' => __('cms.webhooks.event_post_updated'),
            ],
            'post.published' => [
                'category'    => __('cms.webhooks.category_content'),
                'description' => __('cms.webhooks.event_post_published'),
            ],
            'post.deleted' => [
                'category'    => __('cms.webhooks.category_content'),
                'description' => __('cms.webhooks.event_post_deleted'),
            ],
            'media.uploaded' => [
                'category'    => __('cms.webhooks.category_media'),
                'description' => __('cms.webhooks.event_media_uploaded'),
            ],
            'media.deleted' => [
                'category'    => __('cms.webhooks.category_media'),
                'description' => __('cms.webhooks.event_media_deleted'),
            ],
            'menu.updated' => [
                'category'    => __('cms.webhooks.category_navigation'),
                'description' => __('cms.webhooks.event_menu_updated'),
            ],
            'form.submitted' => [
                'category'    => __('cms.webhooks.category_forms'),
                'description' => __('cms.webhooks.event_form_submitted'),
            ],
            'user.created' => [
                'category'    => __('cms.webhooks.category_users'),
                'description' => __('cms.webhooks.event_user_created'),
            ],
            'user.updated' => [
                'category'    => __('cms.webhooks.category_users'),
                'description' => __('cms.webhooks.event_user_updated'),
            ],
            'plugin.activated' => [
                'category'    => __('cms.webhooks.category_system'),
                'description' => __('cms.webhooks.event_plugin_activated'),
            ],
            'plugin.deactivated' => [
                'category'    => __('cms.webhooks.category_system'),
                'description' => __('cms.webhooks.event_plugin_deactivated'),
            ],
            'theme.activated' => [
                'category'    => __('cms.webhooks.category_system'),
                'description' => __('cms.webhooks.event_theme_activated'),
            ],
            'site.settings_updated' => [
                'category'    => __('cms.webhooks.category_system'),
                'description' => __('cms.webhooks.event_site_settings_updated'),
            ],
        ];

        // Allow plugins to register custom webhook events
        /** @var array<string, array{category: string, description: string}> $events */
        $events = CMS::applyFilter('webhook.available_events', $events);

        return $events;
    }

    // ─── Internal methods ─────────────────────────────────

    /**
     * Build the standard webhook payload envelope.
     *
     * @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    protected function buildPayload(string $event, array $data): array
    {
        return [
            'id'        => (string) Str::uuid(),
            'event'     => $event,
            'timestamp' => now()->toIso8601String(),
            'data'      => $data,
        ];
    }

    /**
     * Build HTTP headers including HMAC signature and custom headers.
     *
     * @return array<string, string>
     */
    protected function buildHeaders(Webhook $webhook, string $event, string $payloadJson): array
    {
        $headers = [
            'Content-Type'      => 'application/json',
            'User-Agent'        => 'ArtisanCMS-Webhook/1.0',
            'X-Webhook-Event'   => $event,
        ];

        // HMAC signature if a secret is configured
        if ($webhook->secret) {
            $signature = hash_hmac('sha256', $payloadJson, $webhook->secret);
            $headers['X-Webhook-Signature'] = "sha256={$signature}";
        }

        // Merge custom webhook headers
        if (!empty($webhook->headers)) {
            $headers = array_merge($headers, $webhook->headers);
        }

        return $headers;
    }

    /**
     * Update webhook status after a delivery attempt.
     * Auto-disables the webhook after 10 consecutive failures.
     */
    protected function updateWebhookStatus(Webhook $webhook, bool $success): void
    {
        if ($success) {
            $webhook->update([
                'last_triggered_at'    => now(),
                'last_status'          => 'success',
                'consecutive_failures' => 0,
            ]);
        } else {
            $failures = $webhook->consecutive_failures + 1;
            $data = [
                'last_triggered_at'    => now(),
                'last_status'          => 'failed',
                'consecutive_failures' => $failures,
            ];

            // Auto-disable after 10 consecutive failures
            if ($failures >= 10) {
                $data['enabled'] = false;

                Log::error('Webhook auto-disabled after 10 consecutive failures', [
                    'webhook_id'   => $webhook->id,
                    'webhook_name' => $webhook->name,
                    'url'          => $webhook->url,
                ]);

                CMS::fire('webhook.auto_disabled', $webhook);
            }

            $webhook->update($data);
        }
    }
}
