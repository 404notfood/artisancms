<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Services\AnalyticsService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TrackPageView
{
    public function __construct(
        private readonly AnalyticsService $analyticsService,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Ne tracker que les requetes GET reussies (pages rendues)
        if ($request->method() !== 'GET') {
            return $response;
        }

        // Ignorer les requetes AJAX / fetch
        if ($request->ajax() || $request->wantsJson()) {
            return $response;
        }

        // Ignorer les reponses non-HTML (redirections, erreurs, etc.)
        if ($response->getStatusCode() !== 200) {
            return $response;
        }

        // Ignorer les chemins admin, api et install
        $path = $request->path();
        if ($this->isExcludedPath($path)) {
            return $response;
        }

        $this->analyticsService->trackPageView($request);

        return $response;
    }

    /**
     * Verifier si le chemin doit etre exclu du tracking.
     */
    private function isExcludedPath(string $path): bool
    {
        $excludedPrefixes = [
            'admin',
            'api',
            'install',
            '_debugbar',
            'sanctum',
            'livewire',
        ];

        foreach ($excludedPrefixes as $prefix) {
            if (str_starts_with($path, $prefix)) {
                return true;
            }
        }

        return false;
    }
}
