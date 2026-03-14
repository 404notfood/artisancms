<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\Site;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ResolveSite
{
    /**
     * Resolve the current site from the request and bind it to the container.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $site = $this->resolveSite($request);

        if ($site === null) {
            abort(404, __('cms.sites.not_found'));
        }

        if (!$site->is_active) {
            abort(503, __('cms.sites.inactive'));
        }

        // Bind the resolved site into the container
        app()->instance('current.site', $site);

        // Apply site-level locale and timezone
        app()->setLocale($site->locale);
        config(['app.timezone' => $site->timezone]);
        date_default_timezone_set($site->timezone);

        return $next($request);
    }

    /**
     * Resolve the site by: 1) custom domain, 2) subdomain, 3) primary fallback.
     */
    protected function resolveSite(Request $request): ?Site
    {
        $host = $request->getHost();

        // 1. Match by custom domain
        $site = Site::where('domain', $host)->first();
        if ($site !== null) {
            return $site;
        }

        // 2. Match by subdomain (e.g. client.artisancms.dev)
        $baseDomain = config('cms.multisite.base_domain', 'artisancms.dev');
        if (str_ends_with($host, '.' . $baseDomain)) {
            $subdomain = str_replace('.' . $baseDomain, '', $host);

            return Site::where('subdomain', $subdomain)->first();
        }

        // 3. Fall back to the primary site
        return Site::where('is_primary', true)->first();
    }
}
