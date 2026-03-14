<?php

declare(strict_types=1);

namespace Ecommerce\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShippingMethod extends Model
{
    protected $table = 'shipping_methods';

    protected $fillable = [
        'shipping_zone_id',
        'name',
        'type',
        'cost',
        'min_order_amount',
        'min_weight',
        'max_weight',
        'active',
        'order',
    ];

    protected $casts = [
        'cost' => 'decimal:2',
        'min_order_amount' => 'decimal:2',
        'min_weight' => 'decimal:2',
        'max_weight' => 'decimal:2',
        'active' => 'boolean',
        'order' => 'integer',
    ];

    // ---- Relationships ----

    public function zone(): BelongsTo
    {
        return $this->belongsTo(ShippingZone::class, 'shipping_zone_id');
    }

    // ---- Scopes ----

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('active', true);
    }

    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('order');
    }

    // ---- Helpers ----

    public function isFree(): bool
    {
        return $this->type === 'free';
    }

    public function isActive(): bool
    {
        return $this->active;
    }
}
