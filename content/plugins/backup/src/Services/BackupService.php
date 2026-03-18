<?php

declare(strict_types=1);

namespace Backup\Services;

use App\CMS\Facades\CMS;
use Backup\Models\Backup;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Symfony\Component\Process\ExecutableFinder;
use Symfony\Component\Process\Process;
use ZipArchive;

class BackupService
{
    private const ALLOWED_TYPES = ['full', 'database', 'media'];

    /**
     * Create a new backup of the given type.
     *
     * @throws RuntimeException When the backup process fails
     * @throws \InvalidArgumentException When an invalid type is given
     */
    public function create(string $type = 'full', ?int $userId = null): Backup
    {
        if (!in_array($type, self::ALLOWED_TYPES, true)) {
            throw new \InvalidArgumentException(
                "Invalid backup type '{$type}'. Allowed: " . implode(', ', self::ALLOWED_TYPES)
            );
        }

        $config = config('backup');
        if (!$config || !isset($config['destination'])) {
            throw new RuntimeException('Backup configuration is missing. Is the backup plugin loaded?');
        }

        $destination = $config['destination'];
        File::ensureDirectoryExists($destination);

        $timestamp = now()->format('Y-m-d-His');
        $filename = "{$config['filename_prefix']}-{$type}-{$timestamp}.zip";
        $path = $destination . '/' . $filename;

        $backup = Backup::create([
            'filename' => $filename,
            'path' => $path,
            'disk' => 'local',
            'type' => $type,
            'status' => 'pending',
            'created_by' => $userId,
        ]);

        try {
            $backup->markAsRunning();
            $startTime = microtime(true);

            $tempDir = storage_path('app/temp/backup-' . uniqid('', true));
            File::ensureDirectoryExists($tempDir);

            try {
                if (in_array($type, ['full', 'database'], true) && ($config['include_database'] ?? true)) {
                    $this->dumpDatabase($tempDir . '/database.sql');
                }

                if (in_array($type, ['full', 'media'], true) && ($config['include_media'] ?? true)) {
                    $this->copyMedia($tempDir . '/media');
                }

                $this->createZipArchive($tempDir, $path);
            } finally {
                File::deleteDirectory($tempDir);
            }

            $size = filesize($path);
            if ($size === false) {
                throw new RuntimeException("Cannot read backup file size: {$path}");
            }

            $maxSizeBytes = ($config['max_size_mb'] ?? 500) * 1024 * 1024;
            if ($size > $maxSizeBytes) {
                File::delete($path);
                $sizeMb = round($size / 1024 / 1024, 1);
                throw new RuntimeException(
                    "Backup is {$sizeMb} MB, exceeding the {$config['max_size_mb']} MB limit."
                );
            }

            $duration = (int) round(microtime(true) - $startTime);
            $checksum = 'sha256:' . hash_file('sha256', $path);
            $metadata = $this->collectMetadata($type, $checksum, $duration);

            $backup->markAsCompleted($size, $metadata);

            CMS::fire('backup.created', $backup);
            Log::info("Backup completed: {$filename}", compact('type', 'size', 'duration'));

        } catch (\Throwable $e) {
            $backup->markAsFailed($e->getMessage());

            if (File::exists($path)) {
                File::delete($path);
            }

            Log::error("Backup failed: {$filename}", ['type' => $type, 'error' => $e->getMessage()]);
            throw $e;
        }

        return $backup;
    }

    /**
     * Create a MySQL dump file using mysqldump.
     *
     * @throws RuntimeException When the dump fails
     */
    public function dumpDatabase(string $path): void
    {
        $connection = config('database.default');
        $dbConfig = config("database.connections.{$connection}");

        if (!$dbConfig || empty($dbConfig['database'])) {
            throw new RuntimeException("Database connection '{$connection}' is not configured.");
        }

        $mysqldump = $this->findMysqldumpBinary();

        $args = [
            $mysqldump,
            '--host=' . ($dbConfig['host'] ?? '127.0.0.1'),
            '--port=' . ($dbConfig['port'] ?? '3306'),
            '--user=' . ($dbConfig['username'] ?? 'root'),
            '--single-transaction',
            '--routines',
            '--triggers',
            '--add-drop-table',
            '--result-file=' . str_replace('/', DIRECTORY_SEPARATOR, $path),
            $dbConfig['database'],
        ];

        // Pass password via environment variable to avoid exposing it in process list
        $env = null;
        $password = $dbConfig['password'] ?? '';
        if ($password !== '') {
            $env = array_merge(getenv() ?: [], ['MYSQL_PWD' => $password]);
        }

        $process = new Process($args, null, $env);
        $process->setTimeout(300);
        $process->run();

        if (!$process->isSuccessful()) {
            $stderr = mb_convert_encoding($process->getErrorOutput(), 'UTF-8', 'UTF-8');
            throw new RuntimeException(
                "mysqldump failed (exit {$process->getExitCode()}): {$stderr}"
            );
        }

        if (!File::exists($path) || filesize($path) === 0) {
            throw new RuntimeException('mysqldump produced an empty file.');
        }
    }

    public function delete(Backup $backup): void
    {
        CMS::fire('backup.deleting', $backup);

        if (File::exists($backup->path)) {
            File::delete($backup->path);
        }

        $backup->delete();

        CMS::fire('backup.deleted', $backup);
    }

    /** @return \Illuminate\Contracts\Pagination\LengthAwarePaginator<Backup> */
    public function getAll(int $perPage = 20): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        return Backup::orderByDesc('created_at')->paginate($perPage);
    }

    public function getLatest(): ?Backup
    {
        return Backup::completed()->orderByDesc('created_at')->first();
    }

    /**
     * Apply the retention policy: keep daily/weekly/monthly backups within
     * their respective windows, delete everything else.
     *
     * @return int Number of backups deleted
     */
    public function cleanup(): int
    {
        $retention = config('backup.retention', [
            'daily' => 7,
            'weekly' => 4,
            'monthly' => 3,
        ]);

        $dailyCutoff = now()->subDays($retention['daily']);
        $weeklyCutoff = now()->subWeeks($retention['weekly']);
        $monthlyCutoff = now()->subMonths($retention['monthly']);

        $deleted = 0;

        // Collect IDs already handled to avoid double-deleting
        $processedIds = [];

        // Pass 1: backups older than daily retention but potentially kept as weekly/monthly
        $expired = Backup::completed()
            ->where('created_at', '<', $dailyCutoff)
            ->orderBy('created_at')
            ->get();

        foreach ($expired as $backup) {
            $isWeeklyKeep = $backup->created_at->dayOfWeek === 1
                && $backup->created_at->gte($weeklyCutoff);

            $isMonthlyKeep = $backup->created_at->day === 1
                && $backup->created_at->gte($monthlyCutoff);

            if (!$isWeeklyKeep && !$isMonthlyKeep) {
                $this->delete($backup);
                $deleted++;
            }

            $processedIds[] = $backup->id;
        }

        // Pass 2: weekly backups that exceeded weekly retention (keep monthly ones)
        $weeklyExpired = Backup::completed()
            ->where('created_at', '<', $weeklyCutoff)
            ->whereNotIn('id', $processedIds)
            ->orderBy('created_at')
            ->get();

        foreach ($weeklyExpired as $backup) {
            if ($backup->created_at->dayOfWeek !== 1) {
                continue;
            }

            $isMonthlyKeep = $backup->created_at->day === 1
                && $backup->created_at->gte($monthlyCutoff);

            if (!$isMonthlyKeep) {
                $this->delete($backup);
                $deleted++;
                $processedIds[] = $backup->id;
            }
        }

        // Pass 3: monthly backups beyond monthly retention
        Backup::completed()
            ->where('created_at', '<', $monthlyCutoff)
            ->whereNotIn('id', $processedIds)
            ->orderBy('created_at')
            ->chunk(50, function ($backups) use (&$deleted) {
                foreach ($backups as $backup) {
                    $this->delete($backup);
                    $deleted++;
                }
            });

        // Pass 4: failed backups older than 24h
        Backup::failed()
            ->where('created_at', '<', now()->subDay())
            ->chunk(50, function ($backups) use (&$deleted) {
                foreach ($backups as $backup) {
                    $this->delete($backup);
                    $deleted++;
                }
            });

        return $deleted;
    }

    /**
     * Verify a backup file's integrity against its stored SHA-256 checksum.
     */
    public function verifyIntegrity(Backup $backup): bool
    {
        $storedChecksum = $backup->metadata['checksum'] ?? null;

        if (!$storedChecksum || !File::exists($backup->path)) {
            return false;
        }

        return $storedChecksum === 'sha256:' . hash_file('sha256', $backup->path);
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    /**
     * Locate the mysqldump binary, checking PATH first then common local dev paths.
     *
     * @throws RuntimeException When not found
     */
    private function findMysqldumpBinary(): string
    {
        $finder = new ExecutableFinder();
        $found = $finder->find('mysqldump');

        if ($found !== null) {
            return $found;
        }

        // Common local dev paths on Windows
        $patterns = [
            'C:/laragon/bin/mysql/*/bin/mysqldump.exe',
            'C:/xampp/mysql/bin/mysqldump.exe',
            'C:/wamp64/bin/mysql/*/bin/mysqldump.exe',
        ];

        // Try to detect Laragon from the project path
        $basePath = base_path();
        if (preg_match('#([A-Za-z]:[/\\\\].*?[/\\\\]laragon)[/\\\\]#i', $basePath, $m)) {
            array_unshift($patterns, str_replace('\\', '/', $m[1]) . '/bin/mysql/*/bin/mysqldump.exe');
        }

        foreach ($patterns as $pattern) {
            $matches = glob($pattern);
            if (!$matches) {
                continue;
            }
            foreach ($matches as $candidate) {
                if (file_exists($candidate)) {
                    return $candidate;
                }
            }
        }

        throw new RuntimeException(
            'mysqldump not found. Install MySQL client tools or add them to your PATH.'
        );
    }

    /**
     * Copy media files into a temp directory for archiving.
     */
    private function copyMedia(string $targetDir): void
    {
        $mediaSource = storage_path('app/public/media');

        if (!File::isDirectory($mediaSource)) {
            Log::info('No media directory found, skipping media backup.');
            return;
        }

        File::ensureDirectoryExists($targetDir);
        File::copyDirectory($mediaSource, $targetDir);
    }

    /**
     * @throws RuntimeException When the ZIP cannot be created
     */
    private function createZipArchive(string $sourceDir, string $zipPath): void
    {
        $zip = new ZipArchive();
        $result = $zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE);

        if ($result !== true) {
            throw new RuntimeException("Failed to create ZIP archive (error code: {$result})");
        }

        $basePath = rtrim(str_replace('\\', '/', $sourceDir), '/');

        foreach (File::allFiles($sourceDir) as $file) {
            $filePath = str_replace('\\', '/', $file->getPathname());
            $relativePath = ltrim(str_replace($basePath, '', $filePath), '/');
            $zip->addFile($file->getPathname(), $relativePath);
        }

        $zip->close();
    }

    /**
     * Gather system metadata to store alongside the backup record.
     *
     * @return array<string, mixed>
     */
    private function collectMetadata(string $type, string $checksum, int $duration): array
    {
        $dbDriver = config('database.default');

        $metadata = [
            'cms_version' => config('cms.version', '1.0.0'),
            'php_version' => PHP_VERSION,
            'laravel_version' => app()->version(),
            'db_driver' => $dbDriver,
            'db_name' => config("database.connections.{$dbDriver}.database"),
            'checksum' => $checksum,
            'duration_seconds' => $duration,
        ];

        if (in_array($type, ['full', 'database'], true)) {
            $metadata['tables_count'] = $this->getTableCount();
        }

        if (in_array($type, ['full', 'media'], true)) {
            $mediaPath = storage_path('app/public/media');
            if (File::isDirectory($mediaPath)) {
                $files = File::allFiles($mediaPath);
                $metadata['media_files_count'] = count($files);
                $metadata['media_total_size'] = collect($files)->sum(fn (\SplFileInfo $f) => $f->getSize());
            }
        }

        return $metadata;
    }

    /**
     * Get the number of tables in the current database using information_schema
     * (avoids running COUNT(*) on every table just for metadata).
     */
    private function getTableCount(): int
    {
        $dbName = config('database.connections.' . config('database.default') . '.database');

        try {
            $result = DB::selectOne(
                'SELECT COUNT(*) as cnt FROM information_schema.tables WHERE table_schema = ?',
                [$dbName]
            );
            return (int) ($result->cnt ?? 0);
        } catch (\Throwable) {
            return 0;
        }
    }
}
