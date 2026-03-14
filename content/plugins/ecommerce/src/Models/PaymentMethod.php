<?php

declare(strict_types=1);

namespace Ecommerce\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class PaymentMethod extends Model
{
    protected $table = 'payment_methods';

    protected $fillable = [
        'name',
        'slug',
        'driver',
        'config',
        'active',
        'order',
    ];

    protected $casts = [
        'config' => 'encrypted:array',
        'active' => 'boolean',
        'order' => 'integer',
    ];

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

    public function isActive(): bool
    {
        return $this->active;
    }
}
