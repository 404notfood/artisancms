<?php

declare(strict_types=1);

namespace AiAssistant\Http\Middleware;

use AiAssistant\Models\AiUsageLog;
use AiAssistant\Services\UsageTracker;
use App\Models\CmsPlugin;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\Response;

class AiRateLimiter
{
    public function __construct(
        protected UsageTracker $usageTracker,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $userId = $request->user()->id;

        // 1. Rate limiting classique : max N requetes par minute par utilisateur
        $rateLimitKey = "ai-assistant:{$userId}";
        $maxPerMinute = config('ai-assistant.limits.requests_per_minute', 20);

        if (RateLimiter::tooManyAttempts($rateLimitKey, $maxPerMinute)) {
            return response()->json([
                'error' => __('ai-assistant::messages.rate_limit_exceeded'),
                'retry_after' => RateLimiter::availableIn($rateLimitKey),
            ], 429);
        }

        RateLimiter::hit($rateLimitKey, 60);

        // 2. Verification de la limite quotidienne par utilisateur
        $settings = CmsPlugin::where('slug', 'ai-assistant')->first()?->settings ?? [];
        $dailyLimit = (int) ($settings['per_user_daily_token_limit'] ?? 50000);

        if ($this->usageTracker->hasExceededDailyLimitWithCustom($userId, $dailyLimit)) {
            return response()->json([
                'error' => __('ai-assistant::messages.daily_limit_exceeded'),
                'tokens_used_today' => (int) AiUsageLog::where('user_id', $userId)
                    ->where('created_at', '>=', now()->startOfDay())
                    ->sum('total_tokens'),
                'tokens_limit_today' => $dailyLimit,
            ], 429);
        }

        // 3. Verification de la limite mensuelle globale
        $monthlyLimit = (int) ($settings['monthly_token_limit'] ?? 500000);

        if ($this->usageTracker->hasExceededMonthlyLimitForUser($userId, $monthlyLimit)) {
            return response()->json([
                'error' => __('ai-assistant::messages.monthly_limit_exceeded'),
                'tokens_used' => AiUsageLog::monthlyTokensForUser($userId),
                'tokens_limit' => $monthlyLimit,
            ], 429);
        }

        return $next($request);
    }
}
