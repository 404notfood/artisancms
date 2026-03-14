<?php

declare(strict_types=1);

namespace App\CMS\Plugins;

use App\CMS\Facades\CMS;
use App\Models\CmsPlugin;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;

class PluginManager
{
    /**
     * In-memory cache of loaded plugin manifests.
     *
     * @var array<string, array<string, mixed>>
     */
    private array $manifests = [];

    /**
     * Scan the content/plugins/ directory for artisan-plugin.json manifests
     * and register any new plugins found.
     */
    public function loadPlugins(): void
    {
        $pluginsPath = config('cms.paths.plugins');

        if (!File::isDirectory($pluginsPath)) {
            return;
        }

        $directories = File::directories($pluginsPath);

        foreach ($directories as $directory) {
            $manifestPath = $directory . '/artisan-plugin.json';

            if (!File::exists($manifestPath)) {
                continue;
            }

            try {
                $manifest = json_decode(File::get($manifestPath), true, 512, JSON_THROW_ON_ERROR);
                $slug = basename($directory);
                $this->manifests[$slug] = $manifest;

                // Register in DB if not already present
                CmsPlugin::firstOrCreate(
                    ['slug' => $slug],
                    [
                        'name' => $manifest['name'] ?? $slug,
                        'version' => $manifest['version'] ?? '1.0.0',
                        'description' => $manifest['description'] ?? '',
                        'author' => is_array($manifest['author'] ?? '') ? ($manifest['author']['name'] ?? '') : ($manifest['author'] ?? ''),
                        'enabled' => false,
                        'settings' => $manifest['settings'] ?? [],
                        'order' => $manifest['order'] ?? 0,
                        'installed_at' => now(),
                    ],
                );
            } catch (\JsonException $e) {
                Log::error("Failed to parse plugin manifest: {$manifestPath}", [
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }

    /**
     * Enable a plugin by slug.
     */
    public function enable(string $slug): bool
    {
        $plugin = CmsPlugin::where('slug', $slug)->first();

        if ($plugin === null) {
            return false;
        }

        $plugin->update([
            'enabled' => true,
            'activated_at' => now(),
        ]);

        $this->bootPlugin($slug);

        CMS::fire('plugin.enabled', $plugin);

        return true;
    }

    /**
     * Disable a plugin by slug.
     */
    public function disable(string $slug): bool
    {
        $plugin = CmsPlugin::where('slug', $slug)->first();

        if ($plugin === null) {
            return false;
        }

        CMS::fire('plugin.disabling', $plugin);

        $plugin->update([
            'enabled' => false,
            'activated_at' => null,
        ]);

        CMS::fire('plugin.disabled', $plugin);

        return true;
    }

    /**
     * Install a plugin by slug (register it in the database).
     */
    public function install(string $slug): bool
    {
        $pluginsPath = config('cms.paths.plugins');
        $manifestPath = $pluginsPath . '/' . $slug . '/artisan-plugin.json';

        if (!File::exists($manifestPath)) {
            return false;
        }

        try {
            $manifest = json_decode(File::get($manifestPath), true, 512, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            return false;
        }

        $plugin = CmsPlugin::firstOrCreate(
            ['slug' => $slug],
            [
                'name' => $manifest['name'] ?? $slug,
                'version' => $manifest['version'] ?? '1.0.0',
                'description' => $manifest['description'] ?? '',
                'author' => is_array($manifest['author'] ?? '') ? ($manifest['author']['name'] ?? '') : ($manifest['author'] ?? ''),
                'enabled' => false,
                'settings' => $manifest['settings'] ?? [],
                'order' => $manifest['order'] ?? 0,
                'installed_at' => now(),
            ],
        );

        // Update metadata from manifest (but preserve enabled state)
        if (!$plugin->wasRecentlyCreated) {
            $plugin->update([
                'name' => $manifest['name'] ?? $slug,
                'version' => $manifest['version'] ?? '1.0.0',
                'description' => $manifest['description'] ?? '',
                'author' => is_array($manifest['author'] ?? '') ? ($manifest['author']['name'] ?? '') : ($manifest['author'] ?? ''),
                'settings' => $manifest['settings'] ?? [],
                'order' => $manifest['order'] ?? 0,
            ]);
        }

        $this->manifests[$slug] = $manifest;

        CMS::fire('plugin.installed', $plugin);

        return true;
    }

    /**
     * Uninstall a plugin by slug (remove from database).
     */
    public function uninstall(string $slug): bool
    {
        $plugin = CmsPlugin::where('slug', $slug)->first();

        if ($plugin === null) {
            return false;
        }

        if ($plugin->enabled) {
            $this->disable($slug);
        }

        CMS::fire('plugin.uninstalling', $plugin);

        $plugin->delete();

        unset($this->manifests[$slug]);

        CMS::fire('plugin.uninstalled', $slug);

        return true;
    }

    /**
     * Discover all plugins from the filesystem (returns manifests keyed by slug).
     *
     * @return array<string, array<string, mixed>>
     */
    public function discover(): array
    {
        if (!empty($this->manifests)) {
            return $this->manifests;
        }

        $pluginsPath = config('cms.paths.plugins');

        if (!File::isDirectory($pluginsPath)) {
            return [];
        }

        foreach (File::directories($pluginsPath) as $directory) {
            $manifestPath = $directory . '/artisan-plugin.json';
            if (File::exists($manifestPath)) {
                try {
                    $manifest = json_decode(File::get($manifestPath), true, 512, JSON_THROW_ON_ERROR);
                    $slug = basename($directory);
                    $manifest['path'] = $directory;
                    $this->manifests[$slug] = $manifest;
                } catch (\JsonException $e) {
                    Log::error("Failed to parse plugin manifest: {$manifestPath}", ['error' => $e->getMessage()]);
                }
            }
        }

        return $this->manifests;
    }

    /**
     * Get all plugins from the database.
     *
     * @return Collection<int, CmsPlugin>
     */
    public function getAll(): Collection
    {
        return CmsPlugin::orderBy('order')->orderBy('name')->get();
    }

    /**
     * Get all enabled plugins.
     *
     * @return Collection<int, CmsPlugin>
     */
    public function getEnabled(): Collection
    {
        return CmsPlugin::where('enabled', true)->orderBy('order')->get();
    }

    /**
     * Check if a plugin is enabled.
     */
    public function isEnabled(string $slug): bool
    {
        return CmsPlugin::where('slug', $slug)->where('enabled', true)->exists();
    }

    /**
     * Boot a plugin's service providers if they exist.
     */
    public function bootPlugin(string $slug): void
    {
        $manifest = $this->manifests[$slug] ?? null;
        if (!$manifest) {
            $this->discover();
            $manifest = $this->manifests[$slug] ?? null;
        }

        if (!$manifest) {
            return;
        }

        // Support both 'providers' (array) and 'provider' (string) keys
        $providers = $manifest['providers'] ?? [];
        if (empty($providers) && isset($manifest['provider'])) {
            $providers = [$manifest['provider']];
        }

        foreach ($providers as $providerClass) {
            if (class_exists($providerClass)) {
                app()->register($providerClass);
            }
        }
    }
}
