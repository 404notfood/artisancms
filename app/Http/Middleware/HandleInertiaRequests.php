<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\CmsPlugin;
use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $locale = app()->getLocale();

        // Flatten translation array for frontend
        $translations = [];
        $cmsTranslations = __('cms') ?? [];
        if (is_array($cmsTranslations)) {
            $this->flattenTranslations($cmsTranslations, '', $translations);
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user()?->load('role'),
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'warning' => fn () => $request->session()->get('warning'),
                'info' => fn () => $request->session()->get('info'),
            ],
            'translations' => $translations,
            'locale' => $locale,
            'cms' => [
                'name' => config('cms.name', 'ArtisanCMS'),
                'version' => config('cms.version', '1.0.0'),
                'enabledPlugins' => fn () => CmsPlugin::where('enabled', true)->pluck('slug')->toArray(),
            ],
            'notifications_count' => fn () => auth()->check()
                ? \App\Models\Notification::where('user_id', auth()->id())->whereNull('read_at')->count()
                : 0,
            'popups' => fn () => \App\Models\Popup::active()->current()->get(),
            'cookie_consent' => fn () => [
                'enabled' => (bool) (Setting::get('cookie_consent.enabled') ?? config('cms.cookie_consent.enabled', true)),
                'position' => (string) (Setting::get('cookie_consent.position') ?? config('cms.cookie_consent.position', 'bottom')),
                'type' => (string) (Setting::get('cookie_consent.type') ?? config('cms.cookie_consent.type', 'opt-in')),
                'privacy_url' => (string) (Setting::get('cookie_consent.privacy_url') ?? '/politique-de-confidentialite'),
            ],
        ];
    }

    private function flattenTranslations(array $array, string $prefix, array &$result): void
    {
        foreach ($array as $key => $value) {
            $fullKey = $prefix ? "{$prefix}.{$key}" : $key;
            if (is_array($value)) {
                $this->flattenTranslations($value, $fullKey, $result);
            } else {
                $result[$fullKey] = $value;
            }
        }
    }
}
