<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    /**
     * @var string
     */
    protected $table = 'cms_notifications';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'type',
        'title',
        'message',
        'data',
        'read_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'data' => 'array',
            'read_at' => 'datetime',
        ];
    }

    // ─── Relations ────────────────────────────────────────

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // ─── Scopes ───────────────────────────────────────────

    /**
     * Non lues uniquement.
     *
     * @param Builder<Notification> $query
     * @return Builder<Notification>
     */
    public function scopeUnread(Builder $query): Builder
    {
        return $query->whereNull('read_at');
    }

    /**
     * Par type.
     *
     * @param Builder<Notification> $query
     * @return Builder<Notification>
     */
    public function scopeByType(Builder $query, string $type): Builder
    {
        return $query->where('type', $type);
    }

    /**
     * Recentes (limitees).
     *
     * @param Builder<Notification> $query
     * @return Builder<Notification>
     */
    public function scopeRecent(Builder $query, int $limit = 20): Builder
    {
        return $query->latest()->limit($limit);
    }

    // ─── Methods ──────────────────────────────────────────

    /**
     * Marquer comme lue.
     */
    public function markAsRead(): void
    {
        $this->update(['read_at' => now()]);
    }
}
