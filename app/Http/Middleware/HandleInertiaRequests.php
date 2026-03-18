<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\CmsPlugin;
use App\Models\Comment;
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
                'enabledPlugins' => fn () => $this->safeQuery(
                    fn () => CmsPlugin::where('enabled', true)->pluck('slug')->toArray(),
                    [],
                ),
            ],
            'notifications_count' => fn () => $this->safeQuery(
                fn () => auth()->check()
                    ? \App\Models\Notification::where('user_id', auth()->id())->whereNull('read_at')->count()
                    : 0,
                0,
            ),
            'sidebar_badges' => fn () => $this->getSidebarBadges(),
            'popups' => fn () => $this->safeQuery(
                fn () => \App\Models\Popup::active()->current()->get(),
                [],
            ),
            'cookie_consent' => fn () => $this->safeQuery(
                fn () => [
                    'enabled' => (bool) (Setting::get('cookie_consent.enabled') ?? config('cms.cookie_consent.enabled', true)),
                    'position' => (string) (Setting::get('cookie_consent.position') ?? config('cms.cookie_consent.position', 'bottom')),
                    'type' => (string) (Setting::get('cookie_consent.type') ?? config('cms.cookie_consent.type', 'opt-in')),
                    'privacy_url' => (string) (Setting::get('cookie_consent.privacy_url') ?? '/politique-de-confidentialite'),
                ],
                ['enabled' => true, 'position' => 'bottom', 'type' => 'opt-in', 'privacy_url' => '/politique-de-confidentialite'],
            ),
        ];
    }

    /**
     * Execute a query safely, returning a fallback on any error (missing table, etc.).
     */
    private function safeQuery(callable $callback, mixed $fallback): mixed
    {
        try {
            return $callback();
        } catch (\Throwable) {
            return $fallback;
        }
    }

    /**
     * @return array<string, int>
     */
    private function getSidebarBadges(): array
    {
        $badges = [];

        try {
            $badges['unread_comments'] = Comment::where('status', 'pending')->count();
        } catch (\Throwable) {
            $badges['unread_comments'] = 0;
        }

        try {
            if (class_exists(\FormBuilder\Models\FormSubmission::class)) {
                $badges['new_forms'] = \FormBuilder\Models\FormSubmission::where('status', 'new')->count();
            } else {
                $badges['new_forms'] = 0;
            }
        } catch (\Throwable) {
            $badges['new_forms'] = 0;
        }

        try {
            if (class_exists(\ContactForm\Models\FormSubmission::class)) {
                $badges['new_contacts'] = \ContactForm\Models\FormSubmission::whereNull('read_at')->count();
            } else {
                $badges['new_contacts'] = 0;
            }
        } catch (\Throwable) {
            $badges['new_contacts'] = 0;
        }

        try {
            if (class_exists(\Ecommerce\Models\Order::class)) {
                $badges['pending_orders'] = \Ecommerce\Models\Order::where('status', 'pending')->count();
            } else {
                $badges['pending_orders'] = 0;
            }
        } catch (\Throwable) {
            $badges['pending_orders'] = 0;
        }

        return $badges;
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
