<?php

declare(strict_types=1);

namespace Ecommerce\Services;

use Ecommerce\Models\TaxRule;
use Illuminate\Database\Eloquent\Collection;

class TaxService
{
    /**
     * Get all active tax rules, ordered by priority.
     *
     * @return Collection<int, TaxRule>
     */
    public function getRules(): Collection
    {
        return TaxRule::active()->ordered()->get();
    }

    /**
     * Calculate the total tax amount for a given amount, country, and optional region.
     *
     * Supports compound taxes: non-compound taxes are applied on the base amount,
     * then compound taxes are applied on the base + non-compound tax total.
     *
     * @param float $amount The taxable amount.
     * @param string $countryCode ISO 3166-1 alpha-2 country code.
     * @param string|null $region Optional region/state code.
     * @return float The total tax amount.
     */
    public function calculateTax(float $amount, string $countryCode, ?string $region = null): float
    {
        $rules = $this->getApplicableRules($countryCode, $region);

        if ($rules->isEmpty()) {
            return 0.0;
        }

        // Group by compound flag
        $nonCompound = $rules->where('compound', false);
        $compound = $rules->where('compound', true);

        // First pass: calculate non-compound taxes on base amount
        $nonCompoundTax = 0.0;
        foreach ($nonCompound as $rule) {
            $nonCompoundTax += $amount * ((float) $rule->rate / 100);
        }

        // Second pass: calculate compound taxes on (base + non-compound taxes)
        $compoundBase = $amount + $nonCompoundTax;
        $compoundTax = 0.0;
        foreach ($compound as $rule) {
            $compoundTax += $compoundBase * ((float) $rule->rate / 100);
        }

        return round($nonCompoundTax + $compoundTax, 2);
    }

    /**
     * Get the effective tax rate for a given country and region.
     *
     * @param string $countryCode ISO 3166-1 alpha-2 country code.
     * @param string|null $region Optional region/state code.
     * @return float The effective tax rate as a percentage.
     */
    public function getTaxRate(string $countryCode, ?string $region = null): float
    {
        $rules = $this->getApplicableRules($countryCode, $region);

        if ($rules->isEmpty()) {
            return 0.0;
        }

        // Sum all non-compound rates directly
        $nonCompoundRate = $rules->where('compound', false)->sum('rate');

        // Compound rates are additive on top of the non-compound total
        $compoundRate = $rules->where('compound', true)->sum('rate');
        $effectiveCompound = $compoundRate * (1 + $nonCompoundRate / 100);

        return round((float) ($nonCompoundRate + $effectiveCompound), 2);
    }

    /**
     * Create a new tax rule.
     *
     * @param array<string, mixed> $data
     */
    public function createRule(array $data): TaxRule
    {
        if (!empty($data['country_code'])) {
            $data['country_code'] = strtoupper($data['country_code']);
        }

        return TaxRule::create($data);
    }

    /**
     * Update an existing tax rule.
     *
     * @param TaxRule $rule
     * @param array<string, mixed> $data
     */
    public function updateRule(TaxRule $rule, array $data): TaxRule
    {
        if (!empty($data['country_code'])) {
            $data['country_code'] = strtoupper($data['country_code']);
        }

        $rule->update($data);

        return $rule->fresh();
    }

    /**
     * Delete a tax rule.
     */
    public function deleteRule(TaxRule $rule): void
    {
        $rule->delete();
    }

    /**
     * Get applicable tax rules for a country and optional region.
     *
     * Returns country+region specific rules if available, otherwise country-only
     * rules, and finally falls back to default (null country_code) rules.
     *
     * @param string $countryCode
     * @param string|null $region
     * @return Collection<int, TaxRule>
     */
    private function getApplicableRules(string $countryCode, ?string $region = null): Collection
    {
        $countryCode = strtoupper($countryCode);

        $query = TaxRule::active()->ordered();

        // Get rules matching country + region, country only, or default
        $query->where(function ($q) use ($countryCode, $region) {
            // Specific country + region match
            if ($region !== null) {
                $q->where(function ($q2) use ($countryCode, $region) {
                    $q2->where('country_code', $countryCode)
                       ->where('region', $region);
                });
                $q->orWhere(function ($q2) use ($countryCode) {
                    $q2->where('country_code', $countryCode)
                       ->whereNull('region');
                });
            } else {
                // Country match (any region)
                $q->where('country_code', $countryCode);
            }

            // Default rules (no country)
            $q->orWhereNull('country_code');
        });

        $rules = $query->get();

        // If we have country-specific rules, exclude default-only rules
        $countryRules = $rules->whereNotNull('country_code');
        if ($countryRules->isNotEmpty()) {
            return $countryRules;
        }

        return $rules;
    }
}
