<?php

declare(strict_types=1);

namespace AiAssistant\Services;

use AiAssistant\Models\AiUsageLog;

class UsageTracker
{
    /**
     * Log an AI usage entry.
     */
    public function log(
        int $userId,
        string $action,
        string $driver,
        string $model,
        int $promptTokens,
        int $completionTokens,
        int $responseTimeMs,
        ?array $metadata = null,
    ): void {
        AiUsageLog::create([
            'user_id' => $userId,
            'action' => $action,
            'driver' => $driver,
            'model' => $model,
            'prompt_tokens' => $promptTokens,
            'completion_tokens' => $completionTokens,
            'total_tokens' => $promptTokens + $completionTokens,
            'response_time_ms' => $responseTimeMs,
            'metadata' => $metadata,
        ]);
    }

    /**
     * Get total tokens used this month (global).
     */
    public function getMonthlyUsage(): int
    {
        return (int) AiUsageLog::where('created_at', '>=', now()->startOfMonth())
            ->sum('total_tokens');
    }

    /**
     * Get total tokens used today for a specific user.
     */
    public function getDailyUsageForUser(int $userId): int
    {
        return (int) AiUsageLog::where('user_id', $userId)
            ->where('created_at', '>=', now()->startOfDay())
            ->sum('total_tokens');
    }

    /**
     * Check if the global monthly token limit has been exceeded.
     */
    public function hasExceededMonthlyLimit(): bool
    {
        $limit = config('ai-assistant.limits.monthly_tokens', 500000);

        return $this->getMonthlyUsage() >= $limit;
    }

    /**
     * Check if a specific user has exceeded their daily token limit.
     */
    public function hasExceededDailyLimit(int $userId): bool
    {
        $limit = config('ai-assistant.limits.daily_tokens_per_user', 50000);

        return $this->getDailyUsageForUser($userId) >= $limit;
    }

    /**
     * Check if the monthly limit has been exceeded for a specific user
     * using a custom limit value.
     */
    public function hasExceededMonthlyLimitForUser(int $userId, int $monthlyLimit): bool
    {
        return AiUsageLog::monthlyTokensForUser($userId) >= $monthlyLimit;
    }

    /**
     * Check if the daily limit has been exceeded for a specific user
     * using a custom limit value.
     */
    public function hasExceededDailyLimitWithCustom(int $userId, int $dailyLimit): bool
    {
        $used = (int) AiUsageLog::where('user_id', $userId)
            ->where('created_at', '>=', now()->startOfDay())
            ->sum('total_tokens');

        return $used >= $dailyLimit;
    }

    /**
     * Get remaining monthly tokens for a user.
     */
    public function remainingMonthlyTokens(int $userId, int $monthlyLimit): int
    {
        $used = AiUsageLog::monthlyTokensForUser($userId);

        return max(0, $monthlyLimit - $used);
    }

    /**
     * Estimate cost before generation.
     *
     * @return array{estimated_input_tokens: int, estimated_output_tokens: int, estimated_total_tokens: int, estimated_cost_usd: float}
     */
    public function estimateCost(string $inputText, string $model): array
    {
        // Rough estimation: 1 token ~ 4 chars in English, ~3 in French
        $estimatedInputTokens = (int) ceil(mb_strlen($inputText) / 3);
        $estimatedOutputTokens = min($estimatedInputTokens, 1024);

        // Approximate pricing per million tokens (input / output)
        $pricing = [
            'gpt-4o' => ['input' => 2.50, 'output' => 10.00],
            'gpt-4o-mini' => ['input' => 0.15, 'output' => 0.60],
            'claude-sonnet-4-20250514' => ['input' => 3.00, 'output' => 15.00],
            'claude-haiku-235-20241022' => ['input' => 0.80, 'output' => 4.00],
        ];

        $modelPricing = $pricing[$model] ?? ['input' => 1.00, 'output' => 3.00];
        $estimatedCost = ($estimatedInputTokens * $modelPricing['input'] / 1_000_000)
            + ($estimatedOutputTokens * $modelPricing['output'] / 1_000_000);

        return [
            'estimated_input_tokens' => $estimatedInputTokens,
            'estimated_output_tokens' => $estimatedOutputTokens,
            'estimated_total_tokens' => $estimatedInputTokens + $estimatedOutputTokens,
            'estimated_cost_usd' => round($estimatedCost, 6),
        ];
    }

    /**
     * Get usage statistics for the admin dashboard.
     *
     * @param string $period One of: 'day', 'week', 'month', 'year', or '30d'
     *
     * @return array{total_tokens: int, total_requests: int, avg_response_time_ms: int, by_action: array, by_user: array}
     */
    public function getUsageStats(string $period = '30d'): array
    {
        $since = match ($period) {
            'day' => now()->startOfDay(),
            'week' => now()->startOfWeek(),
            'month', '30d' => now()->startOfMonth(),
            'year' => now()->startOfYear(),
            default => now()->startOfMonth(),
        };

        $logs = AiUsageLog::where('created_at', '>=', $since);

        return [
            'total_tokens' => (int) $logs->sum('total_tokens'),
            'total_requests' => $logs->count(),
            'avg_response_time_ms' => (int) $logs->avg('response_time_ms'),
            'by_action' => $logs->clone()
                ->selectRaw('action, COUNT(*) as count, SUM(total_tokens) as tokens')
                ->groupBy('action')
                ->get()
                ->keyBy('action')
                ->toArray(),
            'by_user' => $logs->clone()
                ->selectRaw('user_id, COUNT(*) as count, SUM(total_tokens) as tokens')
                ->groupBy('user_id')
                ->get()
                ->toArray(),
        ];
    }
}
