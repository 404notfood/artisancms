<?php

declare(strict_types=1);

namespace Backup\Services;

use Backup\Models\Backup;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use ZipArchive;

class BackupService
{
    /**
     * Create a new backup.
     *
     * @param string  $type    One of: full, database, media
     * @param int|null $userId The user who triggered the backup (null for CLI / scheduler)
     *
     * @return Backup The created backup record
     *
     * @throws RuntimeException When the backup process fails
     */
    public function create(string $type = 'full', ?int $userId = null): Backup
    {
        $config = config('backup');
        $destination = $config['destination'];
        File::ensureDirectoryExists($destination);

        $timestamp = now()->format('Y-m-d-His');
        $prefix = $config['filename_prefix'];
        $filename = "{$prefix}-{$type}-{$timestamp}.zip";
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

            $tempDir = storage_path('app/temp/backup-' . uniqid());
            File::ensureDirectoryExists($tempDir);

            try {
                // Create database dump if needed
                if (in_array($type, ['full', 'database'], true) && $config['include_database']) {
                    $this->createDatabaseDump($tempDir . '/database.sql');
                }

                // Create media archive content if needed
                if (in_array($type, ['full', 'media'], true) && $config['include_media']) {
                    $this->createMediaArchive($tempDir . '/media');
                }

                // Package everything into a ZIP
                $this->createZipArchive($tempDir, $path);
            } finally {
                // Always clean up the temp directory
                File::deleteDirectory($tempDir);
            }

            $duration = (int) round(microtime(true) - $startTime);
            $size = (int) filesize($path);

            // Validate max size
            $maxSizeBytes = ($config['max_size_mb'] ?? 500) * 1024 * 1024;
            if ($size > $maxSizeBytes) {
                File::delete($path);
                throw new RuntimeException(
                    "Backup size ({$size} bytes) exceeds maximum allowed size ({$maxSizeBytes} bytes)."
                );
            }

            $checksum = 'sha256:' . hash_file('sha256', $path);
            $metadata = $this->collectMetadata($type, $checksum, $duration);

            $backup->markAsCompleted($size, $metadata);

            Log::info("Backup completed: {$filename}", [
                'type' => $type,
                'size' => $size,
                'duration' => $duration,
            ]);

        } catch (\Throwable $e) {
            $backup->markAsFailed($e->getMessage());

            // Clean up partial file if it exists
            if (File::exists($path)) {
                File::delete($path);
            }

            Log::error("Backup failed: {$filename}", [
                'type' => $type,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }

        return $backup;
    }

    /**
     * Create a MySQL database dump at the given path.
     *
     * Uses the mysqldump command-line tool with proper escaping.
     *
     * @throws RuntimeException When the dump command fails
     */
    public function createDatabaseDump(string $path): void
    {
        $connection = config('database.default');
        $dbConfig = config("database.connections.{$connection}");

        $host = escapeshellarg($dbConfig['host'] ?? '127.0.0.1');
        $port = escapeshellarg((string) ($dbConfig['port'] ?? '3306'));
        $username = escapeshellarg($dbConfig['username'] ?? 'root');
        $password = $dbConfig['password'] ?? '';
        $database = escapeshellarg($dbConfig['database']);
        $outputPath = escapeshellarg($path);

        $command = "mysqldump --host={$host} --port={$port} --user={$username}";

        if ($password !== '') {
            $command .= ' --password=' . escapeshellarg($password);
        }

        $command .= " --single-transaction --routines --triggers --add-drop-table {$database} > {$outputPath} 2>&1";

        exec($command, $output, $returnCode);

        if ($returnCode !== 0) {
            $errorOutput = implode("\n", $output);
            throw new RuntimeException("Database dump failed (exit code {$returnCode}): {$errorOutput}");
        }

        if (!File::exists($path) || filesize($path) === 0) {
            throw new RuntimeException('Database dump produced an empty file.');
        }
    }

    /**
     * Copy media files into the given directory for archiving.
     *
     * Copies the contents of storage/app/public/media into the target path.
     */
    public function createMediaArchive(string $path): void
    {
        $mediaSource = storage_path('app/public/media');

        if (!File::isDirectory($mediaSource)) {
            Log::warning('Media directory does not exist. Skipping media backup.');
            return;
        }

        File::ensureDirectoryExists($path);
        File::copyDirectory($mediaSource, $path);
    }

    /**
     * Delete a backup record and its associated file.
     */
    public function delete(Backup $backup): void
    {
        if (File::exists($backup->path)) {
            File::delete($backup->path);
        }

        $backup->delete();
    }

    /**
     * Get all backups with pagination.
     *
     * @return \Illuminate\Contracts\Pagination\LengthAwarePaginator<Backup>
     */
    public function getAll(): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        return Backup::orderByDesc('created_at')->paginate(20);
    }

    /**
     * Get the latest completed backup.
     */
    public function getLatest(): ?Backup
    {
        return Backup::completed()
            ->orderByDesc('created_at')
            ->first();
    }

    /**
     * Apply the retention policy and delete old backups.
     *
     * @return int The number of backups deleted
     */
    public function cleanup(): int
    {
        $deleted = 0;
        $retention = config('backup.retention', [
            'daily' => 7,
            'weekly' => 4,
            'monthly' => 3,
        ]);

        $dailyCutoff = now()->subDays($retention['daily']);
        $weeklyCutoff = now()->subWeeks($retention['weekly']);
        $monthlyCutoff = now()->subMonths($retention['monthly']);

        // Get all completed backups older than daily retention
        $candidates = Backup::completed()
            ->where('created_at', '<', $dailyCutoff)
            ->orderBy('created_at')
            ->get();

        foreach ($candidates as $backup) {
            $dayOfWeek = $backup->created_at->dayOfWeek; // 0=Sunday, 1=Monday
            $dayOfMonth = $backup->created_at->day;

            // Keep weekly backups (Monday) if within weekly retention
            $isWeeklyCandidate = ($dayOfWeek === 1)
                && $backup->created_at->gte($weeklyCutoff);

            // Keep monthly backups (1st of month) if within monthly retention
            $isMonthlyCandidate = ($dayOfMonth === 1)
                && $backup->created_at->gte($monthlyCutoff);

            if (!$isWeeklyCandidate && !$isMonthlyCandidate) {
                $this->delete($backup);
                $deleted++;
            }
        }

        // Delete weekly backups beyond weekly retention (except monthly candidates)
        $weeklyExpired = Backup::completed()
            ->where('created_at', '<', $weeklyCutoff)
            ->orderBy('created_at')
            ->get()
            ->filter(fn (Backup $b) => $b->created_at->dayOfWeek === 1);

        foreach ($weeklyExpired as $backup) {
            $isMonthlyCandidate = ($backup->created_at->day === 1)
                && $backup->created_at->gte($monthlyCutoff);

            if (!$isMonthlyCandidate) {
                $this->delete($backup);
                $deleted++;
            }
        }

        // Delete monthly backups beyond monthly retention
        $monthlyExpired = Backup::completed()
            ->where('created_at', '<', $monthlyCutoff)
            ->orderBy('created_at')
            ->get()
            ->filter(fn (Backup $b) => $b->created_at->day === 1);

        foreach ($monthlyExpired as $backup) {
            $this->delete($backup);
            $deleted++;
        }

        // Delete failed backups older than 24 hours
        $failedExpired = Backup::failed()
            ->where('created_at', '<', now()->subDay())
            ->get();

        foreach ($failedExpired as $backup) {
            $this->delete($backup);
            $deleted++;
        }

        return $deleted;
    }

    /**
     * Verify the integrity of a backup file via SHA-256 checksum.
     */
    public function verifyIntegrity(Backup $backup): bool
    {
        $storedChecksum = $backup->metadata['checksum'] ?? null;

        if ($storedChecksum === null) {
            return false;
        }

        if (!File::exists($backup->path)) {
            return false;
        }

        $currentChecksum = 'sha256:' . hash_file('sha256', $backup->path);

        return $storedChecksum === $currentChecksum;
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    /**
     * Create a ZIP archive from the contents of a temporary directory.
     *
     * @throws RuntimeException When the ZIP archive cannot be created
     */
    private function createZipArchive(string $sourceDir, string $zipPath): void
    {
        $zip = new ZipArchive();
        $result = $zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE);

        if ($result !== true) {
            throw new RuntimeException("Failed to create ZIP archive. Error code: {$result}");
        }

        $files = File::allFiles($sourceDir);

        foreach ($files as $file) {
            $relativePath = str_replace($sourceDir . '/', '', $file->getPathname());
            $zip->addFile($file->getPathname(), $relativePath);
        }

        $zip->close();
    }

    /**
     * Collect system metadata for the backup record.
     *
     * @return array<string, mixed>
     */
    private function collectMetadata(string $type, string $checksum, int $duration): array
    {
        $metadata = [
            'cms_version' => config('cms.version', '1.0.0'),
            'php_version' => PHP_VERSION,
            'laravel_version' => app()->version(),
            'db_driver' => config('database.default'),
            'db_name' => config('database.connections.' . config('database.default') . '.database'),
            'checksum' => $checksum,
            'duration_seconds' => $duration,
        ];

        if (in_array($type, ['full', 'database'], true)) {
            $tables = DB::select('SHOW TABLES');
            $metadata['tables_count'] = count($tables);
            $metadata['total_rows'] = $this->countTotalRows($tables);
        }

        if (in_array($type, ['full', 'media'], true)) {
            $mediaPath = storage_path('app/public/media');
            if (File::isDirectory($mediaPath)) {
                $mediaFiles = File::allFiles($mediaPath);
                $metadata['media_files_count'] = count($mediaFiles);
                $metadata['media_total_size'] = collect($mediaFiles)
                    ->sum(fn (\SplFileInfo $file) => $file->getSize());
            }
        }

        return $metadata;
    }

    /**
     * Count total rows across all database tables.
     *
     * @param array<object> $tables
     */
    private function countTotalRows(array $tables): int
    {
        $total = 0;

        if (empty($tables)) {
            return $total;
        }

        $key = array_key_first((array) $tables[0]);

        foreach ($tables as $table) {
            $name = $table->$key;
            $total += DB::table($name)->count();
        }

        return $total;
    }
}
