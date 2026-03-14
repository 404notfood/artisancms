<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureInstalled
{
    public function handle(Request $request, Closure $next): Response
    {
        $isInstalled = file_exists(storage_path('.installed'));
        $isInstallRoute = $request->is('install') || $request->is('install/*');

        if (!$isInstalled && !$isInstallRoute) {
            return redirect('/install');
        }

        if ($isInstalled && $isInstallRoute) {
            abort(404);
        }

        return $next($request);
    }
}
