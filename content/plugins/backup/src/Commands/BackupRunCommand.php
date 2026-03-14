<?php

declare(strict_types=1);

namespace Backup\Commands;

use Backup\Services\BackupService;
use Illuminate\Console\Command;

class BackupRunCommand extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'cms:backup:run {--type=full : The type of backup to create (full, database, media)}';

    /**
     * The console command description.
     */
    protected $description = 'Create a new backup of the CMS database and/or media files';

    /**
     * Execute the console command.
     */
    public function handle(BackupService $backupService): int
    {
        $type = $this->option('type');

        if (!in_array($type, ['full', 'database', 'media'], true)) {
            $this->error("Invalid backup type: {$type}. Valid types are: full, database, media.");
            return self::FAILURE;
        }

        $this->info("Starting {$type} backup...");

        try {
            $backup = $backupService->create($type);

            $this->info('Backup completed successfully!');
            $this->table(
                ['Field', 'Value'],
                [
                    ['Filename', $backup->filename],
                    ['Size', $backup->size_for_humans],
                    ['Type', $backup->type],
                    ['Path', $backup->path],
                    ['Duration', ($backup->metadata['duration_seconds'] ?? '?') . 's'],
                ]
            );

            return self::SUCCESS;

        } catch (\Throwable $e) {
            $this->error("Backup failed: {$e->getMessage()}");
            return self::FAILURE;
        }
    }
}
