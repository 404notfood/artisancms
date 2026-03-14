<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WidgetArea extends Model
{
    /**
     * @var string
     */
    protected $table = 'cms_widget_areas';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'slug',
        'description',
        'site_id',
    ];

    // ─── Relations ────────────────────────────────────────

    /**
     * @return HasMany<Widget, $this>
     */
    public function widgets(): HasMany
    {
        return $this->hasMany(Widget::class)->orderBy('order');
    }

    /**
     * @return BelongsTo<Site, $this>
     */
    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }

    // ─── Scopes ───────────────────────────────────────────

    /**
     * Scope to load only active widgets within the area.
     *
     * @param Builder<WidgetArea> $query
     * @return Builder<WidgetArea>
     */
    public function scopeWithActiveWidgets(Builder $query): Builder
    {
        return $query->with(['widgets' => function ($q): void {
            $q->where('active', true)->orderBy('order');
        }]);
    }
}
