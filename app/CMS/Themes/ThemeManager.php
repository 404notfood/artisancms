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

        // Colors
        foreach ($customization['colors'] ?? [] as $key => $definition) {
            $value = $overrides['colors'][$key] ?? $definition['default'] ?? null;
            if ($value !== null) {
                $variables["--color-{$key}"] = $value;
            }
        }

        // Fonts
        foreach ($customization['fonts'] ?? [] as $key => $definition) {
            $value = $overrides['fonts'][$key] ?? $definition['default'] ?? null;
            if ($value !== null) {
                $variables["--font-{$key}"] = $value;
            }
        }

        // Layout
        foreach ($customization['layout'] ?? [] as $key => $definition) {
            $cssKey = str_replace('_', '-', $key);
            $value = $overrides['layout'][$key] ?? $definition['default'] ?? null;
            if ($value !== null) {
                $variables["--{$cssKey}"] = $value;
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
