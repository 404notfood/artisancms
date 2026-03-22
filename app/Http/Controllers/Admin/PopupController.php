<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\PopupRequest;
use App\Models\Popup;
use App\Services\PopupService;
use Illuminate\Http\RedirectResponse;
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
    public function store(PopupRequest $request): RedirectResponse
    {
        $validated = $request->validated();

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
    public function update(PopupRequest $request, Popup $popup): RedirectResponse
    {
        $validated = $request->validated();

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

}
