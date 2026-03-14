<?php

declare(strict_types=1);

namespace Backup\Commands;

use Backup\Models\Backup;
use Backup\Services\RestoreService;
use Illuminate\Console\Command;

class BackupRestoreCommand extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'cms:backup:restore
        {id : The ID of the backup to restore}
        {--force : Skip the confirmation prompt}';

    /**
     * The console command description.
     */
    protected $description = 'Restore the CMS from a previously completed backup';

    /**
     * Execute the console command.
     */
    public function handle(RestoreService $restoreService): int
    {
        $id = $this->argument('id');
        $backup = Backup::find($id);

        if (!$backup) {
            $this->error("Backup not found with ID: {$id}");
            $this->listAvailableBackups();
            return self::FAILURE;
        }

        if (!$backup->isComplete()) {
            $this->error("Backup #{$id} has status '{$backup->status}' and cannot be restored.");
            return self::FAILURE;
        }

        // Display backup details
        $this->warn('You are about to restore the following backup:');
        $this->table(
            ['Field', 'Value'],
            [
                ['ID', (string) $backup->id],
                ['Filename', $backup->filename],
                ['Type', $backup->type],
                ['Size', $backup->size_for_humans],
                ['Created', $backup->created_at?->format('Y-m-d H:i:s') ?? 'N/A'],
                ['CMS Version', $backup->metadata['cms_version'] ?? 'unknown'],
            ]
        );

        $this->warn('WARNING: This will overwrite the current database and media files.');

        if (!$this->option('force') && !$this->confirm('Do you wish to continue?')) {
            $this->info('Restore cancelled.');
            return self::SUCCESS;
        }

        $this->info('Starting restore process...');

        try {
            $restoreService->restore($backup);
            $this->info('Restore completed successfully!');
            $this->info('Please verify your site is working correctly.');
            return self::SUCCESS;

        } catch (\Throwable $e) {
            $this->error("Restore failed: {$e->getMessage()}");
            return self::FAILURE;
        }
    }

    /**
     * Display a list of available completed backups.
     */
    private function listAvailableBackups(): void
    {
        $backups = Backup::completed()
            ->orderByDesc('created_at')
            ->limit(10)
            ->get();

        if ($backups->isEmpty()) {
            $this->info('No completed backups available.');
            return;
        }

        $this->info('Available backups:');
        $this->table(
            ['ID', 'Filename', 'Size', 'Created'],
            $backups->map(fn (Backup $b) => [
                $b->id,
                $b->filename,
                $b->size_for_humans,
                $b->created_at?->format('Y-m-d H:i') ?? 'N/A',
            ])->toArray()
        );
    }
}
