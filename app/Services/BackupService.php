<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Backup;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use PharData;
use RuntimeException;

class BackupService
{
    public function __construct(
        private readonly ActivityLogService $activityLogService,
    ) {}

    public function create(string $type): Backup
    {
        if (!in_array($type, ['full', 'database', 'media'], true)) {
            throw new RuntimeException('Type de sauvegarde invalide.');
        }

        $timestamp = now()->format('Y-m-d_His');
        $filename = "articms-{$type}-{$timestamp}.tar";
        $relativePath = "backups/{$filename}";

        $backup = Backup::create([
            'filename' => $filename,
            'path' => $relativePath,
            'disk' => 'local',
            'type' => $type,
            'status' => 'running',
            'created_by' => Auth::id(),
        ]);

        try {
            $absolutePath = Storage::disk('local')->path($relativePath);
            File::ensureDirectoryExists(dirname($absolutePath));

            if (File::exists($absolutePath)) {
                File::delete($absolutePath);
            }

            $archive = new PharData($absolutePath);
            $archive->addFromString('manifest.json', json_encode([
                'app' => config('app.name'),
                'url' => config('app.url'),
                'type' => $type,
                'created_at' => now()->toIso8601String(),
                'database' => config('database.default'),
            ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) ?: '{}');

            if (in_array($type, ['full', 'database'], true)) {
                $archive->addFromString('database.sql', $this->exportDatabaseSql());
            }

            if (in_array($type, ['full', 'media'], true)) {
                $this->addDirectory($archive, storage_path('app/public'), 'storage');
                $this->addDirectory($archive, public_path('storage'), 'public-storage');
            }

            $backup->update([
                'status' => 'completed',
                'size' => File::size($absolutePath),
                'completed_at' => now(),
            ]);

            $this->activityLogService->logBackup('backup_created', [
                'type' => $type,
                'filename' => $filename,
                'size' => $backup->size,
            ]);

            return $backup->refresh();
        } catch (\Throwable $e) {
            $backup->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    public function restore(Backup $backup): void
    {
        if ($backup->status !== 'completed') {
            throw new RuntimeException('Cette sauvegarde n est pas restauree car elle est incomplete.');
        }

        $absolutePath = Storage::disk($backup->disk)->path($backup->path);
        if (!File::exists($absolutePath)) {
            throw new RuntimeException('Le fichier de sauvegarde est introuvable.');
        }

        $extractPath = storage_path('app/tmp/restore-' . $backup->id . '-' . time());
        File::ensureDirectoryExists($extractPath);

        $archive = new PharData($absolutePath);
        $archive->extractTo($extractPath, null, true);

        try {
            $databaseSql = $extractPath . DIRECTORY_SEPARATOR . 'database.sql';
            if (File::exists($databaseSql)) {
                $this->importDatabaseSql(File::get($databaseSql));
            }

            $storageDir = $extractPath . DIRECTORY_SEPARATOR . 'storage';
            if (File::isDirectory($storageDir)) {
                File::copyDirectory($storageDir, storage_path('app/public'));
            }

            $publicStorageDir = $extractPath . DIRECTORY_SEPARATOR . 'public-storage';
            if (File::isDirectory($publicStorageDir)) {
                File::copyDirectory($publicStorageDir, public_path('storage'));
            }

            $this->activityLogService->logBackup('backup_restored', [
                'backup_id' => $backup->id,
                'type' => $backup->type,
                'filename' => $backup->filename,
            ]);
        } finally {
            File::deleteDirectory($extractPath);
        }
    }

    private function exportDatabaseSql(): string
    {
        $sql = "-- ArtisanCMS database backup\n";
        $sql .= '-- Created at ' . now()->toDateTimeString() . "\n\n";
        $sql .= "SET FOREIGN_KEY_CHECKS=0;\n\n";

        foreach ($this->tables() as $table) {
            $create = DB::selectOne("SHOW CREATE TABLE `{$table}`");
            $createSql = (array) $create;
            $statement = end($createSql);

            $sql .= "DROP TABLE IF EXISTS `{$table}`;\n";
            $sql .= $statement . ";\n\n";

            DB::table($table)->orderByRaw('1')->chunk(500, function ($rows) use (&$sql, $table): void {
                foreach ($rows as $row) {
                    $values = array_map(fn ($value) => $this->sqlValue($value), (array) $row);
                    $columns = implode('`, `', array_keys((array) $row));
                    $sql .= "INSERT INTO `{$table}` (`{$columns}`) VALUES (" . implode(', ', $values) . ");\n";
                }
            });

            $sql .= "\n";
        }

        return $sql . "SET FOREIGN_KEY_CHECKS=1;\n";
    }

    /**
     * @return list<string>
     */
    private function tables(): array
    {
        $database = config('database.connections.' . config('database.default') . '.database');

        return collect(DB::select('SHOW TABLES'))
            ->map(fn ($row) => array_values((array) $row)[0] ?? null)
            ->filter(fn ($table) => is_string($table) && Schema::hasTable($table) && $table !== 'migrations')
            ->values()
            ->all();
    }

    private function sqlValue(mixed $value): string
    {
        if ($value === null) {
            return 'NULL';
        }

        if (is_bool($value)) {
            return $value ? '1' : '0';
        }

        if (is_int($value) || is_float($value)) {
            return (string) $value;
        }

        return DB::getPdo()->quote((string) $value);
    }

    private function importDatabaseSql(string $sql): void
    {
        DB::unprepared($sql);
    }

    private function addDirectory(PharData $archive, string $sourcePath, string $zipPrefix): void
    {
        if (!File::isDirectory($sourcePath)) {
            return;
        }

        foreach (File::allFiles($sourcePath) as $file) {
            $relative = str_replace('\\', '/', $file->getRelativePathname());
            $archive->addFile($file->getPathname(), trim($zipPrefix, '/') . '/' . $relative);
        }
    }
}
