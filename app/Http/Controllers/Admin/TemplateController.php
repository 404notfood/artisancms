<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\LegalPageService;
use App\Services\TemplateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TemplateController extends Controller
{
    public function __construct(
        private readonly TemplateService $templateService,
        private readonly LegalPageService $legalPageService,
    ) {}

    /**
     * Display the list of available templates.
     * GET /admin/templates
     */
    public function index(): Response
    {
        $templates = [];
        foreach ($this->templateService->discover() as $slug => $template) {
            $templates[$slug] = $this->templateService->preview($slug) ?? $template;
        }

        return Inertia::render('Admin/Templates/Index', [
            'templates' => $templates,
            'categories' => $this->templateService->listByCategory(),
        ]);
    }

    /**
     * Display template preview / details.
     * GET /admin/templates/{slug}/preview
     */
    public function preview(string $slug): Response
    {
        $template = $this->templateService->preview($slug);

        if ($template === null) {
            abort(404);
        }

        $conflicts = $this->templateService->checkConflicts($slug);

        return Inertia::render('Admin/Templates/Preview', [
            'template' => $template,
            'conflicts' => $conflicts,
        ]);
    }

    /**
     * Get template details (pages, menus, settings, theme) for selective install modal.
     * GET /admin/templates/{slug}/pages
     */
    public function pages(string $slug): JsonResponse
    {
        $details = $this->templateService->getTemplateDetails($slug);

        if ($details === null) {
            abort(404);
        }

        return response()->json($details);
    }

    /**
     * Install a template with selective options.
     * POST /admin/templates/{slug}/install
     */
    public function install(Request $request, string $slug): RedirectResponse
    {
        $validated = $request->validate([
            'overwrite' => ['sometimes', 'boolean'],
            'pages' => ['sometimes', 'array'],
            'pages.*' => ['string'],
            'install_menus' => ['sometimes', 'boolean'],
            'install_settings' => ['sometimes', 'boolean'],
            'install_theme' => ['sometimes', 'boolean'],
            'heading_font' => ['sometimes', 'nullable', 'string', 'max:100'],
            'body_font' => ['sometimes', 'nullable', 'string', 'max:100'],
            'primary_color' => ['sometimes', 'nullable', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'heading_color' => ['sometimes', 'nullable', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'text_color' => ['sometimes', 'nullable', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'include_legal_pages' => ['sometimes', 'boolean'],
            'typography_preset' => ['sometimes', 'nullable', 'string', 'max:50'],
            'typography_config' => ['sometimes', 'nullable', 'array'],
            'typography_config.headingFont' => ['sometimes', 'string', 'max:100'],
            'typography_config.bodyFont' => ['sometimes', 'string', 'max:100'],
            'typography_config.scale' => ['sometimes', 'array'],
            'animation_preset' => ['sometimes', 'nullable', 'string', 'max:50'],
            'animation_config' => ['sometimes', 'nullable', 'array'],
        ]);

        try {
            $report = $this->templateService->install(
                $slug,
                (int) $request->user()->id,
                [
                    'overwrite' => $validated['overwrite'] ?? false,
                    'pages' => $validated['pages'] ?? null,
                    'install_menus' => $validated['install_menus'] ?? true,
                    'install_settings' => $validated['install_settings'] ?? true,
                    'install_theme' => $validated['install_theme'] ?? true,
                    'heading_font' => $validated['heading_font'] ?? null,
                    'body_font' => $validated['body_font'] ?? null,
                    'primary_color' => $validated['primary_color'] ?? null,
                    'heading_color' => $validated['heading_color'] ?? null,
                    'text_color' => $validated['text_color'] ?? null,
                    'include_legal_pages' => $validated['include_legal_pages'] ?? false,
                    'typography_preset' => $validated['typography_preset'] ?? null,
                    'typography_config' => $validated['typography_config'] ?? null,
                    'animation_preset' => $validated['animation_preset'] ?? null,
                    'animation_config' => $validated['animation_config'] ?? null,
                ],
            );

            return redirect()
                ->route('admin.templates.index')
                ->with('success', __('cms.templates.installed', [
                    'name' => $report['template'],
                    'pages' => $report['pages_created'],
                ]));
        } catch (\Exception $e) {
            return redirect()
                ->back()
                ->with('error', __('cms.templates.install_failed', [
                    'error' => $e->getMessage(),
                ]));
        }
    }

    /**
     * Export the current site content as a template.
     * POST /admin/templates/export
     */
    public function export(Request $request): RedirectResponse
    {
        try {
            $report = $this->templateService->export(
                (int) $request->user()->id,
            );

            return redirect()
                ->route('admin.templates.index')
                ->with('success', __('cms.templates.exported', [
                    'slug' => $report['slug'],
                    'pages' => $report['pages_exported'],
                ]));
        } catch (\Exception $e) {
            return redirect()
                ->back()
                ->with('error', __('cms.templates.export_failed', [
                    'error' => $e->getMessage(),
                ]));
        }
    }
}
