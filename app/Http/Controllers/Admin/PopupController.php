<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Popup;
use App\Services\PopupService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PopupController extends Controller
{
    public function __construct(
        private readonly PopupService $popupService,
    ) {}

    /**
     * Display a list of all popups.
     */
    public function index(): Response
    {
        return Inertia::render('Admin/Popups/Index', [
            'popups' => $this->popupService->getAll(),
        ]);
    }

    /**
     * Show the form for creating a new popup.
     */
    public function create(): Response
    {
        return Inertia::render('Admin/Popups/Create');
    }

    /**
     * Store a newly created popup.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate($this->rules());

        $this->popupService->create($validated);

        return redirect()
            ->route('admin.popups.index')
            ->with('success', __('cms.popups.created'));
    }

    /**
     * Show the form for editing a popup.
     */
    public function edit(Popup $popup): Response
    {
        return Inertia::render('Admin/Popups/Create', [
            'popup' => $popup,
        ]);
    }

    /**
     * Update the specified popup.
     */
    public function update(Request $request, Popup $popup): RedirectResponse
    {
        $validated = $request->validate($this->rules());

        $this->popupService->update($popup, $validated);

        return redirect()
            ->route('admin.popups.index')
            ->with('success', __('cms.popups.updated'));
    }

    /**
     * Delete the specified popup.
     */
    public function destroy(Popup $popup): RedirectResponse
    {
        $this->popupService->delete($popup);

        return redirect()
            ->route('admin.popups.index')
            ->with('success', __('cms.popups.deleted'));
    }

    /**
     * Validation rules for popup.
     *
     * @return array<string, mixed>
     */
    private function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'title' => 'nullable|string|max:255',
            'content' => 'nullable|string|max:65535',
            'type' => 'required|in:modal,banner,slide-in',
            'trigger' => 'required|in:page_load,exit_intent,scroll,delay',
            'trigger_value' => 'nullable|string|max:50',
            'display_frequency' => 'required|in:always,once,once_per_session',
            'pages' => 'nullable|array',
            'pages.*' => 'string|max:255',
            'cta_text' => 'nullable|string|max:255',
            'cta_url' => 'nullable|string|max:2048',
            'style' => 'nullable|array',
            'style.backgroundColor' => 'nullable|string|max:50',
            'style.textColor' => 'nullable|string|max:50',
            'style.position' => 'nullable|string|max:50',
            'active' => 'boolean',
            'starts_at' => 'nullable|date',
            'ends_at' => 'nullable|date|after_or_equal:starts_at',
        ];
    }
}
