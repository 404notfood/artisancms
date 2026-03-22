<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\BrandingImportRequest;
use App\Http\Requests\BrandingUpdateRequest;
use App\Services\BrandingService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class BrandingController extends Controller
{
    public function __construct(
        private readonly BrandingService $branding,
    ) {}

    /**
     * Show branding settings page.
     */
    public function index(): Response
    {
        return Inertia::render('Admin/Branding/Index', [
            'branding' => $this->branding->all(),
        ]);
    }

    /**
     * Update branding settings.
     */
    public function update(BrandingUpdateRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $this->branding->update($validated);

        return redirect()
            ->back()
            ->with('success', __('cms.branding.updated'));
    }

    /**
     * Export branding config as JSON download.
     */
    public function export(): StreamedResponse
    {
        $data = $this->branding->export();

        return response()->streamDownload(function () use ($data): void {
            echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        }, 'branding-config.json', [
            'Content-Type' => 'application/json',
        ]);
    }

    /**
     * Import branding config from JSON upload.
     */
    public function import(BrandingImportRequest $request): RedirectResponse
    {
        $content = file_get_contents($request->file('file')->getRealPath());
        $data = json_decode($content, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            return redirect()
                ->back()
                ->with('error', __('cms.branding.invalid_json'));
        }

        $this->branding->import($data);

        return redirect()
            ->back()
            ->with('success', __('cms.branding.imported'));
    }

    /**
     * Reset branding to defaults.
     */
    public function reset(): RedirectResponse
    {
        $this->branding->reset();

        return redirect()
            ->back()
            ->with('success', __('cms.branding.reset'));
    }
}
