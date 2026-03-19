<?php

declare(strict_types=1);

namespace Backup;

use Backup\Commands\BackupCleanupCommand;
use Backup\Commands\BackupRestoreCommand;
use Backup\Commands\BackupRunCommand;
use Backup\Services\BackupService;
use Backup\Services\DatabaseDumper;
use Backup\Services\RestoreService;
use Illuminate\Support\ServiceProvider;

class BackupServiceProvider extends ServiceProvider
{
    /**
     * Register any plugin services.
     */
    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__ . '/../config/backup.php', 'backup');

        $this->app->singleton(DatabaseDumper::class);
        $this->app->singleton(BackupService::class);
        $this->app->singleton(RestoreService::class);
    }

    /**
     * Bootstrap the Backup plugin.
     */
    public function boot(): void
    {
        // Load database migrations
        $this->loadMigrationsFrom(__DIR__ . '/../database/migrations');

        // Load admin routes
        $this->loadRoutesFrom(__DIR__ . '/../routes/admin.php');

        // Register Artisan commands
        if ($this->app->runningInConsole()) {
            $this->commands([
                BackupRunCommand::class,
                BackupCleanupCommand::class,
                BackupRestoreCommand::class,
            ]);
        }
    }
}
