<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\AbTest;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AbTestService
{
    private const COOKIE_NAME = 'cms_ab_visitor';
    private const COOKIE_LIFETIME_MINUTES = 43200; // 30 days

    /**
     * Record an impression for a specific variant.
     */
    public function recordImpression(AbTest $test, string $variant): void
    {
        if ($test->status !== 'running') {
            return;
        }

        $column = $variant === 'a' ? 'impressions_a' : 'impressions_b';

        AbTest::where('id', $test->id)->increment($column);
    }

    /**
     * Record a conversion for a specific variant.
     */
    public function recordConversion(AbTest $test, string $variant): void
    {
        if ($test->status !== 'running') {
            return;
        }

        $column = $variant === 'a' ? 'conversions_a' : 'conversions_b';

        AbTest::where('id', $test->id)->increment($column);
    }

    /**
     * Get detailed results for an A/B test.
     *
     * @return array{
     *     variant_a: array{impressions: int, conversions: int, rate: float},
     *     variant_b: array{impressions: int, conversions: int, rate: float},
     *     is_significant: bool,
     *     confidence_level: string,
     *     lift: float|null,
     *     recommended_winner: string|null,
     * }
     */
    public function getResults(AbTest $test): array
    {
        $rateA = $test->impressions_a > 0
            ? round($test->conversions_a / $test->impressions_a * 100, 2)
            : 0.0;

        $rateB = $test->impressions_b > 0
            ? round($test->conversions_b / $test->impressions_b * 100, 2)
            : 0.0;

        $isSignificant = $test->isSignificant();

        // Calculate lift (percentage improvement of B over A)
        $lift = null;
        if ($rateA > 0) {
            $lift = round(($rateB - $rateA) / $rateA * 100, 2);
        }

        // Determine recommended winner
        $winner = null;
        if ($isSignificant) {
            $winner = $rateA >= $rateB ? 'a' : 'b';
        }

        return [
            'variant_a' => [
                'impressions' => $test->impressions_a,
                'conversions' => $test->conversions_a,
                'rate' => $rateA,
            ],
            'variant_b' => [
                'impressions' => $test->impressions_b,
                'conversions' => $test->conversions_b,
                'rate' => $rateB,
            ],
            'is_significant' => $isSignificant,
            'confidence_level' => $isSignificant ? '95%' : 'insufficient',
            'lift' => $lift,
            'recommended_winner' => $winner,
        ];
    }

    /**
     * Assign a variant to the current visitor based on cookie/session.
     *
     * The visitor ID is stored in a cookie to ensure deterministic assignment
     * across requests. The same visitor always gets the same variant.
     */
    public function assignVariant(AbTest $test, Request $request): string
    {
        $visitorId = $this->getOrCreateVisitorId($request);

        return $test->getVariantForVisitor($visitorId);
    }

    /**
     * Get the variant content for the assigned visitor.
     *
     * @return array<string, mixed>|null
     */
    public function getVariantContent(AbTest $test, Request $request): ?array
    {
        if ($test->status !== 'running') {
            return null;
        }

        $variant = $this->assignVariant($test, $request);

        return $variant === 'a'
            ? $test->variant_a_content
            : $test->variant_b_content;
    }

    /**
     * Get or create a persistent visitor ID from the cookie.
     */
    private function getOrCreateVisitorId(Request $request): string
    {
        $visitorId = $request->cookie(self::COOKIE_NAME);

        if (is_string($visitorId) && $visitorId !== '') {
            return $visitorId;
        }

        $visitorId = Str::uuid()->toString();

        // Queue the cookie so it persists across requests
        cookie()->queue(
            self::COOKIE_NAME,
            $visitorId,
            self::COOKIE_LIFETIME_MINUTES,
            '/',
            null,
            false,
            true // httpOnly
        );

        return $visitorId;
    }
}
