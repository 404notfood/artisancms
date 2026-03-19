<?php

declare(strict_types=1);

namespace MemberSpace\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MemberActivity extends Model
{
    protected $table = 'member_activity_log';

    protected $fillable = [
        'user_id',
        'type',
        'description',
        'metadata',
        'ip_address',
        'user_agent',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @param Builder<MemberActivity> $query
     */
    public function scopeForUser(Builder $query, int $userId): void
    {
        $query->where('user_id', $userId);
    }

    /**
     * @param Builder<MemberActivity> $query
     */
    public function scopeOfType(Builder $query, string $type): void
    {
        $query->where('type', $type);
    }

    /**
     * @param Builder<MemberActivity> $query
     */
    public function scopeRecent(Builder $query, int $limit = 20): void
    {
        $query->orderByDesc('created_at')->limit($limit);
    }
}
