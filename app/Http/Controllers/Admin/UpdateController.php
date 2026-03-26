<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\UpdateLog;
use App\Services\ErrorRecoveryService;
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
}
