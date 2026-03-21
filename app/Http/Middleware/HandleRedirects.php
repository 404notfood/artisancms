<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Services\RedirectService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class HandleRedirects
{
    public function __construct(
        private readonly RedirectService $redirectService,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        // Skip if not installed yet or on install routes
        if (! file_exists(storage_path('.installed')) || $request->is('install', 'install/*')) {
            return $next($request);
        }

        // Only check redirects for GET requests
        if ($request->method() !== 'GET') {
            return $next($request);
        }

        try {
            $redirect = $this->redirectService->findByPath($request->path());
        } catch (\Throwable) {
            return $next($request);
        }

        if ($redirect !== null) {
            $this->redirectService->incrementHits($redirect);

            return redirect($redirect->target_url, $redirect->status_code);
        }

        return $next($request);
    }
}
