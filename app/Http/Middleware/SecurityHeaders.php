<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        $response->headers->set('X-XSS-Protection', '1; mode=block');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

        // HSTS - only in production (requires HTTPS)
        if (app()->environment('production')) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }

        // Prevent FastCGI/proxy caching on pages that contain CSRF tokens
        // or are behind auth, to avoid 419 errors from stale cached tokens.
        if ($request->isMethod('GET') && (
            $request->is('login', 'register', 'forgot-password', 'reset-password/*', 'admin', 'admin/*', 'install', 'install/*')
            || $request->user()
        )) {
            $response->headers->set('Cache-Control', 'no-cache, no-store, must-revalidate, private');
            $response->headers->set('Pragma', 'no-cache');
        }

        // Content Security Policy
        $cspDirectives = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: https:",
            "connect-src 'self'",
            "frame-ancestors 'self'",
            "base-uri 'self'",
            "form-action 'self'",
        ];

        if (app()->environment('production')) {
            $response->headers->set('Content-Security-Policy', implode('; ', $cspDirectives));
        } else {
            // In development, use report-only so CSP violations don't block Vite HMR etc.
            $response->headers->set('Content-Security-Policy-Report-Only', implode('; ', $cspDirectives));
        }

        return $response;
    }
}
