<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\CmsPlugin;
use App\Models\CmsTheme;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ErrorRecoveryService
{
    private const SAFE_MODE_KEY = 'cms.safe_mode';
    private const RECOVERY_TOKEN_KEY = 'cms.recovery_token';
    private const FAULTY_EXTENSIONS_KEY = 'cms.faulty_extensions';

    /**
     * Check if safe mode is active.
     */
    public function isSafeMode(): bool
    {
        return (bool) Cache::get(self::SAFE_MODE_KEY, false);
    }

    /**
     * Enable safe mode (disables all non-core plugins and uses default theme).
     */
    public function enableSafeMode(): void
    {
        Cache::put(self::SAFE_MODE_KEY, true, now()->addHours(1));
        Log::warning('CMS Safe Mode enabled.');
    }

    /**
     * Disable safe mode.
     */
    public function disableSafeMode(): void
    {
        Cache::forget(self::SAFE_MODE_KEY);
        Cache::forget(self::FAULTY_EXTENSIONS_KEY);
        Log::info('CMS Safe Mode disabled.');
    }

    /**
     * Generate a recovery token for emergency admin access.
     */
    public function generateRecoveryToken(): string
    {
        $token = Str::random(64);
        Cache::put(self::RECOVERY_TOKEN_KEY, $token, now()->addHours(24));

        Log::warning('Recovery token generated. Use it at /admin?recovery_token=' . $token);

        return $token;
    }

    /**
     * Validate a recovery token.
     */
    public function validateRecoveryToken(string $token): bool
    {
        $storedToken = Cache::get(self::RECOVERY_TOKEN_KEY);
        if (!$storedToken) {
            return false;
        }

        return hash_equals($storedToken, $token);
    }

    /**
     * Record a faulty extension that caused an error.
     */
    public function markFaultyExtension(string $type, string $slug, string $error): void
    {
        $faulty = Cache::get(self::FAULTY_EXTENSIONS_KEY, []);
        $faulty[] = [
            'type' => $type,
            'slug' => $slug,
            'error' => Str::limit($error, 500),
            'recorded_at' => now()->toISOString(),
        ];

        Cache::put(self::FAULTY_EXTENSIONS_KEY, $faulty, now()->addDay());

        // Auto-disable the faulty extension
        $this->autoDisableExtension($type, $slug);

        Log::error("Faulty extension detected: {$type}/{$slug} - {$error}");
    }

    /**
     * Get all recorded faulty extensions.
     *
     * @return array<int, array{type: string, slug: string, error: string, recorded_at: string}>
     */
    public function getFaultyExtensions(): array
    {
        return Cache::get(self::FAULTY_EXTENSIONS_KEY, []);
    }

    /**
     * Auto-disable a faulty extension.
     */
    private function autoDisableExtension(string $type, string $slug): void
    {
        try {
            if ($type === 'plugin') {
                CmsPlugin::where('slug', $slug)->update(['enabled' => false]);
            } elseif ($type === 'theme') {
                // Don't disable the active theme, just log
                $theme = CmsTheme::where('slug', $slug)->where('active', true)->first();
                if ($theme) {
                    Log::critical("Active theme {$slug} is faulty. Entering safe mode.");
                    $this->enableSafeMode();
                }
            }
        } catch (\Throwable $e) {
            Log::error("Failed to auto-disable extension: {$e->getMessage()}");
        }
    }

    /**
     * Get system health status.
     *
     * @return array<string, mixed>
     */
    public function getHealthStatus(): array
    {
        return [
            'safe_mode' => $this->isSafeMode(),
            'faulty_extensions' => $this->getFaultyExtensions(),
            'has_recovery_token' => Cache::has(self::RECOVERY_TOKEN_KEY),
        ];
    }
}
