<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Services\SettingService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckMaintenanceMode
{
    public function __construct(
        private readonly SettingService $settingService,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        // Skip if not installed yet
        if (! file_exists(storage_path('.installed'))) {
            return $next($request);
        }

        // Only check maintenance on front-end routes
        // Skip: admin, install, login, maintenance page itself, API, assets
        if (
            $request->is('admin', 'admin/*') ||
            $request->is('install', 'install/*') ||
            $request->is('login', 'register', 'password/*', 'forgot-password', 'reset-password/*') ||
            $request->is('maintenance') ||
            $request->is('up') ||
            $request->is('_debugbar/*') ||
            $request->is('sanctum/*')
        ) {
            return $next($request);
        }

        // Check if maintenance mode is enabled
        $enabled = $this->settingService->get('maintenance.enabled');

        if ($enabled === '1' || $enabled === 'true' || $enabled === true) {
            // Allow authenticated admin users to bypass
            $user = $request->user();
            if ($user && method_exists($user, 'isAdmin') && $user->isAdmin()) {
                return $next($request);
            }

            return redirect()->route('front.maintenance');
        }

        return $next($request);
    }
}
