<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ReleaseRegistry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;

/**
 * Registry API — serves version info to ArtisanCMS instances checking for updates.
 *
 * This controller can be deployed on api.artisancms.dev or self-hosted.
 * It reads version data from VERSION file + plugin/theme manifests.
 *
 * Endpoints:
 *   GET  /api/v1/version         → Current CMS version info
 *   POST /api/v1/check-updates   → Batch check CMS + plugins + themes
 *   GET  /api/v1/catalog         → Available plugins & themes catalog
 */
class RegistryController extends Controller
{
    public function __construct(private readonly ReleaseRegistry $registry) {}

    /**
     * GET /api/v1/version
     *
     * Returns the latest CMS version info.
     */
    public function version(): JsonResponse
    {
        $release = $this->registry->latest('cms');

        return response()->json([
            'version' => $release['version'] ?? null,
            'download_url' => $release['download_url'] ?? null,
            'checksum_sha256' => $release['checksum_sha256'] ?? null,
            'changelog' => $release['changelog'] ?? $this->getLatestChangelog(),
            'php_required' => $release['php_required'] ?? '8.3.0',
            'urgent' => $release['urgent'] ?? false,
        ]);
    }

    /**
     * POST /api/v1/check-updates
     *
     * Batch check: receives installed versions, returns available updates.
     *
     * Request body:
     * {
     *   "cms_version": "1.0.0",
     *   "php_version": "8.4.0",
     *   "plugins": { "seo": "1.0.0", "contact-form": "1.0.0" },
     *   "themes": { "default": "1.0.0" }
     * }
     */
    public function checkUpdates(Request $request): JsonResponse
    {
        $request->validate([
            'cms_version' => ['sometimes', 'string', 'regex:/^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?$/D'],
            'plugins' => ['sometimes', 'array', 'max:500'],
            'themes' => ['sometimes', 'array', 'max:500'],
            'plugins.*' => ['string', 'max:64'],
            'themes.*' => ['string', 'max:64'],
        ]);
        $currentCmsVersion = $request->input('cms_version', '0.0.0');
        $release = $this->registry->latest('cms');
        $latestCmsVersion = $release['version'] ?? $currentCmsVersion;

        // CMS update info
        $cmsUpdate = [
            'latest' => $latestCmsVersion,
            'update_available' => version_compare($latestCmsVersion, $currentCmsVersion, '>'),
            'download_url' => $release['download_url'] ?? null,
            'changelog' => $release['changelog'] ?? null,
            'checksum_sha256' => $release['checksum_sha256'] ?? null,
            'php_required' => $release['php_required'] ?? '8.3.0',
            'urgent' => $release['urgent'] ?? false,
        ];

        // Plugin updates (compare against bundled plugin manifests)
        $pluginUpdates = $this->checkExtensionUpdates(
            $request->input('plugins', []),
            base_path('content/plugins'),
            'artisan-plugin.json',
        );

        // Theme updates
        $themeUpdates = $this->checkExtensionUpdates(
            $request->input('themes', []),
            base_path('content/themes'),
            'artisan-theme.json',
        );

        return response()->json([
            'cms' => $cmsUpdate,
            'plugins' => $pluginUpdates,
            'themes' => $themeUpdates,
            'checked_at' => now()->toIso8601String(),
        ]);
    }

    /**
     * GET /api/v1/catalog
     *
     * Returns available plugins and themes for the marketplace.
     */
    public function catalog(): JsonResponse
    {
        $plugins = collect([
            ...$this->scanExtensions(base_path('content/plugins'), 'artisan-plugin.json'),
            ...$this->registry->catalog('plugin'),
        ])->keyBy('slug')->values()->all();
        $themes = collect([
            ...$this->scanExtensions(base_path('content/themes'), 'artisan-theme.json'),
            ...$this->registry->catalog('theme'),
        ])->keyBy('slug')->values()->all();

        return response()->json([
            'plugins' => $plugins,
            'themes' => $themes,
        ]);
    }

    /**
     * POST /api/internal/releases (protected by API key)
     *
     * Called by GitHub Actions when a new release is published.
     */
    public function registerRelease(Request $request): JsonResponse
    {
        $apiKey = config('cms.registry.api_key');
        if (!$apiKey || !hash_equals($apiKey, $request->bearerToken() ?? '')) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $validated = $request->validate([
            'type' => 'required|in:cms,plugin,theme',
            'slug' => ['required_if:type,plugin,theme', 'nullable', 'string', 'max:100', 'regex:/^[a-z0-9][a-z0-9-]*$/D'],
            'version' => ['required', 'string', 'max:64', 'regex:/^\d+\.\d+\.\d+$/D'],
            'tag' => 'required|string|max:100',
            'download_url' => 'required|url:https|max:2048',
            'checksum_url' => 'nullable|url:https|max:2048',
            'checksum_sha256' => ['required', 'string', 'regex:/^[a-f0-9]{64}$/iD'],
            'changelog' => 'nullable|string|max:100000',
            'php_required' => ['sometimes', 'string', 'regex:/^\d+\.\d+(?:\.\d+)?$/D'],
            'urgent' => 'sometimes|boolean',
            'name' => 'sometimes|string|max:255',
            'description' => 'sometimes|string|max:2000',
        ]);

        if ($validated['type'] === 'cms') {
            $validated['slug'] = 'core';
        }
        $validated['checksum_sha256'] = strtolower($validated['checksum_sha256']);
        $this->registry->register($validated);

        return response()->json(['status' => 'ok']);
    }

    public function download(string $type, string $slug): \Illuminate\Http\RedirectResponse
    {
        abort_unless(in_array($type, ['plugins', 'themes'], true), 404);
        $release = $this->registry->latest($type === 'plugins' ? 'plugin' : 'theme', $slug);
        abort_unless($release && !empty($release['download_url']), 404);

        return redirect()->away($release['download_url']);
    }

    // ─── Private helpers ─────────────────────────────────

    /**
     * Compare installed extension versions against available manifests.
     */
    private function checkExtensionUpdates(array $installed, string $basePath, string $manifestFile): array
    {
        $updates = [];

        foreach ($installed as $slug => $currentVersion) {
            abort_unless(is_string($slug) && preg_match('/^[a-z0-9][a-z0-9-]*$/D', $slug), 422);
            $release = $this->registry->latest($manifestFile === 'artisan-plugin.json' ? 'plugin' : 'theme', $slug);
            $latestVersion = $release['version'] ?? $currentVersion;
            $updates[$slug] = [
                'latest' => $latestVersion,
                'update_available' => version_compare($latestVersion, $currentVersion, '>'),
                'download_url' => $release['download_url'] ?? null,
                'changelog' => $release['changelog'] ?? null,
                'checksum_sha256' => $release['checksum_sha256'] ?? null,
            ];
        }

        return $updates;
    }

    /**
     * Scan a directory for extensions and return their manifest data.
     */
    private function scanExtensions(string $basePath, string $manifestFile): array
    {
        $extensions = [];

        if (!is_dir($basePath)) {
            return $extensions;
        }

        foreach (scandir($basePath) as $dir) {
            if ($dir === '.' || $dir === '..') {
                continue;
            }

            $manifestPath = $basePath . '/' . $dir . '/' . $manifestFile;
            if (!file_exists($manifestPath)) {
                continue;
            }

            try {
                $manifest = json_decode(file_get_contents($manifestPath), true, 512, JSON_THROW_ON_ERROR);
            } catch (\JsonException) {
                continue;
            }

            $extensions[] = [
                'slug' => $manifest['slug'] ?? $dir,
                'name' => $manifest['name'] ?? $dir,
                'version' => $manifest['version'] ?? '1.0.0',
                'description' => $manifest['description'] ?? '',
                'author' => $manifest['author'] ?? null,
                'license' => $manifest['license'] ?? 'MIT',
                'category' => $manifest['category'] ?? null,
                'tags' => $manifest['tags'] ?? [],
            ];
        }

        return $extensions;
    }

    private function getLatestChangelog(): ?string
    {
        $changelogPath = base_path('CHANGELOG.md');
        if (!file_exists($changelogPath)) {
            return null;
        }

        $content = file_get_contents($changelogPath);
        // Extract only the latest version section (up to the next ## heading)
        if (preg_match('/^## .+?\n(.*?)(?=\n## |\z)/ms', $content, $matches)) {
            return trim($matches[0]);
        }

        return null;
    }
}
