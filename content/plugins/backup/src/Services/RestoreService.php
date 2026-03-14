<?php

declare(strict_types=1);

namespace Backup\Services;

use Backup\Models\Backup;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use ZipArchive;

class RestoreService
{
    public function __construct(
        protected BackupService $backupService,
    ) {}

    /**
     * Restore the CMS from a completed backup.
     *
     * Flow:
     *   1. Validate the backup status
     *   2. Verify file integrity
     *   3. Extract the archive to a temp directory
     *   4. Restore database (if applicable)
     *   5. Restore media files (if applicable)
     *   6. Clear caches
     *
     * @throws RuntimeException When the restore process fails
     */
    public function restore(Backup $backup): void
    {
        if ($backup->status !== 'completed') {
            throw new RuntimeException(
                "Cannot restore backup with status '{$backup->status}'."
            );
        }

        if (!File::exists($backup->path)) {
            throw new RuntimeException(
                "Backup file not found at path: {$backup->path}"
            );
        }

        if (!$this->backupService->verifyIntegrity($backup)) {
            throw new RuntimeException(
                'Backup integrity check failed. The file may be corrupted.'
            );
        }

        $tempDir = storage_path('app/temp/restore-' . uniqid());
        File::ensureDirectoryExists($tempDir);

        try {
            $this->extractArchive($backup->path, $tempDir);

            // Restore database
            if (in_array($backup->type, ['full', 'database'], true)) {
                $dumpPath = $tempDir . '/database.sql';

                if (!File::exists($dumpPath)) {
                    throw new RuntimeException(
                        'No database dump file (database.sql) found in backup archive.'
                    );
                }

                $this->restoreDatabase($dumpPath);
            }

            // Restore media files
            if (in_array($backup->type, ['full', 'media'], true)) {
                $mediaDir = $tempDir . '/media';

                if (File::isDirectory($mediaDir)) {
                    $this->restoreMedia($mediaDir);
                } else {
                    Log::warning('No media directory found in backup archive. Skipping media restore.');
                }
            }

            // Clear all caches
            Artisan::call('cache:clear');
            Artisan::call('config:clear');
            Artisan::call('view:clear');

            Log::info("Backup restored successfully: {$backup->filename}");

        } catch (\Throwable $e) {
            Log::error("Restore failed: {$e->getMessage()}", [
                'backup' => $backup->filename,
                'error' => $e->getTraceAsString(),
            ]);

            throw $e;
        } finally {
            File::deleteDirectory($tempDir);
        }
    }

    /**
     * Restore the database from an SQL dump file.
     *
     * Uses the mysql command-line tool with proper escaping.
     *
     * @throws RuntimeException When the import command fails
     */
    public function restoreDatabase(string $dumpPath): void
    {
        $connection = config('database.default');
        $dbConfig = config("database.connections.{$connection}");

        $host = escapeshellarg($dbConfig['host'] ?? '127.0.0.1');
        $port = escapeshellarg((string) ($dbConfig['port'] ?? '3306'));
        $username = escapeshellarg($dbConfig['username'] ?? 'root');
        $password = $dbConfig['password'] ?? '';
        $database = escapeshellarg($dbConfig['database']);
        $inputPath = escapeshellarg($dumpPath);

        // Disable foreign key checks during import
        $command = "mysql --host={$host} --port={$port} --user={$username}";

        if ($password !== '') {
            $command .= ' --password=' . escapeshellarg($password);
        }

        $command .= " {$database} < {$inputPath} 2>&1";

        exec($command, $output, $returnCode);

        if ($returnCode !== 0) {
            $errorOutput = implode("\n", $output);
            throw new RuntimeException(
                "Database restore failed (exit code {$returnCode}): {$errorOutput}"
            );
        }

        // Re-run migrations to ensure the schema is up to date
        Artisan::call('migrate', ['--force' => true]);
    }

    /**
     * Restore media files from the extracted archive directory.
     *
     * The current media directory is renamed as a safety measure before
     * the restored files are copied into place.
     */
    public function restoreMedia(string $archivePath): void
    {
        $mediaDestination = storage_path('app/public/media');

        // Rename the current media directory as a safety backup
        if (File::isDirectory($mediaDestination)) {
            $safetyPath = $mediaDestination . '-pre-restore-' . now()->format('YmdHis');
            File::moveDirectory($mediaDestination, $safetyPath);
        }

        File::ensureDirectoryExists($mediaDestination);
        File::copyDirectory($archivePath, $mediaDestination);
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    /**
     * Extract a ZIP archive into a temporary directory.
     *
     * @throws RuntimeException When the archive cannot be opened
     */
    private function extractArchive(string $archivePath, string $tempDir): void
    {
        $zip = new ZipArchive();
        $result = $zip->open($archivePath);

        if ($result !== true) {
            throw new RuntimeException(
                "Failed to open backup archive. Error code: {$result}"
            );
        }

        $zip->extractTo($tempDir);
        $zip->close();
    }
}
