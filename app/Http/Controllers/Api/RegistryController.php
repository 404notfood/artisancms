<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
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
    /**
     * GET /api/v1/version
     *
     * Returns the latest CMS version info.
     */
    public function version(): JsonResponse
    {
        $version = trim(File::get(base_path('VERSION')));
        $changelog = $this->getLatestChangelog();

        return response()->json([
            'version' => $version,
            'download_url' => "https://github.com/artisancms/artisancms/releases/download/v{$version}/artisancms-{$version}.tar.gz",
            'checksum_sha256' => null, // Populated by CI/CD
            'changelog' => $changelog,
            'php_required' => '>=8.3',
            'urgent' => false,
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
        $currentCmsVersion = $request->input('cms_version', '0.0.0');
        $latestCmsVersion = trim(File::get(base_path('VERSION')));

        // CMS update info
        $cmsUpdate = [
            'latest' => $latestCmsVersion,
            'update_available' => version_compare($latestCmsVersion, $currentCmsVersion, '>'),
            'download_url' => "https://github.com/artisancms/artisancms/releases/download/v{$latestCmsVersion}/artisancms-{$latestCmsVersion}.tar.gz",
            'changelog' => $this->getLatestChangelog(),
            'checksum_sha256' => null,
            'urgent' => false,
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
        $plugins = $this->scanExtensions(base_path('content/plugins'), 'artisan-plugin.json');
        $themes = $this->scanExtensions(base_path('content/themes'), 'artisan-theme.json');

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
        if (!$apiKey || $request->bearerToken() !== $apiKey) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $validated = $request->validate([
            'type' => 'required|in:cms,plugin,theme',
            'version' => 'required|string',
            'tag' => 'required|string',
            'download_url' => 'required|url',
            'checksum_url' => 'nullable|url',
        ]);

        // In a full implementation, this would store in a releases table.
        // For now, log the release notification.
        \Illuminate\Support\Facades\Log::info('New release registered', $validated);

        return response()->json(['status' => 'ok']);
    }

    // ─── Private helpers ─────────────────────────────────

    /**
     * Compare installed extension versions against available manifests.
     */
    private function checkExtensionUpdates(array $installed, string $basePath, string $manifestFile): array
    {
        $updates = [];

        foreach ($installed as $slug => $currentVersion) {
            $manifestPath = $basePath . '/' . $slug . '/' . $manifestFile;
            if (!file_exists($manifestPath)) {
                continue;
            }

            try {
                $manifest = json_decode(file_get_contents($manifestPath), true, 512, JSON_THROW_ON_ERROR);
            } catch (\JsonException) {
                continue;
            }

            $latestVersion = $manifest['version'] ?? $currentVersion;
            $updates[$slug] = [
                'latest' => $latestVersion,
                'update_available' => version_compare($latestVersion, $currentVersion, '>'),
                'download_url' => null, // Extensions are distributed via registry/marketplace
                'changelog' => $manifest['changelog'] ?? null,
                'checksum_sha256' => null,
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
