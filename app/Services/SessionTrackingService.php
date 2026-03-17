<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\UserSession;
use Illuminate\Support\Collection;
use Illuminate\Http\Request;

class SessionTrackingService
{
    /**
     * Track or update a user session.
     */
    public function track(int $userId, Request $request): UserSession
    {
        $sessionId = $request->session()->getId();
        $userAgent = $request->userAgent() ?? '';

        return UserSession::updateOrCreate(
            ['session_id' => $sessionId],
            [
                'user_id' => $userId,
                'ip_address' => $request->ip(),
                'user_agent' => $userAgent,
                'device' => $this->detectDevice($userAgent),
                'browser' => $this->detectBrowser($userAgent),
                'os' => $this->detectOS($userAgent),
                'last_activity' => now(),
            ],
        );
    }

    /**
     * Get all active sessions for a user.
     *
     * @return Collection<int, UserSession>
     */
    public function getUserSessions(int $userId): Collection
    {
        return UserSession::where('user_id', $userId)
            ->where('last_activity', '>=', now()->subDays(7))
            ->latest('last_activity')
            ->get();
    }

    /**
     * Get all active sessions across all users.
     *
     * @return Collection<int, UserSession>
     */
    public function getAllActiveSessions(): Collection
    {
        return UserSession::with('user')
            ->active()
            ->latest('last_activity')
            ->get();
    }

    /**
     * Force logout a specific session.
     */
    public function forceLogout(int $sessionId): void
    {
        UserSession::where('id', $sessionId)->delete();
    }

    /**
     * Force logout all sessions except current.
     */
    public function logoutOthers(int $userId, string $currentSessionId): void
    {
        UserSession::where('user_id', $userId)
            ->where('session_id', '!=', $currentSessionId)
            ->delete();
    }

    private function detectDevice(string $ua): string
    {
        if (preg_match('/mobile|android|iphone|ipod/i', $ua)) return 'mobile';
        if (preg_match('/tablet|ipad/i', $ua)) return 'tablet';
        return 'desktop';
    }

    private function detectBrowser(string $ua): string
    {
        if (str_contains($ua, 'Firefox')) return 'Firefox';
        if (str_contains($ua, 'Edg')) return 'Edge';
        if (str_contains($ua, 'Chrome')) return 'Chrome';
        if (str_contains($ua, 'Safari')) return 'Safari';
        if (str_contains($ua, 'Opera') || str_contains($ua, 'OPR')) return 'Opera';
        return 'Unknown';
    }

    private function detectOS(string $ua): string
    {
        if (str_contains($ua, 'Windows')) return 'Windows';
        if (str_contains($ua, 'Mac OS')) return 'macOS';
        if (str_contains($ua, 'Linux')) return 'Linux';
        if (str_contains($ua, 'Android')) return 'Android';
        if (str_contains($ua, 'iOS') || str_contains($ua, 'iPhone')) return 'iOS';
        return 'Unknown';
    }
}
