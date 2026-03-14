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
        // Only check redirects for GET requests
        if ($request->method() !== 'GET') {
            return $next($request);
        }

        $redirect = $this->redirectService->findByPath($request->path());

        if ($redirect !== null) {
            $this->redirectService->incrementHits($redirect);

            return redirect($redirect->target_url, $redirect->status_code);
        }

        return $next($request);
    }
}
