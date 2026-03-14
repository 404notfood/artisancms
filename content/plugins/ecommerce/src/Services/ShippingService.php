<?php

declare(strict_types=1);

namespace Ecommerce\Services;

use Ecommerce\Models\ShippingMethod;
use Ecommerce\Models\ShippingZone;
use Illuminate\Database\Eloquent\Collection;

class ShippingService
{
    /**
     * Get all shipping zones with their methods.
     *
     * @return Collection<int, ShippingZone>
     */
    public function getZones(): Collection
    {
        return ShippingZone::with('methods')->orderBy('name')->get();
    }

    /**
     * Get active shipping methods available for a given country code.
     *
     * @param string $countryCode ISO 3166-1 alpha-2 country code.
     * @return Collection<int, ShippingMethod>
     */
    public function getMethodsForCountry(string $countryCode): Collection
    {
        $zone = ShippingZone::forCountry($countryCode)->first();

        if ($zone === null) {
            // Fallback to default zone
            $zone = ShippingZone::default()->first();
        }

        if ($zone === null) {
            return new Collection();
        }

        return $zone->methods()->active()->ordered()->get();
    }

    /**
     * Calculate shipping cost for a given country, cart total, and weight.
     * Returns the cheapest available method with its cost.
     *
     * @param string $countryCode ISO 3166-1 alpha-2 country code.
     * @param float $cartTotal The total cart value.
     * @param float $cartWeight The total cart weight.
     * @return array{method: ShippingMethod|null, cost: float}
     */
    public function calculateShipping(string $countryCode, float $cartTotal, float $cartWeight = 0): array
    {
        $methods = $this->getMethodsForCountry($countryCode);

        if ($methods->isEmpty()) {
            return ['method' => null, 'cost' => 0.0];
        }

        $bestMethod = null;
        $bestCost = PHP_FLOAT_MAX;

        foreach ($methods as $method) {
            $cost = $this->calculateMethodCost($method, $cartTotal, $cartWeight);

            if ($cost === null) {
                continue; // Method not applicable
            }

            if ($cost < $bestCost) {
                $bestCost = $cost;
                $bestMethod = $method;
            }
        }

        if ($bestMethod === null) {
            return ['method' => null, 'cost' => 0.0];
        }

        return ['method' => $bestMethod, 'cost' => $bestCost];
    }

    /**
     * Create a new shipping zone.
     *
     * @param array<string, mixed> $data
     */
    public function createZone(array $data): ShippingZone
    {
        return ShippingZone::create($data);
    }

    /**
     * Update an existing shipping zone.
     *
     * @param ShippingZone $zone
     * @param array<string, mixed> $data
     */
    public function updateZone(ShippingZone $zone, array $data): ShippingZone
    {
        $zone->update($data);

        return $zone->fresh();
    }

    /**
     * Delete a shipping zone and its methods.
     */
    public function deleteZone(ShippingZone $zone): void
    {
        $zone->delete();
    }

    /**
     * Create a new shipping method for a zone.
     *
     * @param ShippingZone $zone
     * @param array<string, mixed> $data
     */
    public function createMethod(ShippingZone $zone, array $data): ShippingMethod
    {
        return $zone->methods()->create($data);
    }

    /**
     * Update an existing shipping method.
     *
     * @param ShippingMethod $method
     * @param array<string, mixed> $data
     */
    public function updateMethod(ShippingMethod $method, array $data): ShippingMethod
    {
        $method->update($data);

        return $method->fresh();
    }

    /**
     * Delete a shipping method.
     */
    public function deleteMethod(ShippingMethod $method): void
    {
        $method->delete();
    }

    /**
     * Calculate the cost for a specific shipping method based on cart data.
     * Returns null if the method is not applicable.
     */
    private function calculateMethodCost(ShippingMethod $method, float $cartTotal, float $cartWeight): ?float
    {
        return match ($method->type) {
            'free' => $this->calculateFreeShipping($method, $cartTotal),
            'flat' => (float) $method->cost,
            'weight_based' => $this->calculateWeightBasedShipping($method, $cartWeight),
            'price_based' => $this->calculatePriceBasedShipping($method, $cartTotal),
            default => null,
        };
    }

    /**
     * Free shipping: only applicable if min_order_amount is met (when set).
     */
    private function calculateFreeShipping(ShippingMethod $method, float $cartTotal): ?float
    {
        if ($method->min_order_amount !== null && $cartTotal < (float) $method->min_order_amount) {
            return null;
        }

        return 0.0;
    }

    /**
     * Weight-based shipping: check weight bounds and return cost.
     */
    private function calculateWeightBasedShipping(ShippingMethod $method, float $cartWeight): ?float
    {
        if ($method->min_weight !== null && $cartWeight < (float) $method->min_weight) {
            return null;
        }

        if ($method->max_weight !== null && $cartWeight > (float) $method->max_weight) {
            return null;
        }

        return (float) $method->cost;
    }

    /**
     * Price-based shipping: check min order amount and return cost.
     */
    private function calculatePriceBasedShipping(ShippingMethod $method, float $cartTotal): ?float
    {
        if ($method->min_order_amount !== null && $cartTotal < (float) $method->min_order_amount) {
            return null;
        }

        return (float) $method->cost;
    }
}
