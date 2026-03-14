<?php

declare(strict_types=1);

namespace Backup\Commands;

use Backup\Services\BackupService;
use Illuminate\Console\Command;

class BackupCleanupCommand extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'cms:backup:cleanup';

    /**
     * The console command description.
     */
    protected $description = 'Apply the retention policy and delete old backups';

    /**
     * Execute the console command.
     */
    public function handle(BackupService $backupService): int
    {
        $this->info('Cleaning up old backups...');

        try {
            $deleted = $backupService->cleanup();
            $this->info("Cleanup completed. {$deleted} backup(s) deleted.");
            return self::SUCCESS;

        } catch (\Throwable $e) {
            $this->error("Cleanup failed: {$e->getMessage()}");
            return self::FAILURE;
        }
    }
}
