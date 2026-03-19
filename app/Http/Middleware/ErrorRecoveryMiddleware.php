<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Services\ErrorRecoveryService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ErrorRecoveryMiddleware
{
    public function __construct(
        private readonly ErrorRecoveryService $recoveryService,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        // Check recovery token in query string
        $recoveryToken = $request->query('recovery_token');
        if ($recoveryToken && $this->recoveryService->validateRecoveryToken($recoveryToken)) {
            // Valid recovery token - disable safe mode and continue
            $this->recoveryService->disableSafeMode();
            session()->flash('success', __('cms.recovery.safe_mode_disabled'));
        }

        // In safe mode, share the info with all Inertia responses
        if ($this->recoveryService->isSafeMode()) {
            $request->attributes->set('safe_mode', true);
        }

        try {
            return $next($request);
        } catch (\Throwable $e) {
            // If an error occurs and it seems extension-related, record it
            $this->detectFaultyExtension($e);

            throw $e;
        }
    }

    private function detectFaultyExtension(\Throwable $e): void
    {
        $trace = $e->getFile();

        // Check if error originates from a plugin
        if (str_contains($trace, 'content/plugins/')) {
            preg_match('#content/plugins/([^/]+)#', $trace, $matches);
            if (!empty($matches[1])) {
                $this->recoveryService->markFaultyExtension('plugin', $matches[1], $e->getMessage());
            }
        }

        // Check if error originates from a theme
        if (str_contains($trace, 'content/themes/')) {
            preg_match('#content/themes/([^/]+)#', $trace, $matches);
            if (!empty($matches[1])) {
                $this->recoveryService->markFaultyExtension('theme', $matches[1], $e->getMessage());
            }
        }
    }
}
