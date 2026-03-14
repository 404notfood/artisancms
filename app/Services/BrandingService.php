<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Cache;

class BrandingService
{
    private const CACHE_KEY = 'cms.branding';

    private const DEFAULTS = [
        'brand_name' => 'ArtisanCMS',
        'brand_logo' => null,
        'brand_logo_dark' => null,
        'brand_favicon' => null,
        'brand_color_primary' => '#3b82f6',
        'brand_color_accent' => '#8b5cf6',
        'brand_login_bg' => null,
        'brand_login_message' => null,
        'brand_show_credit' => true,
        'brand_custom_css' => null,
        'brand_footer_text' => null,
    ];

    public function __construct(
        private readonly SettingService $settings,
    ) {}

    /**
     * Get all branding values (cached).
     *
     * @return array<string, mixed>
     */
    public function all(): array
    {
        return Cache::remember(self::CACHE_KEY, 3600, function (): array {
            $branding = [];

            foreach (self::DEFAULTS as $key => $default) {
                $value = $this->settings->get("branding.{$key}", $default);

                if ($key === 'brand_show_credit') {
                    $value = filter_var($value, FILTER_VALIDATE_BOOLEAN);
                }

                $branding[$key] = $value;
            }

            return $branding;
        });
    }

    /**
     * Get a single branding value.
     */
    public function get(string $key, mixed $default = null): mixed
    {
        $all = $this->all();

        return $all[$key] ?? $default ?? (self::DEFAULTS[$key] ?? null);
    }

    /**
     * Update branding settings.
     *
     * @param array<string, mixed> $data
     */
    public function update(array $data): void
    {
        foreach ($data as $key => $value) {
            if (array_key_exists($key, self::DEFAULTS)) {
                $type = is_bool($value) ? 'boolean' : 'string';
                $this->settings->set("branding.{$key}", $value, $type);
            }
        }

        $this->clearCache();
    }

    /**
     * Generate CSS variables string from branding settings.
     */
    public function getCssVariables(): string
    {
        $branding = $this->all();

        $vars = [];
        $vars[] = "--brand-color-primary: {$branding['brand_color_primary']};";
        $vars[] = "--brand-color-accent: {$branding['brand_color_accent']};";

        $css = ":root {\n  " . implode("\n  ", $vars) . "\n}";

        if (!empty($branding['brand_custom_css'])) {
            $css .= "\n" . $branding['brand_custom_css'];
        }

        return $css;
    }

    /**
     * Export branding config as JSON.
     *
     * @return array<string, mixed>
     */
    public function export(): array
    {
        return [
            'version' => '1.0',
            'branding' => $this->all(),
            'exported_at' => now()->toIso8601String(),
        ];
    }

    /**
     * Import branding config from exported JSON.
     *
     * @param array<string, mixed> $data
     */
    public function import(array $data): void
    {
        if (!isset($data['branding']) || !is_array($data['branding'])) {
            throw new \InvalidArgumentException(__('cms.branding.invalid_import'));
        }

        $this->update($data['branding']);
    }

    /**
     * Reset branding to defaults.
     */
    public function reset(): void
    {
        $this->update(self::DEFAULTS);
    }

    public function clearCache(): void
    {
        Cache::forget(self::CACHE_KEY);
    }
}
