<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\ConfigExportService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ConfigController extends Controller
{
    public function __construct(
        private readonly ConfigExportService $configExportService,
    ) {}

    /**
     * Download the full site configuration as a JSON file.
     */
    public function export(): StreamedResponse
    {
        $json = $this->configExportService->exportToJson();
        $filename = sprintf('artisancms-config-%s.json', now()->format('Y-m-d-His'));

        return response()->streamDownload(function () use ($json): void {
            echo $json;
        }, $filename, [
            'Content-Type' => 'application/json',
        ]);
    }

    /**
     * Import site configuration from an uploaded JSON file.
     */
    public function import(Request $request): RedirectResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:json,txt|max:10240',
            'mode' => 'sometimes|in:merge,replace',
        ]);

        $content = (string) file_get_contents($request->file('file')->getRealPath());
        $data = json_decode($content, true);

        if (!is_array($data)) {
            return redirect()
                ->back()
                ->with('error', __('cms.config.invalid_json'));
        }

        try {
            $summary = $this->configExportService->import($data, [
                'mode' => $request->input('mode', 'merge'),
            ]);
        } catch (\Throwable $e) {
            return redirect()
                ->back()
                ->with('error', __('cms.config.import_failed') . ': ' . $e->getMessage());
        }

        $parts = [];
        foreach ($summary as $section => $count) {
            if ($count > 0) {
                $parts[] = "{$section}: {$count}";
            }
        }

        $message = !empty($parts)
            ? __('cms.config.import_success') . ' — ' . implode(', ', $parts)
            : __('cms.config.nothing_imported');

        return redirect()
            ->back()
            ->with('success', $message);
    }
}
