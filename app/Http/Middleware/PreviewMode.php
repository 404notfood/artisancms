<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Carbon\Carbon;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware that enables temporal preview mode.
 *
 * When an authenticated admin accesses a page with ?preview_at=YYYY-MM-DD,
 * the system simulates that date for content visibility checks.
 * The scopePublished scopes on Page/Post respect this date instead of now().
 */
class PreviewMode
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $previewAt = $request->query('preview_at');

        if (! is_string($previewAt) || $previewAt === '') {
            return $next($request);
        }

        // Only authenticated admins can use temporal preview
        $user = $request->user();
        if (! $user || ! method_exists($user, 'isAdmin') || ! $user->isAdmin()) {
            return $next($request);
        }

        // Validate the date format
        try {
            $date = Carbon::parse($previewAt)->endOfDay();
        } catch (\Throwable) {
            return $next($request);
        }

        // Reject dates more than 2 years in the future or in the past
        if ($date->isBefore(now()->subYears(2)) || $date->isAfter(now()->addYears(2))) {
            return $next($request);
        }

        // Store the preview date in the container for scopes to use
        app()->instance('cms.preview_at', $date);

        $response = $next($request);

        // Ensure preview mode responses are never cached
        if (method_exists($response, 'header')) {
            $response->header('Cache-Control', 'no-store, no-cache, must-revalidate');
            $response->header('X-CMS-Preview-At', $date->toDateString());
        }

        return $response;
    }
}
