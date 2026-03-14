<?php

declare(strict_types=1);

namespace Ecommerce\Services;

use Ecommerce\Models\CustomerAddress;
use Ecommerce\Models\Order;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class CustomerService
{
    /**
     * Get all addresses for a user.
     *
     * @return Collection<int, CustomerAddress>
     */
    public function getAddresses(int $userId): Collection
    {
        return CustomerAddress::forUser($userId)
            ->orderByDesc('is_default_shipping')
            ->orderByDesc('is_default_billing')
            ->orderBy('label')
            ->get();
    }

    /**
     * Create a new address for a user.
     * Ensures only one default per type.
     *
     * @param array<string, mixed> $data
     */
    public function createAddress(int $userId, array $data): CustomerAddress
    {
        if (!empty($data['is_default_shipping'])) {
            CustomerAddress::forUser($userId)
                ->defaultShipping()
                ->update(['is_default_shipping' => false]);
        }

        if (!empty($data['is_default_billing'])) {
            CustomerAddress::forUser($userId)
                ->defaultBilling()
                ->update(['is_default_billing' => false]);
        }

        $data['user_id'] = $userId;

        return CustomerAddress::create($data);
    }

    /**
     * Update an existing address.
     * Ensures only one default per type.
     *
     * @param array<string, mixed> $data
     */
    public function updateAddress(CustomerAddress $address, array $data): CustomerAddress
    {
        if (!empty($data['is_default_shipping'])) {
            CustomerAddress::forUser($address->user_id)
                ->defaultShipping()
                ->where('id', '!=', $address->id)
                ->update(['is_default_shipping' => false]);
        }

        if (!empty($data['is_default_billing'])) {
            CustomerAddress::forUser($address->user_id)
                ->defaultBilling()
                ->where('id', '!=', $address->id)
                ->update(['is_default_billing' => false]);
        }

        $address->update($data);

        return $address->fresh();
    }

    /**
     * Delete an address.
     */
    public function deleteAddress(CustomerAddress $address): void
    {
        $address->delete();
    }

    /**
     * Get the default shipping address for a user.
     */
    public function getDefaultShipping(int $userId): ?CustomerAddress
    {
        return CustomerAddress::forUser($userId)
            ->defaultShipping()
            ->first();
    }

    /**
     * Get the default billing address for a user.
     */
    public function getDefaultBilling(int $userId): ?CustomerAddress
    {
        return CustomerAddress::forUser($userId)
            ->defaultBilling()
            ->first();
    }

    /**
     * Get paginated order history for a user.
     *
     * @param array<string, mixed> $filters
     */
    public function getOrderHistory(int $userId, array $filters = []): LengthAwarePaginator
    {
        $query = Order::where('user_id', $userId)->with('items');

        if (!empty($filters['status'])) {
            $query->byStatus($filters['status']);
        }

        $query->recent();

        return $query->paginate((int) ($filters['per_page'] ?? 10));
    }
}
