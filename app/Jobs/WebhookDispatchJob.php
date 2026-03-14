<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\Webhook;
use App\Models\WebhookDelivery;
use App\Services\WebhookService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class WebhookDispatchJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The queue this job should be dispatched to.
     *
     * @var string
     */
    public string $queue = 'webhooks';

    /**
     * The number of times the job may be attempted.
     *
     * @var int
     */
    public int $tries = 1;

    /**
     * Backoff intervals in seconds (exponential).
     *
     * @var array<int, int>
     */
    public array $backoff = [30, 120, 600];

    /**
     * Create a new job instance.
     *
     * @param array<string, mixed> $payload
     */
    public function __construct(
        public readonly Webhook $webhook,
        public readonly string $event,
        public readonly array $payload,
        private readonly int $attempt = 1,
    ) {}

    /**
     * Execute the job.
     */
    public function handle(WebhookService $webhookService): void
    {
        // Skip if webhook was disabled since the job was dispatched
        $this->webhook->refresh();

        if (!$this->webhook->enabled) {
            return;
        }

        $delivery = $webhookService->send(
            $this->webhook,
            $this->event,
            $this->payload,
            $this->attempt,
        );

        // If delivery failed and retryable, re-dispatch with incremented attempt
        if ($delivery->isFailed() && $this->attempt < $this->webhook->retry_count) {
            $nextAttempt = $this->attempt + 1;
            $backoffIndex = min($this->attempt - 1, count($this->backoff) - 1);
            $delay = $this->backoff[$backoffIndex];

            // Update delivery with next retry time
            $delivery->update([
                'next_retry_at' => now()->addSeconds($delay),
            ]);

            self::dispatch(
                $this->webhook,
                $this->event,
                $this->payload,
                $nextAttempt,
            )->delay($delay)->onQueue('webhooks');
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(?\Throwable $exception): void
    {
        WebhookDelivery::create([
            'webhook_id'    => $this->webhook->id,
            'event'         => $this->event,
            'payload'       => $this->payload,
            'status'        => 'failed',
            'attempt'       => $this->attempt,
            'error_message' => $exception ? mb_substr($exception->getMessage(), 0, 1000) : __('cms.webhooks.unknown_error'),
            'created_at'    => now(),
        ]);
    }
}
