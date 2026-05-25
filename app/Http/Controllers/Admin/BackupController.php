<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Backup;
use App\Services\ActivityLogService;
use App\Services\BackupService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class BackupController extends Controller
{
    public function __construct(
        private readonly BackupService $backupService,
        private readonly ActivityLogService $activityLogService,
    ) {}

    public function index(): Response
    {
        $backups = Backup::with('creator')
            ->latest()
            ->paginate(20)
            ->through(fn (Backup $backup) => [
                'id' => $backup->id,
                'filename' => $backup->filename,
                'type' => $backup->type,
                'status' => $backup->status,
                'size' => $this->formatBytes($backup->size),
                'disk' => $backup->disk,
                'created_at' => $backup->created_at?->toDateTimeString(),
                'completed_at' => $backup->completed_at?->toDateTimeString(),
                'error_message' => $backup->error_message,
                'creator' => $backup->creator?->name,
            ]);

        return Inertia::render('Admin/Backups/Index', [
            'backups' => $backups,
            'stats' => [
                'total_backups' => Backup::count(),
                'total_size' => Backup::where('status', 'completed')->sum('size'),
                'last_backup' => Backup::where('status', 'completed')->latest('completed_at')->first()?->completed_at?->toDateTimeString(),
                'failed_count' => Backup::where('status', 'failed')->where('created_at', '>=', now()->subDays(7))->count(),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'type' => ['required', 'string', 'in:full,database,media'],
        ]);

        try {
            $this->backupService->create($data['type']);

            return back()->with('success', 'Sauvegarde creee.');
        } catch (\Throwable $e) {
            return back()->with('error', 'Sauvegarde impossible : ' . $e->getMessage());
        }
    }

    public function download(Backup $backup): StreamedResponse|RedirectResponse
    {
        if ($backup->status !== 'completed' || !Storage::disk($backup->disk)->exists($backup->path)) {
            return back()->with('error', 'Fichier de sauvegarde introuvable.');
        }

        $this->activityLogService->logBackup('backup_downloaded', [
            'backup_id' => $backup->id,
            'filename' => $backup->filename,
            'type' => $backup->type,
        ]);

        return Storage::disk($backup->disk)->download($backup->path, $backup->filename);
    }

    public function restore(Backup $backup): RedirectResponse
    {
        try {
            $this->backupService->restore($backup);

            return back()->with('success', 'Sauvegarde restauree.');
        } catch (\Throwable $e) {
            return back()->with('error', 'Restauration impossible : ' . $e->getMessage());
        }
    }

    public function destroy(Backup $backup): RedirectResponse
    {
        Storage::disk($backup->disk)->delete($backup->path);
        $metadata = [
            'backup_id' => $backup->id,
            'filename' => $backup->filename,
            'type' => $backup->type,
            'size' => $backup->size,
        ];
        $backup->delete();

        $this->activityLogService->logBackup('backup_deleted', $metadata);

        return back()->with('success', 'Sauvegarde supprimee.');
    }

    private function formatBytes(int $bytes): string
    {
        if ($bytes <= 0) {
            return '0 B';
        }

        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $power = min((int) floor(log($bytes, 1024)), count($units) - 1);

        return round($bytes / (1024 ** $power), 1) . ' ' . $units[$power];
    }
}
