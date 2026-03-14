<?php

declare(strict_types=1);

namespace Ecommerce\Services;

use Ecommerce\Models\Coupon;
use Illuminate\Database\Eloquent\Collection;

class CouponService
{
    /**
     * Get all coupons ordered by creation date.
     *
     * @return Collection<int, Coupon>
     */
    public function all(): Collection
    {
        return Coupon::orderByDesc('created_at')->get();
    }

    /**
     * Create a new coupon.
     *
     * @param array<string, mixed> $data
     */
    public function create(array $data): Coupon
    {
        return Coupon::create($data);
    }

    /**
     * Update an existing coupon.
     *
     * @param array<string, mixed> $data
     */
    public function update(Coupon $coupon, array $data): Coupon
    {
        $coupon->update($data);

        return $coupon->fresh();
    }

    /**
     * Delete a coupon.
     */
    public function delete(Coupon $coupon): void
    {
        $coupon->delete();
    }

    /**
     * Find a valid coupon by code.
     */
    public function findByCode(string $code): ?Coupon
    {
        return Coupon::where('code', $code)->valid()->first();
    }
}
