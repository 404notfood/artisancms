<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\UserSession;
use App\Support\UserAgentParser;
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
                'device' => UserAgentParser::detectDeviceType($userAgent),
                'browser' => UserAgentParser::detectBrowser($userAgent),
                'os' => UserAgentParser::detectOS($userAgent),
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

}
