<?php

declare(strict_types=1);

namespace Backup\Http\Controllers;

use App\CMS\Facades\CMS;
use App\Http\Controllers\Controller;
use Backup\Models\Backup;
use Backup\Services\BackupService;
use Backup\Services\RestoreService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class BackupController extends Controller
{
    public function __construct(
        protected BackupService $backupService,
        protected RestoreService $restoreService,
    ) {}

    /**
     * Display a paginated list of all backups.
     */
    public function index(): Response
    {
        abort_unless(auth()->user()?->isAdmin(), 403);

        $backups = Backup::with('creator')
            ->orderByDesc('created_at')
            ->paginate(20)
            ->through(fn (Backup $backup) => [
                'id' => $backup->id,
                'filename' => $backup->filename,
                'type' => $backup->type,
                'status' => $backup->status,
                'size' => $backup->size_for_humans,
                'disk' => $backup->disk,
                'created_at' => $backup->created_at?->format('Y-m-d H:i'),
                'completed_at' => $backup->completed_at?->format('Y-m-d H:i'),
                'error_message' => $backup->error_message,
                'creator' => $backup->creator?->name,
            ]);

        $stats = [
            'total_backups' => Backup::completed()->count(),
            'total_size' => Backup::completed()->sum('size'),
            'last_backup' => Backup::completed()
                ->orderByDesc('created_at')
                ->first()
                ?->created_at
                ?->format('Y-m-d H:i'),
            'failed_count' => Backup::failed()
                ->where('created_at', '>=', now()->subWeek())
                ->count(),
        ];

        return Inertia::render('Admin/Backups/Index', [
            'backups' => $backups,
            'stats' => $stats,
        ]);
    }

    /**
     * Trigger a new manual backup.
     */
    public function create(Request $request): RedirectResponse
    {
        abort_unless(auth()->user()?->isAdmin(), 403);

        $validated = $request->validate([
            'type' => ['sometimes', 'string', 'in:full,database,media'],
        ]);

        $type = $validated['type'] ?? 'full';

        $this->backupService->create($type, $request->user()?->id);

        return redirect()
            ->route('admin.backups.index')
            ->with('message', __('Backup created successfully.'));
    }

    /**
     * Download a completed backup file.
     */
    public function download(Backup $backup): BinaryFileResponse|RedirectResponse
    {
        abort_unless(auth()->user()?->isAdmin(), 403);

        if (!$backup->isComplete()) {
            return redirect()
                ->route('admin.backups.index')
                ->with('error', __('Only completed backups can be downloaded.'));
        }

        if (!file_exists($backup->path)) {
            return redirect()
                ->route('admin.backups.index')
                ->with('error', __('Backup file not found on disk.'));
        }

        return response()->download($backup->path, $backup->filename);
    }

    /**
     * Trigger a restore from a completed backup.
     */
    public function restore(Backup $backup): RedirectResponse
    {
        abort_unless(auth()->user()?->isAdmin(), 403);

        if (!$backup->isComplete()) {
            return redirect()
                ->route('admin.backups.index')
                ->with('error', __('Only completed backups can be restored.'));
        }

        try {
            $this->restoreService->restore($backup);
        } catch (\Throwable $e) {
            return redirect()
                ->route('admin.backups.index')
                ->with('error', __('Restore failed: ') . $e->getMessage());
        }

        return redirect()
            ->route('admin.backups.index')
            ->with('message', __('Backup restored successfully.'));
    }

    /**
     * Delete a backup record and its file.
     */
    public function destroy(Backup $backup): RedirectResponse
    {
        abort_unless(auth()->user()?->isAdmin(), 403);

        $this->backupService->delete($backup);

        return redirect()
            ->route('admin.backups.index')
            ->with('message', __('Backup deleted successfully.'));
    }
}
