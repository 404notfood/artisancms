<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SearchLog extends Model
{
    protected $table = 'cms_search_logs';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'query',
        'results_count',
        'user_id',
        'ip_address',
        'source',
    ];

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get popular search queries.
     */
    public function scopePopular($query, int $days = 30)
    {
        return $query->where('created_at', '>=', now()->subDays($days))
            ->selectRaw('query, COUNT(*) as count, AVG(results_count) as avg_results')
            ->groupBy('query')
            ->orderByDesc('count');
    }
}
