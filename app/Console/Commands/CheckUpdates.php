<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\NotificationService;
use App\Services\UpdateService;
use Illuminate\Console\Command;

class CheckUpdates extends Command
{
    protected $signature = 'cms:check-updates
                            {--notify : Envoyer une notification aux admins si des mises a jour sont disponibles}
                            {--force : Ignorer le cache et forcer la verification}';

    protected $description = 'Verifie les mises a jour disponibles pour le CMS, les plugins et les themes';

    public function handle(UpdateService $updateService, NotificationService $notificationService): int
    {
        $this->info('Verification des mises a jour...');

        $updates = $this->option('force')
            ? $updateService->forceCheck()
            : $updateService->checkForUpdates();

        $cms = $updates['cms'] ?? [];
        if ($cms['available'] ?? false) {
            $this->warn("  CMS : {$cms['current']} -> {$cms['latest']}");
        } else {
            $this->info("  CMS : {$cms['current']} (a jour)");
        }

        $pluginUpdates = 0;
        foreach ($updates['plugins'] ?? [] as $plugin) {
            if ($plugin['available'] ?? false) {
                $this->warn("  Plugin {$plugin['name']} : {$plugin['current']} -> {$plugin['latest']}");
                $pluginUpdates++;
            }
        }
        if ($pluginUpdates === 0) {
            $this->info('  Plugins : tous a jour');
        }

        $themeUpdates = 0;
        foreach ($updates['themes'] ?? [] as $theme) {
            if ($theme['available'] ?? false) {
                $this->warn("  Theme {$theme['name']} : {$theme['current']} -> {$theme['latest']}");
                $themeUpdates++;
            }
        }
        if ($themeUpdates === 0) {
            $this->info('  Themes : tous a jour');
        }

        $totalUpdates = (($cms['available'] ?? false) ? 1 : 0) + $pluginUpdates + $themeUpdates;

        if ($this->option('notify') && $totalUpdates > 0) {
            $parts = [];
            if ($cms['available'] ?? false) {
                $parts[] = "CMS v{$cms['latest']}";
            }
            if ($pluginUpdates > 0) {
                $parts[] = "{$pluginUpdates} plugin(s)";
            }
            if ($themeUpdates > 0) {
                $parts[] = "{$themeUpdates} theme(s)";
            }

            $notificationService->notifyAdmins(
                type: 'update',
                title: "{$totalUpdates} mise(s) a jour disponible(s)",
                message: 'Mises a jour : ' . implode(', ', $parts) . '. Rendez-vous dans Systeme > Mises a jour.',
                data: [
                    'total' => $totalUpdates,
                    'cms' => $cms['available'] ?? false,
                    'plugins' => $pluginUpdates,
                    'themes' => $themeUpdates,
                    'urgent' => $cms['urgent'] ?? false,
                ],
            );

            $this->info('Notification envoyee aux administrateurs.');
        }

        $this->newLine();
        $totalUpdates === 0
            ? $this->info('Tout est a jour !')
            : $this->warn("{$totalUpdates} mise(s) a jour disponible(s).");

        return self::SUCCESS;
    }
}
