<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\TaxonomyRequest;
use App\Http\Requests\TaxonomyTermRequest;
use App\Models\Taxonomy;
use App\Models\TaxonomyTerm;
use App\Services\TaxonomyService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class TaxonomyController extends Controller
{
    public function __construct(
        private readonly TaxonomyService $taxonomyService,
    ) {}

    /**
     * Display a list of all taxonomies with their term counts.
     */
    public function index(): Response
    {
        $taxonomies = $this->taxonomyService->all();

        return Inertia::render('Admin/Taxonomies/Index', [
            'taxonomies' => $taxonomies,
        ]);
    }

    /**
     * Store a newly created taxonomy.
     */
    public function store(TaxonomyRequest $request): RedirectResponse
    {
        $this->taxonomyService->create($request->validated());

        return redirect()
            ->route('admin.taxonomies.index')
            ->with('success', __('cms.taxonomies.created'));
    }

    /**
     * Update the specified taxonomy.
     */
    public function update(TaxonomyRequest $request, Taxonomy $taxonomy): RedirectResponse
    {
        $this->taxonomyService->update($taxonomy, $request->validated());

        return redirect()
            ->back()
            ->with('success', __('cms.taxonomies.updated'));
    }

    /**
     * Delete the specified taxonomy and all its terms.
     */
    public function destroy(Taxonomy $taxonomy): RedirectResponse
    {
        $this->taxonomyService->delete($taxonomy);

        return redirect()
            ->route('admin.taxonomies.index')
            ->with('success', __('cms.taxonomies.deleted'));
    }

    /**
     * Add a term to a taxonomy.
     */
    public function addTerm(TaxonomyTermRequest $request, Taxonomy $taxonomy): RedirectResponse
    {
        $this->taxonomyService->addTerm($taxonomy, $request->validated());

        return redirect()
            ->back()
            ->with('success', __('cms.taxonomies.term_created'));
    }

    /**
     * Update a taxonomy term.
     */
    public function updateTerm(TaxonomyTermRequest $request, TaxonomyTerm $term): RedirectResponse
    {
        $this->taxonomyService->updateTerm($term, $request->validated());

        return redirect()
            ->back()
            ->with('success', __('cms.taxonomies.term_updated'));
    }

    /**
     * Delete a taxonomy term.
     */
    public function destroyTerm(TaxonomyTerm $term): RedirectResponse
    {
        $this->taxonomyService->deleteTerm($term);

        return redirect()
            ->back()
            ->with('success', __('cms.taxonomies.term_deleted'));
    }
}
