<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\RedirectRequest;
use App\Models\Redirect;
use App\Services\RedirectService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RedirectController extends Controller
{
    public function __construct(
        private readonly RedirectService $redirectService,
    ) {}

    /**
     * Display a paginated list of redirects with search.
     */
    public function index(Request $request): Response
    {
        $filters = $request->only(['search', 'per_page']);

        $redirects = $this->redirectService->all($filters);

        return Inertia::render('Admin/Redirects/Index', [
            'redirects' => $redirects,
            'filters' => $filters,
        ]);
    }

    /**
     * Store a newly created redirect.
     */
    public function store(RedirectRequest $request): RedirectResponse
    {
        $this->redirectService->create($request->validated());

        return redirect()
            ->route('admin.redirects.index')
            ->with('success', __('cms.redirects.created'));
    }

    /**
     * Update the specified redirect.
     */
    public function update(RedirectRequest $request, Redirect $redirect): RedirectResponse
    {
        $this->redirectService->update($redirect, $request->validated());

        return redirect()
            ->back()
            ->with('success', __('cms.redirects.updated'));
    }

    /**
     * Delete the specified redirect.
     */
    public function destroy(Redirect $redirect): RedirectResponse
    {
        $this->redirectService->delete($redirect);

        return redirect()
            ->route('admin.redirects.index')
            ->with('success', __('cms.redirects.deleted'));
    }
}
