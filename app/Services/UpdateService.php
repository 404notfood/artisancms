<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\CmsPlugin;
use App\Models\CmsTheme;
use App\Models\UpdateLog;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

class UpdateService
{
    /**
     * Check for available updates for CMS, plugins, and themes.
     *
     * @return array<string, mixed>
     */
    public function checkForUpdates(): array
    {
        return [
            'cms' => $this->checkCmsUpdate(),
            'plugins' => $this->checkPluginUpdates(),
            'themes' => $this->checkThemeUpdates(),
        ];
    }

    /**
     * Check if a CMS update is available.
     *
     * @return array{current: string, latest: string|null, available: bool, changelog: string|null}
     */
    public function checkCmsUpdate(): array
    {
        $currentVersion = config('cms.version', '1.0.0');
        $registryUrl = config('cms.registry_url');

        if (!$registryUrl) {
            return [
                'current' => $currentVersion,
                'latest' => null,
                'available' => false,
                'changelog' => null,
            ];
        }

        try {
            $response = Http::timeout(10)->get($registryUrl . '/cms/latest');
            if ($response->successful()) {
                $data = $response->json();
                return [
                    'current' => $currentVersion,
                    'latest' => $data['version'] ?? null,
                    'available' => version_compare($data['version'] ?? $currentVersion, $currentVersion, '>'),
                    'changelog' => $data['changelog'] ?? null,
                ];
            }
        } catch (\Throwable) {
            // Silently fail
        }

        return [
            'current' => $currentVersion,
            'latest' => null,
            'available' => false,
            'changelog' => null,
        ];
    }

    /**
     * Check for plugin updates.
     *
     * @return array<int, array{slug: string, name: string, current: string, latest: string|null, available: bool}>
     */
    public function checkPluginUpdates(): array
    {
        $plugins = CmsPlugin::where('enabled', true)->get();
        $updates = [];

        foreach ($plugins as $plugin) {
            $updates[] = [
                'slug' => $plugin->slug,
                'name' => $plugin->name,
                'current' => $plugin->version ?? '1.0.0',
                'latest' => null,
                'available' => false,
            ];
        }

        return $updates;
    }

    /**
     * Check for theme updates.
     *
     * @return array<int, array{slug: string, name: string, current: string, latest: string|null, available: bool}>
     */
    public function checkThemeUpdates(): array
    {
        $themes = CmsTheme::all();
        $updates = [];

        foreach ($themes as $theme) {
            $updates[] = [
                'slug' => $theme->slug,
                'name' => $theme->name,
                'current' => $theme->version ?? '1.0.0',
                'latest' => null,
                'available' => false,
            ];
        }

        return $updates;
    }

    /**
     * Get update history.
     *
     * @return \Illuminate\Database\Eloquent\Collection<int, UpdateLog>
     */
    public function getHistory(int $limit = 20): \Illuminate\Database\Eloquent\Collection
    {
        return UpdateLog::with('performer')
            ->latest()
            ->take($limit)
            ->get();
    }

    /**
     * Create a pre-update backup.
     */
    public function createBackup(string $type, ?string $slug = null): ?string
    {
        $backupDir = 'backups/' . date('Y-m-d_His') . '_' . $type;
        if ($slug) {
            $backupDir .= '_' . $slug;
        }

        try {
            if ($type === 'plugin' && $slug) {
                $source = base_path("content/plugins/{$slug}");
                if (is_dir($source)) {
                    $this->copyDirectory($source, storage_path("app/{$backupDir}"));
                    return $backupDir;
                }
            }

            if ($type === 'theme' && $slug) {
                $source = base_path("content/themes/{$slug}");
                if (is_dir($source)) {
                    $this->copyDirectory($source, storage_path("app/{$backupDir}"));
                    return $backupDir;
                }
            }
        } catch (\Throwable) {
            return null;
        }

        return null;
    }

    /**
     * Verify file checksum.
     */
    public function verifyChecksum(string $filePath, string $expectedHash): bool
    {
        if (!file_exists($filePath)) {
            return false;
        }

        $actualHash = hash_file('sha256', $filePath);
        return hash_equals($expectedHash, $actualHash);
    }

    /**
     * Rollback a failed update using backup.
     */
    public function rollback(UpdateLog $updateLog): bool
    {
        $backupPath = $updateLog->backup_path;
        if (!$backupPath || !is_array($backupPath)) {
            return false;
        }

        try {
            $storagePath = storage_path('app/' . ($backupPath['path'] ?? ''));
            $targetPath = match ($updateLog->type) {
                'plugin' => base_path("content/plugins/{$updateLog->slug}"),
                'theme' => base_path("content/themes/{$updateLog->slug}"),
                default => null,
            };

            if (!$targetPath || !is_dir($storagePath)) {
                return false;
            }

            $this->copyDirectory($storagePath, $targetPath);

            $updateLog->update(['status' => 'rolled_back']);
            return true;
        } catch (\Throwable) {
            return false;
        }
    }

    /**
     * Log an update attempt.
     */
    public function logUpdate(string $type, ?string $slug, string $fromVersion, string $toVersion): UpdateLog
    {
        return UpdateLog::create([
            'type' => $type,
            'slug' => $slug,
            'from_version' => $fromVersion,
            'to_version' => $toVersion,
            'status' => 'pending',
            'performed_by' => auth()->id(),
            'started_at' => now(),
        ]);
    }

    private function copyDirectory(string $source, string $destination): void
    {
        if (!is_dir($destination)) {
            mkdir($destination, 0755, true);
        }

        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($source, \FilesystemIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::SELF_FIRST,
        );

        foreach ($iterator as $item) {
            $target = $destination . DIRECTORY_SEPARATOR . $iterator->getSubPathname();
            if ($item->isDir()) {
                if (!is_dir($target)) {
                    mkdir($target, 0755, true);
                }
            } else {
                copy($item->getPathname(), $target);
            }
        }
    }
}
