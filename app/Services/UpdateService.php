<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\CmsPlugin;
use App\Models\CmsTheme;
use App\Models\UpdateLog;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use ZipArchive;

class UpdateService
{
    // ─── Check for updates ───────────────────────────────

    private function registryUrl(): ?string
    {
        return config('cms.registry.url');
    }

    /**
     * Batch check for CMS + plugins + themes via POST /check-updates.
     *
     * @return array{cms: array, plugins: array, themes: array, checked_at: string|null}
     */
    public function checkForUpdates(): array
    {
        $registryUrl = $this->registryUrl();

        if (!$registryUrl) {
            return [
                'cms' => $this->localCmsInfo(),
                'plugins' => $this->localPluginsList(),
                'themes' => $this->localThemesList(),
                'checked_at' => null,
            ];
        }

        $cached = Cache::get('cms.update_check');
        if ($cached) {
            return $cached;
        }

        try {
            $response = Http::timeout(15)
                ->post($registryUrl . '/check-updates', $this->buildCheckPayload());

            if ($response->successful()) {
                $data = $response->json();
                $result = [
                    'cms' => $this->parseCmsUpdate($data['cms'] ?? null),
                    'plugins' => $this->parsePluginUpdates($data['plugins'] ?? []),
                    'themes' => $this->parseThemeUpdates($data['themes'] ?? []),
                    'checked_at' => $data['checked_at'] ?? now()->toIso8601String(),
                ];

                Cache::put('cms.update_check', $result, 300);

                return $result;
            }
        } catch (\Throwable $e) {
            Log::warning('Update check failed: ' . $e->getMessage());
        }

        return [
            'cms' => $this->localCmsInfo(),
            'plugins' => $this->localPluginsList(),
            'themes' => $this->localThemesList(),
            'checked_at' => null,
        ];
    }

    public function checkCmsUpdate(): array
    {
        $currentVersion = config('cms.version', '1.0.0');
        $registryUrl = $this->registryUrl();

        if (!$registryUrl) {
            return $this->localCmsInfo();
        }

        try {
            $response = Http::timeout(10)->get($registryUrl . '/version');
            if ($response->successful()) {
                $data = $response->json();

                return [
                    'current' => $currentVersion,
                    'latest' => $data['version'] ?? null,
                    'available' => version_compare($data['version'] ?? $currentVersion, $currentVersion, '>'),
                    'download_url' => $data['download_url'] ?? null,
                    'changelog' => $data['changelog'] ?? null,
                    'checksum' => $data['checksum_sha256'] ?? null,
                ];
            }
        } catch (\Throwable) {
            // silent
        }

        return $this->localCmsInfo();
    }

    public function checkPluginUpdates(): array
    {
        return $this->checkForUpdates()['plugins'];
    }

    public function checkThemeUpdates(): array
    {
        return $this->checkForUpdates()['themes'];
    }

    public function forceCheck(): array
    {
        Cache::forget('cms.update_check');

        return $this->checkForUpdates();
    }

    public function countAvailableUpdates(): int
    {
        $updates = $this->checkForUpdates();
        $count = ($updates['cms']['available'] ?? false) ? 1 : 0;

        foreach ($updates['plugins'] as $p) {
            if ($p['available'] ?? false) {
                $count++;
            }
        }
        foreach ($updates['themes'] as $t) {
            if ($t['available'] ?? false) {
                $count++;
            }
        }

        return $count;
    }

    // ─── Perform updates ─────────────────────────────────

    /**
     * Update a plugin: download ZIP, verify checksum, backup, extract, replace.
     */
    public function updatePlugin(string $slug): UpdateLog
    {
        $plugin = CmsPlugin::where('slug', $slug)->firstOrFail();
        $updates = $this->checkForUpdates();
        $info = collect($updates['plugins'])->firstWhere('slug', $slug);

        if (!$info || !($info['available'] ?? false)) {
            throw new RuntimeException("Aucune mise à jour disponible pour le plugin « {$slug} ».");
        }

        $log = $this->logUpdate('plugin', $slug, $plugin->version ?? '0.0.0', $info['latest']);

        try {
            // Backup
            $backupPath = null;
            if (config('cms.updates.backup_before_update', true)) {
                $backupPath = $this->createBackup('plugin', $slug);
                if ($backupPath) {
                    $log->update(['backup_path' => ['path' => $backupPath]]);
                }
            }

            // Download
            $log->update(['status' => 'downloading']);
            $downloadUrl = $info['download_url'] ?? $this->resolveDownloadUrl('plugins', $slug);
            $zipPath = $this->downloadFile($downloadUrl);

            // Verify checksum
            if (!empty($info['checksum'])) {
                if (!$this->verifyChecksum($zipPath, $info['checksum'])) {
                    @unlink($zipPath);
                    throw new RuntimeException('Checksum invalide — le fichier est corrompu ou a été modifié.');
                }
            }

            // Install
            $log->update(['status' => 'installing']);
            $tmpDir = $this->extractZip($zipPath);
            @unlink($zipPath);

            $this->validatePluginPackage($tmpDir);

            $pluginDir = config('cms.paths.plugins') . '/' . $slug;
            $this->replaceDirectory($tmpDir, $pluginDir);

            // Run migrations
            $migrationsPath = $pluginDir . '/database/migrations';
            if (File::isDirectory($migrationsPath)) {
                $relative = str_replace(base_path() . '/', '', str_replace('\\', '/', $migrationsPath));
                Artisan::call('migrate', ['--path' => $relative, '--force' => true]);
            }

            // Update DB
            $manifest = $this->readManifest($pluginDir . '/artisan-plugin.json');
            $plugin->update([
                'version' => $manifest['version'] ?? $info['latest'],
                'name' => $manifest['name'] ?? $plugin->name,
                'description' => $manifest['description'] ?? $plugin->description,
            ]);

            // Clear caches
            Cache::forget('cms.update_check');
            try {
                Artisan::call('config:cache');
            } catch (\Throwable) {
            }

            $log->markCompleted();
            Log::info("Plugin « {$slug} » mis à jour vers v{$info['latest']}.");

            return $log;
        } catch (\Throwable $e) {
            $log->markFailed($e->getMessage());
            Log::error("Échec mise à jour plugin « {$slug} »: {$e->getMessage()}");

            // Attempt rollback
            if (isset($backupPath) && $backupPath) {
                $this->restoreBackup($backupPath, config('cms.paths.plugins') . '/' . $slug);
            }

            throw $e;
        }
    }

    /**
     * Update a theme: download ZIP, verify checksum, backup, extract, replace.
     */
    public function updateTheme(string $slug): UpdateLog
    {
        $theme = CmsTheme::where('slug', $slug)->firstOrFail();
        $updates = $this->checkForUpdates();
        $info = collect($updates['themes'])->firstWhere('slug', $slug);

        if (!$info || !($info['available'] ?? false)) {
            throw new RuntimeException("Aucune mise à jour disponible pour le thème « {$slug} ».");
        }

        $log = $this->logUpdate('theme', $slug, $theme->version ?? '0.0.0', $info['latest']);

        try {
            $backupPath = null;
            if (config('cms.updates.backup_before_update', true)) {
                $backupPath = $this->createBackup('theme', $slug);
                if ($backupPath) {
                    $log->update(['backup_path' => ['path' => $backupPath]]);
                }
            }

            $log->update(['status' => 'downloading']);
            $downloadUrl = $info['download_url'] ?? $this->resolveDownloadUrl('themes', $slug);
            $zipPath = $this->downloadFile($downloadUrl);

            if (!empty($info['checksum'])) {
                if (!$this->verifyChecksum($zipPath, $info['checksum'])) {
                    @unlink($zipPath);
                    throw new RuntimeException('Checksum invalide.');
                }
            }

            $log->update(['status' => 'installing']);
            $tmpDir = $this->extractZip($zipPath);
            @unlink($zipPath);

            $this->validateThemePackage($tmpDir);

            $themeDir = config('cms.paths.themes') . '/' . $slug;
            $this->replaceDirectory($tmpDir, $themeDir);

            $manifest = $this->readManifest($themeDir . '/artisan-theme.json');
            $theme->update([
                'version' => $manifest['version'] ?? $info['latest'],
                'name' => $manifest['name'] ?? $theme->name,
                'description' => $manifest['description'] ?? $theme->description,
            ]);

            Cache::forget('cms.update_check');

            $log->markCompleted();
            Log::info("Thème « {$slug} » mis à jour vers v{$info['latest']}.");

            return $log;
        } catch (\Throwable $e) {
            $log->markFailed($e->getMessage());
            Log::error("Échec mise à jour thème « {$slug} »: {$e->getMessage()}");

            if (isset($backupPath) && $backupPath) {
                $this->restoreBackup($backupPath, config('cms.paths.themes') . '/' . $slug);
            }

            throw $e;
        }
    }

    /**
     * Run automatic updates based on config settings.
     *
     * @return array<int, UpdateLog>
     */
    public function performAutoUpdates(): array
    {
        $updates = $this->forceCheck();
        $logs = [];

        // Auto-update plugins
        if (config('cms.updates.auto_update_plugins', false)) {
            foreach ($updates['plugins'] as $plugin) {
                if (!($plugin['available'] ?? false)) {
                    continue;
                }
                // Only minor/patch updates for safety
                if ($this->isMajorUpdate($plugin['current'] ?? '0.0.0', $plugin['latest'] ?? '0.0.0')) {
                    continue;
                }
                try {
                    $logs[] = $this->updatePlugin($plugin['slug']);
                } catch (\Throwable $e) {
                    Log::warning("Auto-update plugin « {$plugin['slug']} » failed: {$e->getMessage()}");
                }
            }
        }

        // Auto-update themes
        if (config('cms.updates.auto_update_themes', false)) {
            foreach ($updates['themes'] as $theme) {
                if (!($theme['available'] ?? false)) {
                    continue;
                }
                if ($this->isMajorUpdate($theme['current'] ?? '0.0.0', $theme['latest'] ?? '0.0.0')) {
                    continue;
                }
                try {
                    $logs[] = $this->updateTheme($theme['slug']);
                } catch (\Throwable $e) {
                    Log::warning("Auto-update thème « {$theme['slug']} » failed: {$e->getMessage()}");
                }
            }
        }

        return $logs;
    }

    // ─── History, backup, rollback ───────────────────────

    /**
     * @return \Illuminate\Database\Eloquent\Collection<int, UpdateLog>
     */
    public function getHistory(int $limit = 20): \Illuminate\Database\Eloquent\Collection
    {
        return UpdateLog::with('performer')->latest()->take($limit)->get();
    }

    public function createBackup(string $type, ?string $slug = null): ?string
    {
        $backupDir = 'backups/' . date('Y-m-d_His') . '_' . $type;
        if ($slug) {
            $backupDir .= '_' . $slug;
        }

        try {
            $source = match ($type) {
                'plugin' => base_path("content/plugins/{$slug}"),
                'theme' => base_path("content/themes/{$slug}"),
                default => null,
            };

            if ($source && is_dir($source)) {
                $this->copyDirectory($source, storage_path("app/{$backupDir}"));

                return $backupDir;
            }
        } catch (\Throwable $e) {
            Log::warning("Backup failed for {$type}/{$slug}: {$e->getMessage()}");
        }

        return null;
    }

    public function verifyChecksum(string $filePath, string $expectedHash): bool
    {
        if (!file_exists($filePath)) {
            return false;
        }

        return hash_equals($expectedHash, hash_file('sha256', $filePath));
    }

    public function rollback(UpdateLog $updateLog): bool
    {
        $backupPath = $updateLog->backup_path;
        if (!$backupPath || !is_array($backupPath) || empty($backupPath['path'])) {
            return false;
        }

        try {
            $storagePath = storage_path('app/' . $backupPath['path']);
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

            // Restore version in DB
            if ($updateLog->type === 'plugin') {
                CmsPlugin::where('slug', $updateLog->slug)
                    ->update(['version' => $updateLog->from_version]);
            } elseif ($updateLog->type === 'theme') {
                CmsTheme::where('slug', $updateLog->slug)
                    ->update(['version' => $updateLog->from_version]);
            }

            Cache::forget('cms.update_check');
            Log::info("Rollback {$updateLog->type}/{$updateLog->slug} to v{$updateLog->from_version}.");

            return true;
        } catch (\Throwable $e) {
            Log::error("Rollback failed: {$e->getMessage()}");

            return false;
        }
    }

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

    // ─── Auto-update settings (stored via Setting model) ─

    public function getAutoUpdateSettings(): array
    {
        return [
            'auto_update' => $this->getSetting('cms_auto_update', config('cms.updates.auto_update', 'disabled')),
            'auto_update_plugins' => (bool) $this->getSetting('cms_auto_update_plugins', config('cms.updates.auto_update_plugins', false)),
            'auto_update_themes' => (bool) $this->getSetting('cms_auto_update_themes', config('cms.updates.auto_update_themes', false)),
            'notify_email' => (bool) $this->getSetting('cms_update_notify_email', true),
        ];
    }

    public function saveAutoUpdateSettings(array $settings): void
    {
        if (array_key_exists('auto_update', $settings)) {
            $this->saveSetting('cms_auto_update', $settings['auto_update']);
        }
        if (array_key_exists('auto_update_plugins', $settings)) {
            $this->saveSetting('cms_auto_update_plugins', $settings['auto_update_plugins'] ? '1' : '0');
        }
        if (array_key_exists('auto_update_themes', $settings)) {
            $this->saveSetting('cms_auto_update_themes', $settings['auto_update_themes'] ? '1' : '0');
        }
        if (array_key_exists('notify_email', $settings)) {
            $this->saveSetting('cms_update_notify_email', $settings['notify_email'] ? '1' : '0');
        }
    }

    // ─── Private helpers ─────────────────────────────────

    private function downloadFile(string $url): string
    {
        $tmpDir = config('cms.updates.temp_dir', storage_path('app/updates'));
        if (!File::isDirectory($tmpDir)) {
            File::makeDirectory($tmpDir, 0755, true);
        }

        $tmpFile = $tmpDir . '/' . uniqid('update_', true) . '.zip';

        $response = Http::timeout(120)->withOptions(['sink' => $tmpFile])->get($url);

        if (!$response->successful() || !file_exists($tmpFile) || filesize($tmpFile) === 0) {
            @unlink($tmpFile);
            throw new RuntimeException("Échec du téléchargement depuis {$url}");
        }

        return $tmpFile;
    }

    private function extractZip(string $zipPath): string
    {
        $zip = new ZipArchive();
        if ($zip->open($zipPath) !== true) {
            throw new RuntimeException('Impossible d\'ouvrir le fichier ZIP.');
        }

        $tmpDir = sys_get_temp_dir() . '/artisan_update_' . uniqid('', true);
        File::makeDirectory($tmpDir, 0755, true);

        // Security: validate ZIP entries for path traversal
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $name = $zip->getNameIndex($i);
            if (str_contains($name, '..') || str_starts_with($name, '/')) {
                $zip->close();
                File::deleteDirectory($tmpDir);
                throw new RuntimeException('Archive ZIP suspecte : chemin interdit détecté.');
            }
        }

        $zip->extractTo($tmpDir);
        $zip->close();

        // If ZIP contains a single subdirectory, use that as root
        $entries = array_diff(scandir($tmpDir), ['.', '..']);
        if (count($entries) === 1) {
            $single = $tmpDir . '/' . reset($entries);
            if (is_dir($single)) {
                return $single;
            }
        }

        return $tmpDir;
    }

    private function validatePluginPackage(string $path): void
    {
        if (!file_exists($path . '/artisan-plugin.json')) {
            throw new RuntimeException('Package invalide : artisan-plugin.json manquant.');
        }

        $manifest = $this->readManifest($path . '/artisan-plugin.json');
        if (!$manifest || empty($manifest['slug']) || empty($manifest['version'])) {
            throw new RuntimeException('Manifeste du plugin invalide.');
        }
    }

    private function validateThemePackage(string $path): void
    {
        if (!file_exists($path . '/artisan-theme.json')) {
            throw new RuntimeException('Package invalide : artisan-theme.json manquant.');
        }

        $manifest = $this->readManifest($path . '/artisan-theme.json');
        if (!$manifest || empty($manifest['slug']) || empty($manifest['version'])) {
            throw new RuntimeException('Manifeste du thème invalide.');
        }
    }

    private function replaceDirectory(string $source, string $target): void
    {
        if (File::isDirectory($target)) {
            File::deleteDirectory($target);
        }
        File::copyDirectory($source, $target);

        // Cleanup temp
        if (File::isDirectory($source)) {
            File::deleteDirectory($source);
        }
    }

    private function restoreBackup(string $backupDir, string $targetDir): void
    {
        $storagePath = storage_path('app/' . $backupDir);
        if (is_dir($storagePath)) {
            $this->copyDirectory($storagePath, $targetDir);
        }
    }

    private function resolveDownloadUrl(string $type, string $slug): string
    {
        $registryUrl = $this->registryUrl();
        if (!$registryUrl) {
            throw new RuntimeException('Registry URL non configurée.');
        }

        return $registryUrl . '/' . $type . '/' . $slug . '/download';
    }

    private function readManifest(string $path): ?array
    {
        if (!file_exists($path)) {
            return null;
        }
        try {
            return json_decode(file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            return null;
        }
    }

    private function isMajorUpdate(string $current, string $latest): bool
    {
        $currentMajor = (int) explode('.', $current)[0];
        $latestMajor = (int) explode('.', $latest)[0];

        return $latestMajor > $currentMajor;
    }

    private function buildCheckPayload(): array
    {
        $plugins = [];
        foreach (CmsPlugin::where('enabled', true)->get() as $p) {
            $plugins[$p->slug] = $p->version ?? '1.0.0';
        }

        $themes = [];
        foreach (CmsTheme::all() as $t) {
            $themes[$t->slug] = $t->version ?? '1.0.0';
        }

        return [
            'cms_version' => config('cms.version', '1.0.0'),
            'php_version' => PHP_VERSION,
            'plugins' => $plugins,
            'themes' => $themes,
        ];
    }

    private function parseCmsUpdate(?array $data): array
    {
        $current = config('cms.version', '1.0.0');
        if (!$data) {
            return $this->localCmsInfo();
        }

        return [
            'current' => $current,
            'latest' => $data['latest'] ?? $current,
            'available' => $data['update_available'] ?? false,
            'download_url' => $data['download_url'] ?? null,
            'changelog' => $data['changelog'] ?? null,
            'checksum' => $data['checksum_sha256'] ?? null,
            'urgent' => $data['urgent'] ?? false,
        ];
    }

    private function parsePluginUpdates(array $pluginsData): array
    {
        $plugins = CmsPlugin::where('enabled', true)->get();

        return $plugins->map(fn ($p) => [
            'slug' => $p->slug,
            'name' => $p->name,
            'current' => $p->version ?? '1.0.0',
            'latest' => $pluginsData[$p->slug]['latest'] ?? $p->version ?? '1.0.0',
            'available' => $pluginsData[$p->slug]['update_available'] ?? false,
            'download_url' => $pluginsData[$p->slug]['download_url'] ?? null,
            'changelog' => $pluginsData[$p->slug]['changelog'] ?? null,
            'checksum' => $pluginsData[$p->slug]['checksum_sha256'] ?? null,
        ])->toArray();
    }

    private function parseThemeUpdates(array $themesData): array
    {
        return CmsTheme::all()->map(fn ($t) => [
            'slug' => $t->slug,
            'name' => $t->name,
            'current' => $t->version ?? '1.0.0',
            'latest' => $themesData[$t->slug]['latest'] ?? $t->version ?? '1.0.0',
            'available' => $themesData[$t->slug]['update_available'] ?? false,
            'download_url' => $themesData[$t->slug]['download_url'] ?? null,
        ])->toArray();
    }

    private function localCmsInfo(): array
    {
        return [
            'current' => config('cms.version', '1.0.0'),
            'latest' => null,
            'available' => false,
            'download_url' => null,
            'changelog' => null,
        ];
    }

    private function localPluginsList(): array
    {
        return CmsPlugin::where('enabled', true)->get()->map(fn ($p) => [
            'slug' => $p->slug, 'name' => $p->name,
            'current' => $p->version ?? '1.0.0', 'latest' => null, 'available' => false,
        ])->toArray();
    }

    private function localThemesList(): array
    {
        return CmsTheme::all()->map(fn ($t) => [
            'slug' => $t->slug, 'name' => $t->name,
            'current' => $t->version ?? '1.0.0', 'latest' => null, 'available' => false,
        ])->toArray();
    }

    private function getSetting(string $key, mixed $default = null): mixed
    {
        return \App\Models\Setting::where('key', $key)->value('value') ?? $default;
    }

    private function saveSetting(string $key, string $value): void
    {
        \App\Models\Setting::updateOrCreate(['key' => $key], ['value' => $value, 'group' => 'updates']);
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
