<?php

declare(strict_types=1);

namespace FormBuilder\Services;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class SpamProtectionService
{
    /**
     * Validate a form submission against spam protection rules.
     *
     * Returns true if the submission is legitimate, false if it is spam.
     *
     * @param array<string, mixed> $spamConfig
     */
    public function validate(Request $request, array $spamConfig): bool
    {
        // 1. Honeypot: hidden field that must remain empty
        if ($spamConfig['honeypot'] ?? false) {
            if ($request->filled('_hp_name')) {
                Log::info('Form Builder: Honeypot field filled, marking as spam.', [
                    'ip' => $request->ip(),
                ]);

                return false;
            }
        }

        // 2. Time check: submission too fast = bot
        if ($spamConfig['time_check'] ?? false) {
            $minTime = (int) ($spamConfig['min_time_seconds'] ?? 3);
            $loadedAt = $request->input('_form_loaded_at');

            if ($loadedAt !== null && (time() - (int) $loadedAt) < $minTime) {
                Log::info('Form Builder: Form submitted too quickly, marking as spam.', [
                    'ip' => $request->ip(),
                    'elapsed' => time() - (int) $loadedAt,
                    'min_time' => $minTime,
                ]);

                return false;
            }
        }

        // 3. Rate limit per IP
        $limitPerIp = (int) ($spamConfig['limit_per_ip'] ?? 0);

        if ($limitPerIp > 0) {
            $ip = $request->ip() ?? 'unknown';
            $cacheKey = 'form_builder_rate:' . md5($ip);
            $currentCount = (int) Cache::get($cacheKey, 0);

            if ($currentCount >= $limitPerIp) {
                Log::info('Form Builder: Rate limit exceeded for IP.', [
                    'ip' => $ip,
                    'limit' => $limitPerIp,
                    'count' => $currentCount,
                ]);

                return false;
            }

            // Increment counter with 1-hour TTL
            Cache::put($cacheKey, $currentCount + 1, now()->addHour());
        }

        return true;
    }
}
