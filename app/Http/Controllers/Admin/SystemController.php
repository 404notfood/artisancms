<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\HealthCheckService;
use App\Services\SessionTrackingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SystemController extends Controller
{
    public function __construct(
        private readonly HealthCheckService $healthCheckService,
        private readonly SessionTrackingService $sessionService,
    ) {}

    public function sessions(Request $request): Response
    {
        $sessions = $this->sessionService->getAllActiveSessions();
        $currentSessionId = $request->session()->getId();

        $sessionsData = $sessions->map(fn ($s) => [
            'id' => $s->id,
            'user' => [
                'id' => $s->user->id,
                'name' => $s->user->name,
                'email' => $s->user->email,
            ],
            'ip_address' => $s->ip_address,
            'device' => $s->device ?? 'desktop',
            'browser' => $s->browser ?? 'Unknown',
            'os' => $s->os ?? 'Unknown',
            'last_activity' => $s->last_activity?->toISOString(),
            'is_current' => $s->session_id === $currentSessionId,
        ]);

        return Inertia::render('Admin/System/Sessions', [
            'sessions' => $sessionsData,
        ]);
    }

    public function destroySession(int $sessionId): RedirectResponse
    {
        $this->sessionService->forceLogout($sessionId);

        return redirect()
            ->back()
            ->with('success', __('cms.system.session_terminated'));
    }

    public function logoutAllSessions(Request $request): RedirectResponse
    {
        $this->sessionService->logoutOthers(
            $request->user()->id,
            $request->session()->getId(),
        );

        return redirect()
            ->back()
            ->with('success', __('cms.system.all_sessions_terminated'));
    }

    public function healthCheck(): Response
    {
        $result = $this->healthCheckService->runAll();

        return Inertia::render('Admin/System/HealthCheck', $result);
    }

    public function healthCheckApi(): JsonResponse
    {
        $result = $this->healthCheckService->runAll();

        $statusCode = match ($result['overall']) {
            'healthy' => 200,
            'degraded' => 200,
            'unhealthy' => 503,
        };

        return response()->json($result, $statusCode);
    }
}
