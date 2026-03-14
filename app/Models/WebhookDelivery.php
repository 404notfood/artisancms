<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WebhookDelivery extends Model
{
    /**
     * Disable default timestamps (only created_at is used).
     */
    public $timestamps = false;

    /**
     * @var string
     */
    protected $table = 'cms_webhook_deliveries';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'webhook_id',
        'event',
        'payload',
        'request_headers',
        'response_code',
        'response_body',
        'duration_ms',
        'status',
        'attempt',
        'error_message',
        'next_retry_at',
        'created_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'payload'         => 'array',
            'request_headers' => 'array',
            'response_code'   => 'integer',
            'duration_ms'     => 'integer',
            'attempt'         => 'integer',
            'next_retry_at'   => 'datetime',
            'created_at'      => 'datetime',
        ];
    }

    // ─── Relations ────────────────────────────────────────

    /**
     * @return BelongsTo<Webhook, $this>
     */
    public function webhook(): BelongsTo
    {
        return $this->belongsTo(Webhook::class);
    }

    // ─── Scopes ───────────────────────────────────────────

    /**
     * Filter failed deliveries.
     *
     * @param Builder<WebhookDelivery> $query
     * @return Builder<WebhookDelivery>
     */
    public function scopeFailed(Builder $query): Builder
    {
        return $query->where('status', 'failed');
    }

    /**
     * Filter successful deliveries.
     *
     * @param Builder<WebhookDelivery> $query
     * @return Builder<WebhookDelivery>
     */
    public function scopeSuccessful(Builder $query): Builder
    {
        return $query->where('status', 'success');
    }

    /**
     * Filter pending deliveries.
     *
     * @param Builder<WebhookDelivery> $query
     * @return Builder<WebhookDelivery>
     */
    public function scopePending(Builder $query): Builder
    {
        return $query->where('status', 'pending');
    }

    // ─── Helpers ──────────────────────────────────────────

    /**
     * Check if the delivery was successful.
     */
    public function isSuccess(): bool
    {
        return $this->status === 'success';
    }

    /**
     * Check if the delivery failed.
     */
    public function isFailed(): bool
    {
        return $this->status === 'failed';
    }

    /**
     * Check if this failed delivery can be retried.
     */
    public function isRetryable(): bool
    {
        return $this->isFailed() && $this->attempt < $this->webhook->retry_count;
    }
}
