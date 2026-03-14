<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    protected array $supportedLocales = ['fr', 'en'];

    public function handle(Request $request, Closure $next): Response
    {
        $locale = $this->detectLocale($request);

        app()->setLocale($locale);

        return $next($request);
    }

    protected function detectLocale(Request $request): string
    {
        // 1. Explicit query parameter (?lang=en)
        if ($request->has('lang') && in_array($request->query('lang'), $this->supportedLocales)) {
            $locale = $request->query('lang');
            session(['locale' => $locale]);
            return $locale;
        }

        // 2. Session (previously selected)
        if (session()->has('locale') && in_array(session('locale'), $this->supportedLocales)) {
            return session('locale');
        }

        // 3. User preference (authenticated)
        if ($request->user() && isset($request->user()->preferences['locale'])) {
            $userLocale = $request->user()->preferences['locale'];
            if (in_array($userLocale, $this->supportedLocales)) {
                return $userLocale;
            }
        }

        // 4. Accept-Language header
        $preferred = $request->getPreferredLanguage($this->supportedLocales);
        if ($preferred) {
            return $preferred;
        }

        // 5. Fallback to app config
        return config('app.locale', 'fr');
    }
}
