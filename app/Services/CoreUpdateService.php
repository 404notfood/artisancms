<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\UpdateLog;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Process;
use RuntimeException;

class CoreUpdateService
{
    public function __construct(
        private readonly UpdateArchive $archives,
        private readonly CorePackageInstaller $installer,
        private readonly BackupService $backups,
    ) {}

    public function install(array $info): UpdateLog
    {
        return app(UpdateLock::class)->run(fn () => $this->performInstall($info));
    }

    private function performInstall(array $info): UpdateLog
    {
        $version = $info['latest'] ?? '';
        if (!($info['available'] ?? false) || !preg_match('/^\d+\.\d+\.\d+$/D', $version)
            || !version_compare($version, config('cms.version'), '>')) {
            throw new RuntimeException('Aucune nouvelle version stable du cœur disponible.');
        }
        if (app()->isDownForMaintenance()) {
            throw new RuntimeException('Quittez la maintenance Laravel avant de lancer une mise à jour.');
        }

        $root = $this->root();
        $relative = 'updates/backups/core_' . bin2hex(random_bytes(12));
        $backupPath = storage_path('app/' . $relative);
        $stage = config('cms.updates.temp_dir', storage_path('app/updates')) . '/stage_' . bin2hex(random_bytes(12));
        $log = UpdateLog::create([
            'type' => 'cms', 'from_version' => config('cms.version'), 'to_version' => $version,
            'status' => 'downloading', 'performed_by' => auth()->id(), 'started_at' => now(),
        ]);
        $archive = null;
        $databaseBackup = null;
        $changed = false;
        $migrationStarted = false;
        $maintenance = false;
        $recovered = true;

        try {
            $archive = $this->archives->download($info['download_url'] ?? '', $info['checksum'] ?? '');
            $package = $this->archives->extract($archive, $stage);
            $this->installer->validate($package, $version);
            $this->run(['-r', 'require $argv[1];', $package . '/vendor/composer/platform_check.php']);

            if (Artisan::call('down', ['--retry' => 60]) !== 0) {
                throw new RuntimeException('Impossible de placer le CMS en maintenance.');
            }
            $maintenance = true;
            $databaseBackup = $this->backups->create('database');
            $this->installer->backup($root, $backupPath);
            $metadata = ['path' => $relative, 'database_backup_id' => $databaseBackup->id, 'schema_changed' => true];
            $log->update(['status' => 'installing', 'backup_path' => $metadata]);
            $migrations = DB::table('migrations')->pluck('migration')->all();
            $changed = true;
            $this->installer->apply($package, $root);
            $this->clearBootstrapCache();
            $this->run(['artisan', 'optimize:clear']);
            $migrationStarted = true;
            $this->run(['artisan', 'migrate', '--force']);
            $metadata['schema_changed'] = $migrations !== DB::table('migrations')->pluck('migration')->all();
            $log->update(['backup_path' => $metadata]);
            $log->markCompleted();
            config(['cms.version' => $version]);
            Cache::forget('cms.update_check');
            if (function_exists('opcache_reset')) {
                opcache_reset();
            }

            return $log;
        } catch (\Throwable $error) {
            try {
                if ($changed) {
                    $this->installer->restore($backupPath, $root);
                    $this->clearBootstrapCache();
                    if ($migrationStarted && $databaseBackup) {
                        $this->backups->restore($databaseBackup);
                        $databaseBackup->update(['status' => 'completed']);
                    }
                    $this->run(['artisan', 'optimize:clear']);
                }
            } catch (\Throwable $restoreError) {
                $recovered = false;
                Log::critical('Restauration du cœur interrompue', ['error' => $restoreError->getMessage(), 'backup' => $relative]);
            }
            $message = $error->getMessage() . ($recovered ? '' : ' Restauration incomplète : le site reste en maintenance.');
            if (isset($metadata)) {
                $log->update(['backup_path' => $metadata]);
            }
            $log->markFailed($message);
            throw new RuntimeException($message, 0, $error);
        } finally {
            if ($maintenance && $recovered) {
                Artisan::call('up');
            }
            if ($archive) {
                File::delete($archive);
            }
            File::deleteDirectory($stage);
        }
    }

    public function rollback(UpdateLog $log): bool
    {
        return app(UpdateLock::class)->run(function () use ($log): bool {
            $metadata = $log->backup_path;
            if ($log->status !== 'completed') {
                throw new RuntimeException('Seule une mise à jour terminée peut être restaurée.');
            }
            if ($metadata['schema_changed'] ?? true) {
                throw new RuntimeException('Cette version a modifié la base de données. Une restauration complète depuis la sauvegarde est nécessaire.');
            }
            if (UpdateLog::where('type', 'cms')->where('id', '>', $log->id)->where('status', 'completed')->exists()) {
                throw new RuntimeException('Restaurez d’abord la mise à jour du cœur la plus récente.');
            }
            $path = $metadata['path'] ?? '';
            if (!preg_match('#^updates/backups/core_[a-f0-9]{24}$#D', $path) || !is_dir(storage_path('app/' . $path))) {
                throw new RuntimeException('Sauvegarde du cœur introuvable.');
            }
            if (app()->isDownForMaintenance()) {
                throw new RuntimeException('Le site est déjà en maintenance.');
            }
            if (Artisan::call('down', ['--retry' => 60]) !== 0) {
                throw new RuntimeException('Impossible de placer le CMS en maintenance.');
            }
            // On restore failure leave maintenance enabled for recovery from the retained backup.
            $this->installer->restore(storage_path('app/' . $path), $this->root());
            $this->clearBootstrapCache();
            $this->run(['artisan', 'optimize:clear']);
            $log->update(['status' => 'rolled_back']);
            Cache::forget('cms.update_check');
            config(['cms.version' => $log->from_version]);
            if (function_exists('opcache_reset')) {
                opcache_reset();
            }
            Artisan::call('up');

            return true;
        });
    }

    private function root(): string
    {
        return config('cms.updates.base_path', base_path());
    }

    private function clearBootstrapCache(): void
    {
        $directory = $this->root() . '/bootstrap/cache';
        if (is_link($directory)) {
            throw new RuntimeException('Le dossier des caches ne peut pas être un lien symbolique.');
        }
        foreach (File::glob($directory . '/*.php') as $file) {
            if (!File::delete($file)) {
                throw new RuntimeException('Impossible de supprimer les anciens caches PHP.');
            }
        }
    }

    private function run(array $arguments): void
    {
        $result = Process::path($this->root())->timeout(600)->run([
            config('cms.updates.php_binary', PHP_SAPI === 'cli' ? PHP_BINARY : 'php'), ...$arguments,
        ]);
        if (!$result->successful()) {
            throw new RuntimeException('Commande de mise à jour échouée : ' . $result->errorOutput() . $result->output());
        }
    }
}
