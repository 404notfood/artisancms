<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Widget extends Model
{
    /**
     * @var string
     */
    protected $table = 'cms_widgets';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'widget_area_id',
        'type',
        'title',
        'config',
        'order',
        'active',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'config' => 'array',
            'active' => 'boolean',
            'order'  => 'integer',
        ];
    }

    // ─── Relations ────────────────────────────────────────

    /**
     * @return BelongsTo<WidgetArea, $this>
     */
    public function widgetArea(): BelongsTo
    {
        return $this->belongsTo(WidgetArea::class);
    }

    // ─── Scopes ───────────────────────────────────────────

    /**
     * Filter only active widgets.
     *
     * @param Builder<Widget> $query
     * @return Builder<Widget>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('active', true);
    }
}
