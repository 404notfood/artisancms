<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\BrandingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'brand_name' => ['nullable', 'string', 'max:100'],
            'brand_logo' => ['nullable', 'string', 'max:500'],
            'brand_logo_dark' => ['nullable', 'string', 'max:500'],
            'brand_favicon' => ['nullable', 'string', 'max:500'],
            'brand_color_primary' => ['nullable', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'brand_color_accent' => ['nullable', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'brand_login_bg' => ['nullable', 'string', 'max:500'],
            'brand_login_message' => ['nullable', 'string', 'max:500'],
            'brand_show_credit' => ['nullable', 'boolean'],
            'brand_custom_css' => ['nullable', 'string', 'max:10000'],
            'brand_footer_text' => ['nullable', 'string', 'max:500'],
        ]);

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
    public function import(Request $request): RedirectResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:json', 'max:1024'],
        ]);

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
