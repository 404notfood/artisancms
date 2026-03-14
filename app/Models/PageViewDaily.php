<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class PageViewDaily extends Model
{
    /**
     * Disable default timestamps.
     */
    public $timestamps = false;

    /**
     * @var string
     */
    protected $table = 'cms_page_views_daily';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'path',
        'viewable_type',
        'viewable_id',
        'date',
        'views_count',
        'unique_visitors',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'date' => 'date',
            'views_count' => 'integer',
            'unique_visitors' => 'integer',
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
     * Filtrer par plage de dates.
     *
     * @param Builder<PageViewDaily> $query
     * @return Builder<PageViewDaily>
     */
    public function scopeBetweenDates(Builder $query, string $from, string $to): Builder
    {
        return $query->whereBetween('date', [$from, $to]);
    }

    /**
     * Filtrer par chemin de page.
     *
     * @param Builder<PageViewDaily> $query
     * @return Builder<PageViewDaily>
     */
    public function scopeForPath(Builder $query, string $path): Builder
    {
        return $query->where('path', $path);
    }
}
