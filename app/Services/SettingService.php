<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class SettingService
{
    /**
     * The cache key used for storing all settings.
     */
    private const CACHE_KEY = 'cms.settings';

    /**
     * @var array<int, array{group: string, key: string, value: mixed, type: string, is_public: bool}>
     */
    private const DEFAULT_SETTINGS = [
        ['group' => 'general', 'key' => 'site_name', 'value' => 'ArtisanCMS', 'type' => 'string', 'is_public' => true],
        ['group' => 'general', 'key' => 'site_description', 'value' => '', 'type' => 'string', 'is_public' => true],
        ['group' => 'general', 'key' => 'site_url', 'value' => '', 'type' => 'string', 'is_public' => true],
        ['group' => 'general', 'key' => 'locale', 'value' => 'fr', 'type' => 'string', 'is_public' => false],
        ['group' => 'general', 'key' => 'timezone', 'value' => 'Europe/Paris', 'type' => 'string', 'is_public' => false],
        ['group' => 'general', 'key' => 'site_logo', 'value' => null, 'type' => 'image', 'is_public' => true],
        ['group' => 'general', 'key' => 'site_favicon', 'value' => null, 'type' => 'image', 'is_public' => true],
        ['group' => 'seo', 'key' => 'meta_title_suffix', 'value' => ' | ArtisanCMS', 'type' => 'string', 'is_public' => false],
        ['group' => 'seo', 'key' => 'meta_description', 'value' => '', 'type' => 'textarea', 'is_public' => false],
        ['group' => 'seo', 'key' => 'robots_index', 'value' => true, 'type' => 'boolean', 'is_public' => false],
        ['group' => 'seo', 'key' => 'sitemap_enabled', 'value' => true, 'type' => 'boolean', 'is_public' => false],
        ['group' => 'seo', 'key' => 'canonical_enabled', 'value' => true, 'type' => 'boolean', 'is_public' => false],
        ['group' => 'seo', 'key' => 'google_site_verification', 'value' => '', 'type' => 'string', 'is_public' => false],
        ['group' => 'seo', 'key' => 'bing_site_verification', 'value' => '', 'type' => 'string', 'is_public' => false],
        ['group' => 'mail', 'key' => 'from_name', 'value' => 'ArtisanCMS', 'type' => 'string', 'is_public' => false],
        ['group' => 'mail', 'key' => 'from_email', 'value' => 'noreply@example.com', 'type' => 'email', 'is_public' => false],
        ['group' => 'mail', 'key' => 'reply_to_email', 'value' => '', 'type' => 'email', 'is_public' => false],
        ['group' => 'mail', 'key' => 'mailer', 'value' => 'smtp', 'type' => 'string', 'is_public' => false],
        ['group' => 'mail', 'key' => 'host', 'value' => '127.0.0.1', 'type' => 'string', 'is_public' => false],
        ['group' => 'mail', 'key' => 'port', 'value' => 1025, 'type' => 'number', 'is_public' => false],
        ['group' => 'mail', 'key' => 'username', 'value' => '', 'type' => 'string', 'is_public' => false],
        ['group' => 'mail', 'key' => 'password', 'value' => '', 'type' => 'password', 'is_public' => false],
        ['group' => 'mail', 'key' => 'encryption', 'value' => '', 'type' => 'string', 'is_public' => false],
        ['group' => 'content', 'key' => 'posts_per_page', 'value' => 10, 'type' => 'number', 'is_public' => false],
        ['group' => 'content', 'key' => 'allow_comments', 'value' => true, 'type' => 'boolean', 'is_public' => false],
        ['group' => 'content', 'key' => 'homepage_type', 'value' => 'page', 'type' => 'string', 'is_public' => false],
        ['group' => 'content', 'key' => 'homepage_id', 'value' => null, 'type' => 'number', 'is_public' => false],
        ['group' => 'content', 'key' => 'excerpt_length', 'value' => 160, 'type' => 'number', 'is_public' => false],
        ['group' => 'media', 'key' => 'max_upload_size', 'value' => 10240, 'type' => 'number', 'is_public' => false],
        ['group' => 'media', 'key' => 'allowed_types', 'value' => ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'application/pdf'], 'type' => 'json', 'is_public' => false],
        ['group' => 'media', 'key' => 'image_sizes', 'value' => ['thumbnail' => [150, 150], 'medium' => [300, 300], 'large' => [1024, 1024]], 'type' => 'json', 'is_public' => false],
        ['group' => 'media', 'key' => 'optimize_uploads', 'value' => true, 'type' => 'boolean', 'is_public' => false],
        ['group' => 'maintenance', 'key' => 'enabled', 'value' => false, 'type' => 'boolean', 'is_public' => true],
        ['group' => 'maintenance', 'key' => 'message', 'value' => 'Site en maintenance. Nous revenons bientot.', 'type' => 'textarea', 'is_public' => true],
        ['group' => 'maintenance', 'key' => 'allowed_ips', 'value' => [], 'type' => 'json', 'is_public' => false],
        ['group' => 'security', 'key' => 'login_path', 'value' => 'login', 'type' => 'string', 'is_public' => false],
        ['group' => 'security', 'key' => 'register_path', 'value' => 'register', 'type' => 'string', 'is_public' => false],
        ['group' => 'security', 'key' => 'admin_prefix', 'value' => 'admin', 'type' => 'string', 'is_public' => false],
        ['group' => 'security', 'key' => 'force_https', 'value' => false, 'type' => 'boolean', 'is_public' => false],
        ['group' => 'security', 'key' => 'session_lifetime', 'value' => 120, 'type' => 'number', 'is_public' => false],
        ['group' => 'analytics', 'key' => 'enabled', 'value' => true, 'type' => 'boolean', 'is_public' => false],
        ['group' => 'analytics', 'key' => 'respect_dnt', 'value' => true, 'type' => 'boolean', 'is_public' => false],
        ['group' => 'analytics', 'key' => 'ga4_measurement_id', 'value' => '', 'type' => 'string', 'is_public' => false],
    ];

    /**
     * Get a setting value by key.
     *
     * Supports 'group.key' format (e.g., 'site.name').
     * If the key does not contain a dot, the group defaults to 'general'.
     */
    public function get(string $key, mixed $default = null): mixed
    {
        $settings = $this->getAllCached();

        if (str_contains($key, '.')) {
            [$group, $settingKey] = explode('.', $key, 2);
        } else {
            $group = 'general';
            $settingKey = $key;
        }

        $setting = $settings
            ->where('group', $group)
            ->where('key', $settingKey)
            ->first();

        return $setting?->value ?? $default;
    }

    /**
     * Set a setting value by key.
     *
     * Supports 'group.key' format (e.g., 'site.name').
     * If the key does not contain a dot, the group defaults to 'general'.
     */
    public function set(string $key, mixed $value, ?string $type = null): Setting
    {
        $group = 'general';
        $settingKey = $key;

        if (str_contains($key, '.')) {
            [$group, $settingKey] = explode('.', $key, 2);
        }

        // Preserve existing type if not explicitly provided
        $updateData = ['value' => $value];
        if ($type !== null) {
            $updateData['type'] = $type;
        }

        $setting = Setting::withoutGlobalScope('site')->updateOrCreate(
            ['group' => $group, 'key' => $settingKey],
            $updateData,
        );

        $this->clearCache();

        return $setting;
    }

    /**
     * Get all settings for a given group.
     *
     * @return Collection<int, Setting>
     */
    public function getGroup(string $group): Collection
    {
        $settings = $this->getAllCached();

        return $settings->where('group', $group)->values();
    }

    /**
     * Ensure the core settings UI always has editable fields.
     */
    public function ensureDefaultSettings(): void
    {
        $changed = false;

        foreach (self::DEFAULT_SETTINGS as $setting) {
            $existing = Setting::withoutGlobalScope('site')->updateOrCreate(
                ['group' => $setting['group'], 'key' => $setting['key']],
                [
                    'type' => $setting['type'],
                    'is_public' => $setting['is_public'],
                ],
            );

            if ($existing->wasRecentlyCreated) {
                $existing->update(['value' => $setting['value']]);
                $changed = true;
            } elseif ($existing->wasChanged()) {
                $changed = true;
            }
        }

        if ($changed) {
            $this->clearCache();
        }
    }

    /**
     * Set many settings at once. Clears cache only once after all writes.
     *
     * @param array<string, mixed> $settings Associative array of key => value pairs
     */
    public function setMany(array $settings): void
    {
        foreach ($settings as $key => $value) {
            $group = 'general';
            $settingKey = $key;

            if (str_contains($key, '.')) {
                [$group, $settingKey] = explode('.', $key, 2);
            }

            $updateData = ['value' => $value];

            Setting::withoutGlobalScope('site')->updateOrCreate(
                ['group' => $group, 'key' => $settingKey],
                $updateData,
            );
        }

        $this->clearCache();
    }

    /**
     * Clear the settings cache.
     */
    public function clearCache(): void
    {
        Cache::forget(self::CACHE_KEY);
    }

    /**
     * Get all settings from cache, or load them from the database.
     *
     * @return Collection<int, Setting>
     */
    private function getAllCached(): Collection
    {
        return Cache::rememberForever(self::CACHE_KEY, function (): Collection {
            return Setting::withoutGlobalScope('site')->get();
        });
    }
}
