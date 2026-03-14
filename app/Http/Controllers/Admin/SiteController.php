<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SiteRequest;
use App\Models\Site;
use App\Services\SiteService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use InvalidArgumentException;

class SiteController extends Controller
{
    public function __construct(
        private readonly SiteService $siteService,
    ) {}

    /**
     * Display a list of all sites with counts.
     */
    public function index(): Response
    {
        $sites = $this->siteService->all();

        return Inertia::render('Admin/Sites/Index', [
            'sites' => $sites,
        ]);
    }

    /**
     * Show the form for creating a new site.
     */
    public function create(): Response
    {
        return Inertia::render('Admin/Sites/Create');
    }

    /**
     * Store a newly created site.
     */
    public function store(SiteRequest $request): RedirectResponse
    {
        $this->siteService->create($request->validated());

        return redirect()
            ->route('admin.sites.index')
            ->with('success', __('cms.sites.created'));
    }

    /**
     * Show the form for editing the specified site.
     */
    public function edit(Site $site): Response
    {
        $site->loadCount(['pages', 'posts', 'users']);

        return Inertia::render('Admin/Sites/Edit', [
            'site' => $site,
        ]);
    }

    /**
     * Update the specified site.
     */
    public function update(SiteRequest $request, Site $site): RedirectResponse
    {
        $this->siteService->update($site, $request->validated());

        return redirect()
            ->back()
            ->with('success', __('cms.sites.updated'));
    }

    /**
     * Delete the specified site (primary site cannot be deleted).
     */
    public function destroy(Site $site): RedirectResponse
    {
        try {
            $this->siteService->delete($site);
        } catch (InvalidArgumentException $e) {
            return redirect()
                ->back()
                ->with('error', $e->getMessage());
        }

        return redirect()
            ->route('admin.sites.index')
            ->with('success', __('cms.sites.deleted'));
    }

    /**
     * Switch the current session to the specified site.
     */
    public function switch(Site $site): RedirectResponse
    {
        $this->siteService->switchSite($site);

        return redirect()
            ->route('admin.dashboard')
            ->with('success', __('cms.sites.switched', ['name' => $site->name]));
    }
}
