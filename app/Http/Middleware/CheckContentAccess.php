<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckContentAccess
{
    /**
     * Check if the current user has access to the content based on its access_level.
     *
     * Supported access levels:
     * - 'public' : everyone can view
     * - 'authenticated' : must be logged in
     * - 'role:xxx' : must have that role slug
     */
    public function handle(Request $request, Closure $next, string $paramName = 'page'): Response
    {
        $content = $request->route($paramName);

        if ($content === null || !is_object($content) || !isset($content->access_level)) {
            return $next($request);
        }

        $accessLevel = $content->access_level;

        // Public content is always accessible
        if ($accessLevel === 'public') {
            return $next($request);
        }

        $user = $request->user();

        // Authenticated content requires login
        if ($accessLevel === 'authenticated') {
            if ($user === null) {
                abort(403, __('cms.access.login_required'));
            }

            return $next($request);
        }

        // Role-based access: 'role:admin', 'role:editor', etc.
        if (str_starts_with($accessLevel, 'role:')) {
            if ($user === null) {
                abort(403, __('cms.access.login_required'));
            }

            $requiredRole = substr($accessLevel, 5);
            $userRoleSlug = $user->role?->slug;

            if ($userRoleSlug !== $requiredRole && !$user->isAdmin()) {
                abort(403, __('cms.access.insufficient_role'));
            }

            return $next($request);
        }

        return $next($request);
    }
}
