<?php

declare(strict_types=1);

namespace MemberSpace\Services;

use App\Models\CmsPlugin;
use Illuminate\Support\Facades\Cache;

class MemberSettingsService
{
    private const CACHE_KEY = 'member_space_settings';
    private const CACHE_TTL = 3600;

    private array $defaults = [
        'modules' => [
            'member_directory' => true,
            'content_restriction' => true,
            'custom_fields' => true,
            'social_login' => false,
            'two_factor' => false,
            'membership_plans' => false,
            'user_verification' => false,
        ],
        'profile' => [
            'default_visibility' => 'public',
            'require_avatar' => false,
            'max_bio_length' => 500,
            'enable_cover_photo' => true,
        ],
        'directory' => [
            'per_page' => 12,
            'default_sort' => 'newest',
            'show_search' => true,
            'layout' => 'grid',
        ],
        'registration' => [
            'enable_custom_registration' => true,
            'require_email_verification' => true,
            'auto_create_profile' => true,
            'default_role' => 'subscriber',
        ],
        'social_login' => [
            'google_client_id' => '',
            'google_client_secret' => '',
            'facebook_client_id' => '',
            'facebook_client_secret' => '',
            'github_client_id' => '',
            'github_client_secret' => '',
        ],
        'stripe' => [
            'publishable_key' => '',
            'secret_key' => '',
            'webhook_secret' => '',
        ],
    ];

    public function all(): array
    {
        return Cache::remember(self::CACHE_KEY, self::CACHE_TTL, function () {
            $plugin = CmsPlugin::where('slug', 'member-space')->first();

            if (!$plugin || empty($plugin->settings)) {
                return $this->defaults;
            }

            $resolved = [];
            foreach ($plugin->settings as $key => $value) {
                $resolved[$key] = is_array($value) && isset($value['default']) ? $value['default'] : $value;
            }

            return array_merge($this->defaults, $resolved);
        });
    }

    public function get(string $group, ?string $key = null, mixed $default = null): mixed
    {
        $settings = $this->all();

        if ($key === null) {
            return $settings[$group] ?? $default;
        }

        return $settings[$group][$key] ?? $default;
    }

    public function isModuleEnabled(string $module): bool
    {
        return (bool) $this->get('modules', $module, false);
    }

    public function save(array $data): void
    {
        $plugin = CmsPlugin::where('slug', 'member-space')->firstOrFail();
        $plugin->settings = array_merge($plugin->settings ?? [], $data);
        $plugin->save();

        Cache::forget(self::CACHE_KEY);
    }

    public function clearCache(): void
    {
        Cache::forget(self::CACHE_KEY);
    }
}
