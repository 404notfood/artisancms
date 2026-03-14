<?php

declare(strict_types=1);

namespace Ecommerce\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomerAddress extends Model
{
    protected $table = 'customer_addresses';

    protected $fillable = [
        'user_id',
        'label',
        'first_name',
        'last_name',
        'address',
        'address2',
        'city',
        'postal_code',
        'country',
        'phone',
        'is_default_shipping',
        'is_default_billing',
    ];

    protected $casts = [
        'is_default_shipping' => 'boolean',
        'is_default_billing' => 'boolean',
    ];

    // ---- Relationships ----

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // ---- Scopes ----

    public function scopeForUser(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    public function scopeDefaultShipping(Builder $query): Builder
    {
        return $query->where('is_default_shipping', true);
    }

    public function scopeDefaultBilling(Builder $query): Builder
    {
        return $query->where('is_default_billing', true);
    }
}
