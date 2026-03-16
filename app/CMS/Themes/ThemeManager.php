<?php

declare(strict_types=1);

namespace App\CMS\Themes;

use App\CMS\Facades\CMS;
use App\Models\CmsTheme;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;

class ThemeManager
{
    /**
     * In-memory cache of loaded theme manifests.
     *
     * @var array<string, array<string, mixed>>
     */
    private array $manifests = [];

    /**
     * Scan the content/themes/ directory for artisan-theme.json manifests
     * and register any new themes found.
     */
    public function loadThemes(): void
    {
        $themesPath = config('cms.paths.themes');

        if (!File::isDirectory($themesPath)) {
            return;
        }

        $directories = File::directories($themesPath);

        foreach ($directories as $directory) {
            $manifestPath = $directory . '/artisan-theme.json';

            if (!File::exists($manifestPath)) {
                continue;
            }

            try {
                $manifest = json_decode(File::get($manifestPath), true, 512, JSON_THROW_ON_ERROR);
                $slug = basename($directory);
                $this->manifests[$slug] = $manifest;

                // Register in DB if not already present
                CmsTheme::firstOrCreate(
                    ['slug' => $slug],
                    [
                        'name' => $manifest['name'] ?? $slug,
                        'version' => $manifest['version'] ?? '1.0.0',
                        'description' => $manifest['description'] ?? '',
                        'author' => is_array($manifest['author'] ?? '') ? ($manifest['author']['name'] ?? '') : ($manifest['author'] ?? ''),
                        'active' => false,
                        'settings' => $manifest['settings'] ?? [],
                        'customizations' => $manifest['customizations'] ?? [],
                    ],
                );
            } catch (\JsonException $e) {
                Log::error("Failed to parse theme manifest: {$manifestPath}", [
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }

    /**
     * Activate a theme by slug. Deactivates the current active theme first.
     */
    public function activate(string $slug): bool
    {
        $theme = CmsTheme::where('slug', $slug)->first();

        if ($theme === null) {
            return false;
        }

        // Deactivate current active theme
        $currentActive = $this->getActive();
        if ($currentActive !== null) {
            CMS::fire('theme.deactivating', $currentActive);
            $currentActive->update(['active' => false]);
            CMS::fire('theme.deactivated', $currentActive);
        }

        // Activate the new theme
        $theme->update(['active' => true]);

        CMS::fire('theme.activated', $theme);

        return true;
    }

    /**
     * Get the currently active theme.
     */
    public function getActive(): ?CmsTheme
    {
        return CmsTheme::where('active', true)->first();
    }

    /**
     * Discover all themes from the filesystem (returns manifests keyed by slug).
     *
     * @return array<string, array<string, mixed>>
     */
    public function discover(): array
    {
        if (!empty($this->manifests)) {
            return $this->manifests;
        }

        $themesPath = config('cms.paths.themes');

        if (!File::isDirectory($themesPath)) {
            return [];
        }

        foreach (File::directories($themesPath) as $directory) {
            $manifestPath = $directory . '/artisan-theme.json';
            if (File::exists($manifestPath)) {
                try {
                    $manifest = json_decode(File::get($manifestPath), true, 512, JSON_THROW_ON_ERROR);
                    $slug = basename($directory);
                    $manifest['path'] = $directory;
                    $this->manifests[$slug] = $manifest;
                } catch (\JsonException $e) {
                    Log::error("Failed to parse theme manifest: {$manifestPath}", ['error' => $e->getMessage()]);
                }
            }
        }

        return $this->manifests;
    }

    /**
     * Get all themes from the database.
     *
     * @return Collection<int, CmsTheme>
     */
    public function getAll(): Collection
    {
        return CmsTheme::orderBy('name')->get();
    }

    /**
     * CSS variable prefix per section.
     */
    private const SECTION_PREFIXES = [
        'colors' => '--color-',
        'fonts' => '--font-',
        'layout' => '--',
        'header' => '--header-',
        'footer' => '--footer-',
        'ecommerce' => '--ecommerce-',
        'global_styles' => '--global-',
    ];

    /**
     * Field types that should NOT produce CSS variables.
     */
    private const NON_CSS_TYPES = ['boolean', 'image', 'text'];

    /**
     * Semantic mappings for values that need CSS transformation.
     */
    private const SEMANTIC_MAPPINGS = [
        'spacing_scale' => [
            '0.75' => '0.75',
            '0.875' => '0.875',
            '1' => '1',
            '1.125' => '1.125',
            '1.25' => '1.25',
        ],
        'shadow_intensity' => [
            'none' => 'none',
            'light' => '0 1px 3px 0 rgb(0 0 0 / 0.05)',
            'medium' => '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            'strong' => '0 10px 15px -3px rgb(0 0 0 / 0.15)',
        ],
        'button_style' => [
            'square' => '0',
            'rounded' => '0.375rem',
            'pill' => '9999px',
        ],
        'letter_spacing' => [
            '-0.025em' => '-0.025em',
            '0' => '0',
            '0.025em' => '0.025em',
            '0.05em' => '0.05em',
            '0.1em' => '0.1em',
        ],
    ];

    /**
     * Generate CSS custom properties from the active theme's customizations.
     * Merges manifest defaults with DB-stored customization overrides.
     */
    public function getCssVariables(?string $slug = null): string
    {
        $theme = $slug
            ? CmsTheme::where('slug', $slug)->first()
            : $this->getActive();

        if ($theme === null) {
            return '';
        }

        $config = $this->getThemeConfig($theme->slug);
        $customization = $config['customization'] ?? [];
        $overrides = is_array($theme->customizations) ? $theme->customizations : [];

        $variables = [];

        foreach ($customization as $section => $fields) {
            if (!is_array($fields)) {
                continue;
            }

            $prefix = self::SECTION_PREFIXES[$section] ?? "--{$section}-";

            foreach ($fields as $key => $definition) {
                if (!is_array($definition)) {
                    continue;
                }

                $fieldType = $definition['type'] ?? 'text';
                if (in_array($fieldType, self::NON_CSS_TYPES, true)) {
                    continue;
                }

                $dotKey = "{$section}.{$key}";
                $value = $overrides[$dotKey]
                    ?? $overrides[$section][$key]
                    ?? $definition['default']
                    ?? null;

                if ($value === null || $value === '') {
                    continue;
                }

                // Apply semantic mappings
                if (isset(self::SEMANTIC_MAPPINGS[$key][$value])) {
                    $value = self::SEMANTIC_MAPPINGS[$key][$value];
                }

                $cssKey = $prefix . str_replace('_', '-', $key);
                $variables[$cssKey] = (string) $value;
            }
        }

        if (empty($variables)) {
            return '';
        }

        $lines = array_map(
            fn (string $prop, string $val) => "    {$prop}: {$val};",
            array_keys($variables),
            array_values($variables),
        );

        return ":root {\n" . implode("\n", $lines) . "\n}";
    }

    /**
     * Get all customization values (including non-CSS like booleans, text, images).
     * Used to pass raw config to the frontend.
     *
     * @return array<string, mixed>
     */
    public function getAllCustomizations(?string $slug = null): array
    {
        $theme = $slug
            ? CmsTheme::where('slug', $slug)->first()
            : $this->getActive();

        if ($theme === null) {
            return [];
        }

        $config = $this->getThemeConfig($theme->slug);
        $customization = $config['customization'] ?? [];
        $overrides = is_array($theme->customizations) ? $theme->customizations : [];

        $result = [];

        foreach ($customization as $section => $fields) {
            if (!is_array($fields)) {
                continue;
            }
            foreach ($fields as $key => $definition) {
                if (!is_array($definition)) {
                    continue;
                }
                $dotKey = "{$section}.{$key}";
                $result[$dotKey] = $overrides[$dotKey]
                    ?? $overrides[$section][$key]
                    ?? $definition['default']
                    ?? '';
            }
        }

        return $result;
    }

    /**
     * Get the configuration (manifest) for a theme by slug.
     *
     * @return array<string, mixed>
     */
    public function getThemeConfig(string $slug): array
    {
        // Return from memory if already loaded
        if (isset($this->manifests[$slug])) {
            return $this->manifests[$slug];
        }

        $themesPath = config('cms.paths.themes');
        $manifestPath = $themesPath . '/' . $slug . '/artisan-theme.json';

        if (!File::exists($manifestPath)) {
            return [];
        }

        try {
            $manifest = json_decode(File::get($manifestPath), true, 512, JSON_THROW_ON_ERROR);
            $this->manifests[$slug] = $manifest;

            return $manifest;
        } catch (\JsonException $e) {
            Log::error("Failed to parse theme manifest: {$manifestPath}", [
                'error' => $e->getMessage(),
            ]);

            return [];
        }
    }
}
