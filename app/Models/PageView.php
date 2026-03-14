<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class PageView extends Model
{
    /**
     * Disable default timestamps (only created_at is used via DB default).
     */
    public $timestamps = false;

    /**
     * @var string
     */
    protected $table = 'cms_page_views';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'path',
        'viewable_type',
        'viewable_id',
        'referrer',
        'user_agent',
        'country',
        'device_type',
        'browser',
        'date',
        'created_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'date' => 'date',
            'created_at' => 'datetime',
        ];
    }

    // ─── Relations ────────────────────────────────────────

    /**
     * @return MorphTo<Model, $this>
     */
    public function viewable(): MorphTo
    {
        return $this->morphTo();
    }

    // ─── Scopes ───────────────────────────────────────────

    /**
     * Filtrer par chemin de page.
     *
     * @param Builder<PageView> $query
     * @return Builder<PageView>
     */
    public function scopeForPath(Builder $query, string $path): Builder
    {
        return $query->where('path', $path);
    }

    /**
     * Filtrer par date exacte.
     *
     * @param Builder<PageView> $query
     * @return Builder<PageView>
     */
    public function scopeForDate(Builder $query, string $date): Builder
    {
        return $query->where('date', $date);
    }

    /**
     * Filtrer par plage de dates.
     *
     * @param Builder<PageView> $query
     * @return Builder<PageView>
     */
    public function scopeBetweenDates(Builder $query, string $from, string $to): Builder
    {
        return $query->whereBetween('date', [$from, $to]);
    }

    /**
     * Filtrer par entite viewable (type + id).
     *
     * @param Builder<PageView> $query
     * @return Builder<PageView>
     */
    public function scopeForViewable(Builder $query, string $type, int $id): Builder
    {
        return $query->where('viewable_type', $type)->where('viewable_id', $id);
    }
}
