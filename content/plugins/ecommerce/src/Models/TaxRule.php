<?php

declare(strict_types=1);

namespace Ecommerce\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class TaxRule extends Model
{
    protected $table = 'tax_rules';

    protected $fillable = [
        'name',
        'country_code',
        'region',
        'rate',
        'priority',
        'compound',
        'active',
    ];

    protected $casts = [
        'rate' => 'decimal:2',
        'priority' => 'integer',
        'compound' => 'boolean',
        'active' => 'boolean',
    ];

    // ---- Scopes ----

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('active', true);
    }

    public function scopeForCountry(Builder $query, string $countryCode): Builder
    {
        return $query->where(function (Builder $q) use ($countryCode) {
            $q->where('country_code', strtoupper($countryCode))
              ->orWhereNull('country_code');
        });
    }

    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('priority');
    }

    // ---- Helpers ----

    public function isDefault(): bool
    {
        return $this->country_code === null;
    }

    public function isCompound(): bool
    {
        return $this->compound;
    }
}
