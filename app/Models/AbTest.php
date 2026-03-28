<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AbTest extends Model
{
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'page_id',
        'variant_a_content',
        'variant_b_content',
        'status',
        'traffic_split',
        'winner',
        'impressions_a',
        'impressions_b',
        'conversions_a',
        'conversions_b',
        'goal_type',
        'goal_target',
        'started_at',
        'ended_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'variant_a_content' => 'array',
            'variant_b_content' => 'array',
            'traffic_split' => 'integer',
            'impressions_a' => 'integer',
            'impressions_b' => 'integer',
            'conversions_a' => 'integer',
            'conversions_b' => 'integer',
            'started_at' => 'datetime',
            'ended_at' => 'datetime',
        ];
    }

    // ---- Relations ----

    /**
     * @return BelongsTo<Page, $this>
     */
    public function page(): BelongsTo
    {
        return $this->belongsTo(Page::class);
    }

    // ---- Scopes ----

    /**
     * @param Builder<AbTest> $query
     * @return Builder<AbTest>
     */
    public function scopeRunning(Builder $query): Builder
    {
        return $query->where('status', 'running');
    }

    /**
     * @param Builder<AbTest> $query
     * @return Builder<AbTest>
     */
    public function scopeCompleted(Builder $query): Builder
    {
        return $query->where('status', 'completed');
    }

    // ---- Methods ----

    /**
     * Assign a variant to a visitor deterministically.
     *
     * Uses a hash of (test ID + visitor ID) to ensure the same visitor
     * always sees the same variant, distributed according to traffic_split.
     */
    public function getVariantForVisitor(string $visitorId): string
    {
        $hash = crc32($this->id . ':' . $visitorId);
        // Use absolute value and modulo 100 for a 0-99 range
        $bucket = abs($hash) % 100;

        return $bucket < $this->traffic_split ? 'a' : 'b';
    }

    /**
     * Basic statistical significance test (simplified chi-squared).
     *
     * Returns true if p-value < 0.05 (95% confidence).
     * Requires at least 100 impressions per variant.
     */
    public function isSignificant(): bool
    {
        if ($this->impressions_a < 100 || $this->impressions_b < 100) {
            return false;
        }

        $rateA = $this->impressions_a > 0
            ? $this->conversions_a / $this->impressions_a
            : 0.0;
        $rateB = $this->impressions_b > 0
            ? $this->conversions_b / $this->impressions_b
            : 0.0;

        $totalImpressions = $this->impressions_a + $this->impressions_b;
        $totalConversions = $this->conversions_a + $this->conversions_b;

        if ($totalConversions === 0 || $totalImpressions === $totalConversions) {
            return false;
        }

        // Pooled conversion rate
        $pooledRate = $totalConversions / $totalImpressions;
        $pooledNoConvert = 1 - $pooledRate;

        // Standard error of the difference
        $se = sqrt(
            $pooledRate * $pooledNoConvert * (1 / $this->impressions_a + 1 / $this->impressions_b)
        );

        if ($se <= 0) {
            return false;
        }

        // Z-score
        $z = abs($rateA - $rateB) / $se;

        // z > 1.96 corresponds to p < 0.05 (two-tailed)
        return $z > 1.96;
    }
}
