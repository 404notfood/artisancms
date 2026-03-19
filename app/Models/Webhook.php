<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Webhook extends Model
{
    /**
     * @var string
     */
    protected $table = 'cms_webhooks';

    /**
     * @var list<string>
     */
    protected $hidden = [
        'secret',
    ];

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'url',
        'secret',
        'events',
        'headers',
        'enabled',
        'retry_count',
        'timeout',
        'consecutive_failures',
        'last_triggered_at',
        'last_status',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'events'               => 'array',
            'headers'              => 'array',
            'enabled'              => 'boolean',
            'retry_count'          => 'integer',
            'timeout'              => 'integer',
            'consecutive_failures' => 'integer',
            'last_triggered_at'    => 'datetime',
        ];
    }

    // ─── Relations ────────────────────────────────────────

    /**
     * @return HasMany<WebhookDelivery, $this>
     */
    public function deliveries(): HasMany
    {
        return $this->hasMany(WebhookDelivery::class);
    }

    // ─── Scopes ───────────────────────────────────────────

    /**
     * Filter only enabled webhooks.
     *
     * @param Builder<Webhook> $query
     * @return Builder<Webhook>
     */
    public function scopeEnabled(Builder $query): Builder
    {
        return $query->where('enabled', true);
    }

    /**
     * Filter webhooks listening to a specific event.
     *
     * @param Builder<Webhook> $query
     * @return Builder<Webhook>
     */
    public function scopeListeningTo(Builder $query, string $event): Builder
    {
        return $query->whereJsonContains('events', $event);
    }

    // ─── Helpers ──────────────────────────────────────────

    /**
     * Check if this webhook listens to the given event.
     */
    public function listensTo(string $event): bool
    {
        return in_array($event, $this->events ?? [], true);
    }

    /**
     * Check if this webhook was auto-disabled due to too many failures.
     */
    public function isAutoDisabled(): bool
    {
        return !$this->enabled && $this->consecutive_failures >= 10;
    }

    /**
     * Reset the failure counter and re-enable the webhook.
     */
    public function resetFailures(): void
    {
        $this->update([
            'consecutive_failures' => 0,
            'enabled'              => true,
        ]);
    }
}
