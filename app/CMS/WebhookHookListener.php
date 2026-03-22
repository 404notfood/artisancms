<?php

declare(strict_types=1);

namespace App\CMS;

use App\CMS\Facades\CMS;
use App\Services\WebhookService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;

/**
 * Bridges the CMS HookManager events to the WebhookService dispatcher.
 *
 * This listener registers itself on major CMS hook events and forwards them
 * to WebhookService::dispatch(), which in turn queues deliveries to all
 * matching enabled webhooks.
 *
 * The WebhookService is resolved lazily via the container to avoid circular
 * dependency issues during boot.
 */
class WebhookHookListener
{
    /**
     * Map of CMS hook names to webhook event names.
     *
     * Keys   = hook names fired by CMS::fire()
     * Values = event names expected by WebhookService / webhook subscribers
     *
     * @var array<string, string>
     */
    private const HOOK_TO_WEBHOOK_MAP = [
        // Pages
        'page.created'   => 'page.created',
        'page.updated'   => 'page.updated',
        'page.deleted'   => 'page.deleted',
        'page.published' => 'page.published',

        // Posts
        'post.created'   => 'post.created',
        'post.updated'   => 'post.updated',
        'post.deleted'   => 'post.deleted',
        'post.published' => 'post.published',

        // Media
        'media.uploaded' => 'media.uploaded',
        'media.deleted'  => 'media.deleted',

        // Comments
        'comment.created'  => 'comment.created',
        'comment.approved' => 'comment.approved',

        // Plugins
        'plugin.enabled'  => 'plugin.activated',
        'plugin.disabled' => 'plugin.deactivated',

        // Themes
        'theme.activated' => 'theme.activated',

        // Menus
        'menu.updated' => 'menu.updated',
    ];

    /**
     * Register webhook listeners on all mapped CMS hook events.
     */
    public function register(): void
    {
        foreach (self::HOOK_TO_WEBHOOK_MAP as $hookName => $webhookEvent) {
            // Use a high priority (99) so application logic runs first
            CMS::hook($hookName, function (mixed ...$args) use ($hookName, $webhookEvent): void {
                $this->handleHook($webhookEvent, $hookName, ...$args);
            }, 99);
        }
    }

    /**
     * Handle a fired CMS hook by dispatching the corresponding webhook event.
     */
    private function handleHook(string $webhookEvent, string $hookName, mixed ...$args): void
    {
        try {
            $data = $this->buildPayloadData($hookName, $args);

            /** @var WebhookService $webhookService */
            $webhookService = app(WebhookService::class);
            $webhookService->dispatch($webhookEvent, $data);
        } catch (\Throwable $e) {
            // Never let webhook dispatching break core CMS operations
            Log::warning('WebhookHookListener: failed to dispatch webhook', [
                'hook'    => $hookName,
                'event'   => $webhookEvent,
                'error'   => $e->getMessage(),
            ]);
        }
    }

    /**
     * Build the webhook payload data from hook arguments.
     *
     * Most CMS hooks pass a single Eloquent model as the first argument.
     * This method extracts a serialisable array from it.
     *
     * @param list<mixed> $args
     * @return array<string, mixed>
     */
    private function buildPayloadData(string $hookName, array $args): array
    {
        $primary = $args[0] ?? null;

        // Eloquent model: convert to array with type hint
        if ($primary instanceof Model) {
            return [
                'type' => class_basename($primary),
                'id'   => $primary->getKey(),
                'attributes' => $this->sanitizeAttributes($primary->toArray()),
            ];
        }

        // Associative array (e.g., theme.installed passes ['slug' => ..., 'manifest' => ...])
        if (is_array($primary)) {
            return $primary;
        }

        // Scalar or null fallback
        return [
            'hook'  => $hookName,
            'value' => $primary,
        ];
    }

    /**
     * Remove potentially sensitive or overly large attributes from the payload.
     *
     * @param array<string, mixed> $attributes
     * @return array<string, mixed>
     */
    private function sanitizeAttributes(array $attributes): array
    {
        $sensitiveKeys = ['password', 'secret', 'token', 'api_key', 'remember_token', 'two_factor_secret'];

        foreach ($sensitiveKeys as $key) {
            if (array_key_exists($key, $attributes)) {
                $attributes[$key] = '***';
            }
        }

        // Truncate very large content fields (e.g., page JSON content) to prevent oversized payloads
        foreach ($attributes as $key => $value) {
            if (is_string($value) && strlen($value) > 10000) {
                $attributes[$key] = mb_substr($value, 0, 10000) . '... [truncated]';
            }
        }

        return $attributes;
    }
}
