<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
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

        return Inertia::render('Admin/Updates/Index', [
            'updates' => $updates,
            'history' => $history,
            'health' => $health,
        ]);
    }

    public function check(): JsonResponse
    {
        $updates = $this->updateService->checkForUpdates();

        return response()->json($updates);
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
