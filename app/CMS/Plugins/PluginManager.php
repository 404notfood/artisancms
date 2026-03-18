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
    /** @var array<string, array<string, mixed>> */
    private array $manifests = [];

    /**
     * Scan the plugins directory and register any new plugins in the database.
     * Existing plugins get their metadata refreshed from the manifest.
     */
    public function loadPlugins(): void
    {
        $pluginsPath = config('cms.paths.plugins');

        if (!File::isDirectory($pluginsPath)) {
            return;
        }

        foreach (File::directories($pluginsPath) as $directory) {
            $manifestPath = $directory . '/artisan-plugin.json';

            if (!File::exists($manifestPath)) {
                continue;
            }

            try {
                $manifest = json_decode(File::get($manifestPath), true, 512, JSON_THROW_ON_ERROR);
                $slug = basename($directory);
                $this->manifests[$slug] = $manifest;

                $attributes = $this->buildAttributesFromManifest($manifest, $slug);

                $plugin = CmsPlugin::firstOrCreate(
                    ['slug' => $slug],
                    array_merge($attributes, [
                        'enabled' => false,
                        'settings' => $this->extractDefaultSettings($manifest['settings'] ?? []),
                        'installed_at' => now(),
                    ]),
                );

                // Refresh metadata for existing plugins (preserve enabled state and user settings)
                if (!$plugin->wasRecentlyCreated) {
                    $plugin->update($attributes);
                }
            } catch (\JsonException $e) {
                Log::error("Invalid plugin manifest at {$manifestPath}: {$e->getMessage()}");
            }
        }
    }

    public function enable(string $slug): bool
    {
        $plugin = CmsPlugin::where('slug', $slug)->first();
        if (!$plugin) {
            return false;
        }

        $plugin->update([
            'enabled' => true,
            'activated_at' => now(),
        ]);

        try {
            $this->bootPlugin($slug);
        } catch (\Throwable $e) {
            // Rollback: don't leave a broken plugin enabled
            $plugin->update(['enabled' => false, 'activated_at' => null]);
            Log::error("Plugin '{$slug}' failed to boot during activation: {$e->getMessage()}");
            return false;
        }

        CMS::fire('plugin.enabled', $plugin);

        return true;
    }

    public function disable(string $slug): bool
    {
        $plugin = CmsPlugin::where('slug', $slug)->first();
        if (!$plugin) {
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
     * Install a plugin from the filesystem into the database.
     * If already installed, refreshes metadata but preserves user settings and enabled state.
     */
    public function install(string $slug): bool
    {
        $manifest = $this->readManifest($slug);
        if (!$manifest) {
            return false;
        }

        $attributes = $this->buildAttributesFromManifest($manifest, $slug);

        $plugin = CmsPlugin::firstOrCreate(
            ['slug' => $slug],
            array_merge($attributes, [
                'enabled' => false,
                'settings' => $this->extractDefaultSettings($manifest['settings'] ?? []),
                'installed_at' => now(),
            ]),
        );

        if (!$plugin->wasRecentlyCreated) {
            // Merge new default settings with existing user settings (user values take precedence)
            $defaults = $this->extractDefaultSettings($manifest['settings'] ?? []);
            $merged = array_merge($defaults, $plugin->settings ?? []);

            $plugin->update(array_merge($attributes, ['settings' => $merged]));
        }

        $this->manifests[$slug] = $manifest;

        CMS::fire('plugin.installed', $plugin);

        return true;
    }

    public function uninstall(string $slug): bool
    {
        $plugin = CmsPlugin::where('slug', $slug)->first();
        if (!$plugin) {
            return false;
        }

        if ($plugin->enabled) {
            $this->disable($slug);
        }

        CMS::fire('plugin.uninstalling', $plugin);

        // Capture data before deletion for the hook
        $pluginData = $plugin->toArray();
        $plugin->delete();
        unset($this->manifests[$slug]);

        CMS::fire('plugin.uninstalled', $pluginData);

        return true;
    }

    /**
     * Discover all plugins from the filesystem.
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

            if (!File::exists($manifestPath)) {
                continue;
            }

            try {
                $manifest = json_decode(File::get($manifestPath), true, 512, JSON_THROW_ON_ERROR);
                $slug = basename($directory);
                $manifest['path'] = $directory;
                $this->manifests[$slug] = $manifest;
            } catch (\JsonException $e) {
                Log::error("Invalid plugin manifest at {$manifestPath}: {$e->getMessage()}");
            }
        }

        return $this->manifests;
    }

    /** @return Collection<int, CmsPlugin> */
    public function getAll(): Collection
    {
        return CmsPlugin::orderBy('order')->orderBy('name')->get();
    }

    /** @return Collection<int, CmsPlugin> */
    public function getEnabled(): Collection
    {
        return CmsPlugin::where('enabled', true)->orderBy('order')->get();
    }

    public function isEnabled(string $slug): bool
    {
        return CmsPlugin::where('slug', $slug)->where('enabled', true)->exists();
    }

    /**
     * Boot a plugin's service providers.
     *
     * @throws \Throwable If a provider fails to register
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

        $providers = $this->resolveProviders($manifest);

        foreach ($providers as $providerClass) {
            if (!class_exists($providerClass)) {
                Log::warning("Plugin '{$slug}' references missing provider: {$providerClass}");
                continue;
            }
            app()->register($providerClass);
        }
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    /**
     * Read and parse a plugin's manifest file. Returns null on failure.
     *
     * @return array<string, mixed>|null
     */
    private function readManifest(string $slug): ?array
    {
        $pluginsPath = config('cms.paths.plugins');
        $manifestPath = $pluginsPath . '/' . $slug . '/artisan-plugin.json';

        if (!File::exists($manifestPath)) {
            return null;
        }

        try {
            return json_decode(File::get($manifestPath), true, 512, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            Log::error("Invalid plugin manifest at {$manifestPath}");
            return null;
        }
    }

    /**
     * Build the common DB attributes array from a manifest.
     *
     * @param array<string, mixed> $manifest
     * @return array<string, mixed>
     */
    private function buildAttributesFromManifest(array $manifest, string $slug): array
    {
        return [
            'name' => $manifest['name'] ?? $slug,
            'version' => $manifest['version'] ?? '1.0.0',
            'description' => $manifest['description'] ?? '',
            'author' => $this->extractAuthor($manifest),
            'order' => $manifest['order'] ?? 0,
        ];
    }

    /**
     * Extract the author name from a manifest.
     * Supports both string format and {"name": "...", "url": "..."} object format.
     */
    private function extractAuthor(array $manifest): string
    {
        $author = $manifest['author'] ?? '';

        if (is_array($author)) {
            return $author['name'] ?? '';
        }

        return (string) $author;
    }

    /**
     * Extract default values from a settings schema.
     *
     * Schema entries like {"api_key": {"type": "password", "default": ""}}
     * get flattened to {"api_key": ""}.
     *
     * @param array<string, mixed> $settings
     * @return array<string, mixed>
     */
    private function extractDefaultSettings(array $settings): array
    {
        $defaults = [];

        foreach ($settings as $key => $value) {
            $defaults[$key] = is_array($value) && array_key_exists('default', $value)
                ? $value['default']
                : $value;
        }

        return $defaults;
    }

    /**
     * Resolve the list of service provider classes from a manifest.
     * Supports both 'providers' (array) and 'provider' (string) keys.
     *
     * @return list<string>
     */
    private function resolveProviders(array $manifest): array
    {
        $providers = $manifest['providers'] ?? [];

        if (empty($providers) && isset($manifest['provider'])) {
            return [$manifest['provider']];
        }

        return $providers;
    }
}
