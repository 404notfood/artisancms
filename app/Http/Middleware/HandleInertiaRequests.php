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
        $isInstalled = file_exists(storage_path('.installed'));

        // Flatten translation array for frontend
        $translations = [];
        $cmsTranslations = __('cms') ?? [];
        if (is_array($cmsTranslations)) {
            $this->flattenTranslations($cmsTranslations, '', $translations);
        }

        // Minimal shared data when not installed (install wizard)
        if (! $isInstalled) {
            return [
                ...parent::share($request),
                'auth' => ['user' => null],
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
                    'enabledPlugins' => [],
                    'dashboardTheme' => 'indigo',
                    'adminPrefix' => config('cms.admin.resolved_prefix', config('cms.admin.prefix', 'admin')),
                ],
                'notifications_count' => 0,
                'sidebar_badges' => [],
                'popups' => [],
                'cookie_consent' => ['enabled' => false, 'position' => 'bottom', 'type' => 'opt-in', 'privacy_url' => '/politique-de-confidentialite'],
            ];
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
                'dashboardTheme' => fn () => $this->safeQuery(
                    fn () => (string) (Setting::get('dashboard.theme') ?? 'indigo'),
                    'indigo',
                ),
                'adminPrefix' => config('cms.admin.resolved_prefix', config('cms.admin.prefix', 'admin')),
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
        $badges = [
            'unread_comments' => $this->safeQuery(
                fn () => Comment::where('status', 'pending')->count(),
                0,
            ),
            'new_forms' => $this->safePluginCount(
                \FormBuilder\Models\FormSubmission::class,
                fn ($class) => $class::where('status', 'new')->count(),
            ),
            'new_contacts' => $this->safePluginCount(
                \ContactForm\Models\FormSubmission::class,
                fn ($class) => $class::whereNull('read_at')->count(),
            ),
            'pending_orders' => $this->safePluginCount(
                \Ecommerce\Models\Order::class,
                fn ($class) => $class::where('status', 'pending')->count(),
            ),
            'pending_verifications' => $this->safePluginCount(
                \MemberSpace\Models\MemberVerification::class,
                fn ($class) => $class::where('status', 'pending')->count(),
            ),
        ];

        return $badges;
    }

    /**
     * Safely count records from a plugin model class that may not exist.
     */
    private function safePluginCount(string $class, callable $counter): int
    {
        if (!class_exists($class)) {
            return 0;
        }

        return $this->safeQuery(fn () => $counter($class), 0);
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
