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

        $setting = Setting::updateOrCreate(
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

            Setting::updateOrCreate(
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
            return Setting::all();
        });
    }
}
