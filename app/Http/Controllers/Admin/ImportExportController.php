<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\ImportExportService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ImportExportController extends Controller
{
    public function __construct(
        private readonly ImportExportService $importExportService,
    ) {}

    /**
     * Display the import/export page.
     */
    public function index(): Response
    {
        return Inertia::render('Admin/ImportExport/Index');
    }

    /**
     * Export content as JSON download.
     */
    public function export(Request $request): StreamedResponse
    {
        $type = $request->input('type', 'all');

        $data = match ($type) {
            'pages' => ['pages' => $this->importExportService->exportPages()],
            'posts' => ['posts' => $this->importExportService->exportPosts()],
            'menus' => ['menus' => $this->importExportService->exportMenus()],
            'settings' => ['settings' => $this->importExportService->exportSettings()],
            default => $this->importExportService->exportAll(),
        };

        $filename = sprintf('artisancms-export-%s-%s.json', $type, now()->format('Y-m-d-His'));

        return response()->streamDownload(function () use ($data) {
            echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        }, $filename, [
            'Content-Type' => 'application/json',
        ]);
    }

    /**
     * Import content from uploaded file (JSON or WordPress XML).
     */
    public function import(Request $request): RedirectResponse
    {
        $request->validate([
            'file' => 'required|file|max:51200',
            'format' => 'required|in:json,wordpress',
        ]);

        $file = $request->file('file');
        $format = $request->input('format');
        $content = (string) file_get_contents($file->getRealPath());

        if ($format === 'wordpress') {
            $results = $this->importExportService->importFromWordPress($content);
        } else {
            $data = json_decode($content, true);

            if (!is_array($data)) {
                return redirect()
                    ->back()
                    ->with('error', __('cms.import_export.invalid_json'));
            }

            $results = $this->importExportService->importAll($data);
        }

        // Build summary message
        $summary = [];
        foreach ($results as $type => $stats) {
            if ($stats['created'] > 0) {
                $summary[] = sprintf('%d %s importé(s)', $stats['created'], $type);
            }
            if (!empty($stats['errors'])) {
                $summary[] = sprintf('%d erreur(s) pour %s', count($stats['errors']), $type);
            }
        }

        $message = !empty($summary)
            ? implode(', ', $summary)
            : __('cms.import_export.nothing_imported');

        return redirect()
            ->back()
            ->with('success', $message);
    }
}
