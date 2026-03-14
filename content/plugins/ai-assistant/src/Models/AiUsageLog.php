<?php

declare(strict_types=1);

namespace AiAssistant\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiUsageLog extends Model
{
    /**
     * The table associated with the model.
     */
    protected $table = 'ai_usage_logs';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'user_id',
        'action',
        'driver',
        'model',
        'prompt_tokens',
        'completion_tokens',
        'total_tokens',
        'response_time_ms',
        'metadata',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'prompt_tokens' => 'integer',
            'completion_tokens' => 'integer',
            'total_tokens' => 'integer',
            'response_time_ms' => 'integer',
            'metadata' => 'array',
        ];
    }

    // --- Relations ---

    /**
     * Get the user that owns the usage log.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // --- Scopes ---

    /**
     * Scope to filter logs for a specific user.
     */
    public function scopeForUser(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope to filter logs for a specific action.
     */
    public function scopeForAction(Builder $query, string $action): Builder
    {
        return $query->where('action', $action);
    }

    /**
     * Scope to filter logs for the current month.
     */
    public function scopeThisMonth(Builder $query): Builder
    {
        return $query->where('created_at', '>=', now()->startOfMonth());
    }

    /**
     * Scope to filter logs for today.
     */
    public function scopeToday(Builder $query): Builder
    {
        return $query->where('created_at', '>=', now()->startOfDay());
    }

    // --- Static helpers ---

    /**
     * Get total tokens used this month for a specific user.
     */
    public static function monthlyTokensForUser(int $userId): int
    {
        return (int) static::where('user_id', $userId)
            ->where('created_at', '>=', now()->startOfMonth())
            ->sum('total_tokens');
    }
}
