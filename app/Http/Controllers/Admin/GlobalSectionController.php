<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\GlobalSectionRequest;
use App\Models\GlobalSection;
use App\Services\GlobalSectionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GlobalSectionController extends Controller
{
    public function __construct(
        private readonly GlobalSectionService $globalSectionService,
    ) {}

    /**
     * Display a list of all global sections.
     */
    public function index(Request $request): Response
    {
        $sections = $this->globalSectionService->all([
            'type'   => $request->query('type', ''),
            'search' => $request->query('search', ''),
        ]);

        return Inertia::render('Admin/GlobalSections/Index', [
            'sections' => $sections,
            'filters'  => [
                'type'   => $request->query('type', ''),
                'search' => $request->query('search', ''),
            ],
        ]);
    }

    /**
     * Show the form for creating a new global section.
     */
    public function create(): Response
    {
        return Inertia::render('Admin/GlobalSections/Create');
    }

    /**
     * Store a newly created global section.
     */
    public function store(GlobalSectionRequest $request): RedirectResponse
    {
        $this->globalSectionService->create($request->validated());

        return redirect()
            ->route('admin.global-sections.index')
            ->with('success', __('cms.global_sections.created'));
    }

    /**
     * Show the form for editing a global section.
     */
    public function edit(GlobalSection $globalSection): Response
    {
        return Inertia::render('Admin/GlobalSections/Edit', [
            'section' => $globalSection,
        ]);
    }

    /**
     * Update the specified global section.
     */
    public function update(GlobalSectionRequest $request, GlobalSection $globalSection): RedirectResponse
    {
        $this->globalSectionService->update($globalSection, $request->validated());

        return redirect()
            ->back()
            ->with('success', __('cms.global_sections.updated'));
    }

    /**
     * Delete the specified global section.
     */
    public function destroy(GlobalSection $globalSection): RedirectResponse
    {
        $this->globalSectionService->delete($globalSection);

        return redirect()
            ->route('admin.global-sections.index')
            ->with('success', __('cms.global_sections.deleted'));
    }

    /**
     * Activate a section as the current active header/footer.
     */
    public function activate(GlobalSection $globalSection): RedirectResponse
    {
        $this->globalSectionService->activate($globalSection);

        return redirect()
            ->back()
            ->with('success', __('cms.global_sections.activated'));
    }
}
