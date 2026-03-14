<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\TemplateService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TemplateController extends Controller
{
    public function __construct(
        private readonly TemplateService $templateService,
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
     * Install a template.
     * POST /admin/templates/{slug}/install
     */
    public function install(Request $request, string $slug): RedirectResponse
    {
        $validated = $request->validate([
            'overwrite' => ['sometimes', 'boolean'],
        ]);

        try {
            $report = $this->templateService->install(
                $slug,
                (int) $request->user()->id,
                ['overwrite' => $validated['overwrite'] ?? false],
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
