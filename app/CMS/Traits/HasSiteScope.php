<?php

declare(strict_types=1);

namespace App\CMS\Traits;

use App\Models\Site;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

trait HasSiteScope
{
    /**
     * Boot: auto-scope queries by current site and auto-assign site_id on creation.
     */
    protected static function bootHasSiteScope(): void
    {
        // Global scope: filter by current site
        static::addGlobalScope('site', function (Builder $builder): void {
            if (app()->bound('current.site')) {
                $builder->where(
                    $builder->getModel()->getTable() . '.site_id',
                    app('current.site')->id,
                );
            }
        });

        // Auto-assign site_id on creation
        static::creating(function ($model): void {
            if (app()->bound('current.site') && empty($model->site_id)) {
                $model->site_id = app('current.site')->id;
            }
        });
    }

    /**
     * The site this model belongs to.
     *
     * @return BelongsTo<Site, $this>
     */
    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }
}
