<?php

declare(strict_types=1);

namespace MemberSpace\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class MembershipPlan extends Model
{
    use SoftDeletes;

    protected $table = 'membership_plans';

    protected $fillable = [
        'name',
        'slug',
        'description',
        'price',
        'billing_period',
        'duration_days',
        'trial_days',
        'features',
        'permissions',
        'restricted_roles',
        'is_popular',
        'active',
        'order',
        'stripe_price_id',
        'badge_label',
        'badge_color',
        'member_limit',
    ];

    protected function casts(): array
    {
        return [
            'features' => 'array',
            'permissions' => 'array',
            'restricted_roles' => 'array',
            'price' => 'decimal:2',
            'is_popular' => 'boolean',
            'active' => 'boolean',
            'order' => 'integer',
            'duration_days' => 'integer',
            'trial_days' => 'integer',
            'member_limit' => 'integer',
        ];
    }

    /**
     * @return HasMany<UserMembership, $this>
     */
    public function memberships(): HasMany
    {
        return $this->hasMany(UserMembership::class, 'plan_id');
    }

    /**
     * @param Builder<MembershipPlan> $query
     */
    public function scopeActive(Builder $query): void
    {
        $query->where('active', true);
    }

    /**
     * @param Builder<MembershipPlan> $query
     */
    public function scopeOrdered(Builder $query): void
    {
        $query->orderBy('order')->orderBy('price');
    }

    public function getActiveMembersCountAttribute(): int
    {
        return $this->memberships()->whereIn('status', ['active', 'trial'])->count();
    }

    public function isFree(): bool
    {
        return $this->price <= 0;
    }

    public function hasAvailableSlots(): bool
    {
        if ($this->member_limit === null) {
            return true;
        }

        return $this->active_members_count < $this->member_limit;
    }
}
