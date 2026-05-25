<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Backup;
use App\Models\UpdateLog;
use App\Services\ErrorRecoveryService;
use App\Services\HealthCheckService;
use App\Services\SettingService;
use App\Services\UpdateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UpdateController extends Controller
{
    public function __construct(
        private readonly UpdateService $updateService,
        private readonly ErrorRecoveryService $recoveryService,
        private readonly SettingService $settingService,
        private readonly HealthCheckService $healthCheckService,
    ) {}

    public function index(): Response
    {
        $updates = $this->updateService->checkForUpdates();
        $history = $this->updateService->getHistory();
        $health = $this->recoveryService->getHealthStatus();
        $settings = $this->updateService->getAutoUpdateSettings();

        return Inertia::render('Admin/Updates/Index', [
            'updates' => $updates,
            'history' => $history,
            'health' => $health,
            'settings' => $settings,
            'maintenance' => $this->maintenancePayload(),
            'preflight' => $this->preflightPayload(),
        ]);
    }

    public function check(): JsonResponse
    {
        $updates = $this->updateService->forceCheck();

        return response()->json($updates);
    }

    /**
     * Update a specific plugin.
     */
    public function updatePlugin(Request $request, string $slug): JsonResponse
    {
        try {
            $log = $this->updateService->updatePlugin($slug);

            return response()->json([
                'success' => true,
                'message' => "Plugin « {$slug} » mis à jour avec succès.",
                'log' => $log,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Update a specific theme.
     */
    public function updateTheme(Request $request, string $slug): JsonResponse
    {
        try {
            $log = $this->updateService->updateTheme($slug);

            return response()->json([
                'success' => true,
                'message' => "Thème « {$slug} » mis à jour avec succès.",
                'log' => $log,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Update all plugins and themes that have available updates.
     */
    public function updateAll(): JsonResponse
    {
        $updates = $this->updateService->checkForUpdates();
        $results = ['success' => [], 'failed' => []];

        foreach ($updates['plugins'] as $plugin) {
            if (!($plugin['available'] ?? false)) {
                continue;
            }
            try {
                $this->updateService->updatePlugin($plugin['slug']);
                $results['success'][] = $plugin['slug'];
            } catch (\Throwable $e) {
                $results['failed'][] = ['slug' => $plugin['slug'], 'error' => $e->getMessage()];
            }
        }

        foreach ($updates['themes'] as $theme) {
            if (!($theme['available'] ?? false)) {
                continue;
            }
            try {
                $this->updateService->updateTheme($theme['slug']);
                $results['success'][] = $theme['slug'];
            } catch (\Throwable $e) {
                $results['failed'][] = ['slug' => $theme['slug'], 'error' => $e->getMessage()];
            }
        }

        return response()->json([
            'success' => count($results['failed']) === 0,
            'message' => count($results['success']) . ' mis à jour, ' . count($results['failed']) . ' échoué(s).',
            'results' => $results,
        ]);
    }

    /**
     * Rollback a completed/failed update.
     */
    public function rollback(UpdateLog $updateLog): JsonResponse
    {
        $success = $this->updateService->rollback($updateLog);

        return response()->json([
            'success' => $success,
            'message' => $success
                ? 'Restauration effectuée avec succès.'
                : 'Impossible de restaurer — sauvegarde introuvable.',
        ]);
    }

    /**
     * Get auto-update settings.
     */
    public function settings(): JsonResponse
    {
        return response()->json($this->updateService->getAutoUpdateSettings());
    }

    /**
     * Save auto-update settings.
     */
    public function updateSettings(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'auto_update' => ['required', 'in:disabled,minor,all'],
            'auto_update_plugins' => ['required', 'boolean'],
            'auto_update_themes' => ['required', 'boolean'],
            'notify_email' => ['required', 'boolean'],
        ]);

        $this->updateService->saveAutoUpdateSettings($validated);

        return response()->json(['success' => true, 'message' => 'Paramètres sauvegardés.']);
    }

    public function toggleSafeMode(Request $request): JsonResponse
    {
        if ($this->recoveryService->isSafeMode()) {
            $this->recoveryService->disableSafeMode();

            return response()->json(['safe_mode' => false, 'message' => 'Safe mode désactivé.']);
        }

        $this->recoveryService->enableSafeMode();

        return response()->json(['safe_mode' => true, 'message' => 'Safe mode activé.']);
    }

    public function generateRecoveryToken(): JsonResponse
    {
        $token = $this->recoveryService->generateRecoveryToken();

        return response()->json([
            'token' => $token,
            'url' => url('/admin?recovery_token=' . $token),
        ]);
    }

    public function toggleMaintenance(Request $request): JsonResponse
    {
        $data = $request->validate([
            'enabled' => ['required', 'boolean'],
            'message' => ['nullable', 'string', 'max:1000'],
        ]);

        $this->settingService->set('maintenance.enabled', $data['enabled'], 'boolean');

        if (array_key_exists('message', $data) && $data['message'] !== null) {
            $this->settingService->set('maintenance.message', $data['message'], 'textarea');
        }

        return response()->json([
            'success' => true,
            'maintenance' => $this->maintenancePayload(),
            'message' => $data['enabled'] ? 'Mode maintenance active.' : 'Mode maintenance desactive.',
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function maintenancePayload(): array
    {
        return [
            'enabled' => (bool) $this->settingService->get('maintenance.enabled', false),
            'message' => (string) $this->settingService->get('maintenance.message', 'Site en maintenance. Nous revenons bientot.'),
            'allowed_ips' => $this->settingService->get('maintenance.allowed_ips', []),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function preflightPayload(): array
    {
        $health = $this->healthCheckService->runAll();
        $lastBackup = Backup::where('status', 'completed')->latest('completed_at')->first();

        return [
            'health_overall' => $health['overall'],
            'checks' => $health['checks'],
            'last_backup' => $lastBackup?->completed_at?->toDateTimeString(),
            'last_backup_size' => $lastBackup?->size,
            'has_recent_backup' => $lastBackup?->completed_at?->greaterThan(now()->subDay()) ?? false,
            'config_cached' => app()->configurationIsCached(),
            'routes_cached' => app()->routesAreCached(),
        ];
    }
}
