<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Services\SessionTrackingService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TrackUserSession
{
    public function __construct(
        private readonly SessionTrackingService $sessions,
    ) {}

    /**
     * @param Closure(Request): Response $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user() && $request->hasSession()) {
            $this->sessions->track((int) $request->user()->id, $request);
        }

        return $next($request);
    }
}
