<?php

declare(strict_types=1);

namespace Ecommerce\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ShippingZone extends Model
{
    protected $table = 'shipping_zones';

    protected $fillable = [
        'name',
        'countries',
        'is_default',
    ];

    protected $casts = [
        'countries' => 'array',
        'is_default' => 'boolean',
    ];

    // ---- Relationships ----

    public function methods(): HasMany
    {
        return $this->hasMany(ShippingMethod::class)->orderBy('order');
    }

    // ---- Scopes ----

    public function scopeDefault(Builder $query): Builder
    {
        return $query->where('is_default', true);
    }

    /**
     * Find zones that include the given country code.
     */
    public function scopeForCountry(Builder $query, string $countryCode): Builder
    {
        return $query->whereJsonContains('countries', strtoupper($countryCode));
    }

    // ---- Helpers ----

    public function hasCountry(string $countryCode): bool
    {
        return in_array(strtoupper($countryCode), $this->countries ?? [], true);
    }
}
