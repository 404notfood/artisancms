<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\NotificationService;
use App\Services\UpdateService;
use Illuminate\Console\Command;

class AutoUpdate extends Command
{
    protected $signature = 'cms:auto-update';

    protected $description = 'Execute les mises a jour automatiques selon la configuration';

    public function handle(UpdateService $updateService, NotificationService $notificationService): int
    {
        $settings = $updateService->getAutoUpdateSettings();

        if ($settings['auto_update'] === 'disabled' && !$settings['auto_update_plugins'] && !$settings['auto_update_themes']) {
            $this->info('Mises a jour automatiques desactivees.');

            return self::SUCCESS;
        }

        $this->info('Execution des mises a jour automatiques...');

        $logs = $updateService->performAutoUpdates();

        if (empty($logs)) {
            $this->info('Rien a mettre a jour.');

            return self::SUCCESS;
        }

        $success = collect($logs)->where('status', 'completed')->count();
        $failed = collect($logs)->where('status', 'failed')->count();

        $this->info("{$success} mis a jour avec succes, {$failed} echoue(s).");

        // Notify admins
        if ($settings['notify_email'] ?? true) {
            $parts = [];
            foreach ($logs as $log) {
                $status = $log->status === 'completed' ? 'OK' : 'ECHEC';
                $parts[] = "{$log->type}/{$log->slug} v{$log->to_version} ({$status})";
            }

            $notificationService->notifyAdmins(
                type: 'auto_update',
                title: 'Mises a jour automatiques executees',
                message: implode(', ', $parts),
                data: [
                    'success' => $success,
                    'failed' => $failed,
                    'logs' => collect($logs)->map(fn ($l) => [
                        'type' => $l->type,
                        'slug' => $l->slug,
                        'from' => $l->from_version,
                        'to' => $l->to_version,
                        'status' => $l->status,
                    ])->toArray(),
                ],
            );
        }

        return $failed > 0 ? self::FAILURE : self::SUCCESS;
    }
}
