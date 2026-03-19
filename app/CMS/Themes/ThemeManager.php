<?php

declare(strict_types=1);

namespace App\CMS\Themes;

use App\CMS\Facades\CMS;
use App\Models\CmsTheme;
use App\Services\TemplateService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use ZipArchive;

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
     * and register any new themes found in the database.
     */
    public function loadThemes(): void
    {
        $this->discover();

        foreach ($this->manifests as $slug => $manifest) {
            CmsTheme::firstOrCreate(
                ['slug' => $slug],
                [
                    'name' => $manifest['name'] ?? $slug,
                    'version' => $manifest['version'] ?? '1.0.0',
                    'description' => $manifest['description'] ?? '',
                    'author' => $this->extractAuthor($manifest),
                    'active' => false,
                    'settings' => $manifest['settings'] ?? [],
                    'customizations' => $manifest['customizations'] ?? [],
                ],
            );
        }
    }

    /**
     * Activate a theme by slug. Deactivates the current active theme first.
     * If the theme declares a default_template, installs it automatically.
     *
     * @param int|null $userId User performing the activation (needed for template install)
     */
    public function activate(string $slug, ?int $userId = null): bool
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

        // Auto-install the bundled template if declared
        $config = $this->getThemeConfig($slug);
        $defaultTemplate = $config['default_template'] ?? null;

        if ($defaultTemplate && $userId !== null) {
            try {
                $templateService = app(TemplateService::class);
                $templateService->install($defaultTemplate, $userId, [
                    'reset_existing'   => true,
                    'overwrite'        => true,
                    'install_menus'    => true,
                    'install_settings' => true,
                    'install_theme'    => false,
                ]);
            } catch (\Throwable $e) {
                Log::warning("Theme {$slug}: could not auto-install template '{$defaultTemplate}'", [
                    'error' => $e->getMessage(),
                ]);
            }
        }

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
        $resolved = $this->resolveCustomization($slug);
        if ($resolved === null) {
            return '';
        }

        return app(ThemeCssGenerator::class)->generate(...$resolved);
    }

    /**
     * Get all customization values (including non-CSS like booleans, text, images).
     * Used to pass raw config to the frontend.
     *
     * @return array<string, mixed>
     */
    public function getAllCustomizations(?string $slug = null): array
    {
        $resolved = $this->resolveCustomization($slug);
        if ($resolved === null) {
            return [];
        }

        return app(ThemeCssGenerator::class)->getAllValues(...$resolved);
    }

    /**
     * Resolve the customization config and overrides for a theme.
     *
     * @return array{0: array<string, mixed>, 1: array<string, mixed>}|null
     */
    private function resolveCustomization(?string $slug): ?array
    {
        $theme = $slug
            ? CmsTheme::where('slug', $slug)->first()
            : $this->getActive();

        if ($theme === null) {
            return null;
        }

        $config = $this->getThemeConfig($theme->slug);

        return [
            $config['customization'] ?? [],
            is_array($theme->customizations) ? $theme->customizations : [],
        ];
    }

    /**
     * Install a theme from an uploaded ZIP file.
     * Returns the slug of the installed theme.
     *
     * @throws RuntimeException
     */
    public function installFromZip(UploadedFile $file): string
    {
        $themesPath = config('cms.paths.themes');
        $tmpDir = sys_get_temp_dir() . '/artisan_theme_' . uniqid('', true);

        try {
            $zip = new ZipArchive();

            if ($zip->open($file->getRealPath()) !== true) {
                throw new RuntimeException(__('cms.themes.zip_open_failed'));
            }

            File::makeDirectory($tmpDir, 0755, true);
            $zip->extractTo($tmpDir);
            $zip->close();

            // Detect root folder: either files at root or single subdirectory
            $manifestPath = $this->findManifest($tmpDir);

            if ($manifestPath === null) {
                throw new RuntimeException(__('cms.themes.manifest_missing'));
            }

            $manifest = json_decode(File::get($manifestPath), true, 512, JSON_THROW_ON_ERROR);

            foreach (['name', 'slug', 'version'] as $required) {
                if (empty($manifest[$required])) {
                    throw new RuntimeException(__('cms.themes.manifest_invalid_field', ['field' => $required]));
                }
            }

            $slug = $manifest['slug'];
            $themeSourceDir = dirname($manifestPath);
            $themeDestDir = $themesPath . '/' . $slug;

            // Copy to content/themes/{slug}/
            if (File::isDirectory($themeDestDir)) {
                File::deleteDirectory($themeDestDir);
            }
            File::copyDirectory($themeSourceDir, $themeDestDir);

            // Register or update in DB
            CmsTheme::updateOrCreate(
                ['slug' => $slug],
                [
                    'name'        => $manifest['name'],
                    'version'     => $manifest['version'],
                    'description' => $manifest['description'] ?? '',
                    'author'      => $this->extractAuthor($manifest),
                    'settings'    => $manifest['settings'] ?? [],
                ],
            );

            // Bust in-memory manifest cache
            unset($this->manifests[$slug]);

            CMS::fire('theme.installed', ['slug' => $slug, 'manifest' => $manifest]);

            return $slug;

        } catch (\JsonException $e) {
            throw new RuntimeException(__('cms.themes.manifest_parse_error') . ': ' . $e->getMessage());
        } finally {
            if (File::isDirectory($tmpDir)) {
                File::deleteDirectory($tmpDir);
            }
        }
    }

    /**
     * Uninstall a theme: remove its folder and DB record.
     *
     * @throws RuntimeException if the theme is currently active
     */
    public function uninstall(string $slug): void
    {
        $theme = CmsTheme::where('slug', $slug)->firstOrFail();

        if ($theme->active) {
            throw new RuntimeException(__('cms.themes.cannot_delete_active'));
        }

        $themeDir = config('cms.paths.themes') . '/' . $slug;

        if (File::isDirectory($themeDir)) {
            File::deleteDirectory($themeDir);
        }

        $theme->delete();

        unset($this->manifests[$slug]);

        CMS::fire('theme.uninstalled', ['slug' => $slug]);
    }

    /**
     * Locate artisan-theme.json inside an extracted ZIP directory.
     * Handles both flat (files at root) and single-subfolder structures.
     */
    private function findManifest(string $extractDir): ?string
    {
        // Direct manifest at root
        $direct = $extractDir . '/artisan-theme.json';
        if (File::exists($direct)) {
            return $direct;
        }

        // Single subdirectory
        $subdirs = File::directories($extractDir);
        if (count($subdirs) === 1) {
            $nested = $subdirs[0] . '/artisan-theme.json';
            if (File::exists($nested)) {
                return $nested;
            }
        }

        return null;
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

    /**
     * Extract the author name from a manifest.
     * Supports both string and {"name": "..."} object format.
     */
    private function extractAuthor(array $manifest): string
    {
        $author = $manifest['author'] ?? '';

        return is_array($author) ? ($author['name'] ?? '') : (string) $author;
    }
}
