<?php

declare(strict_types=1);

namespace App\Services;

use App\CMS\Facades\CMS;
use App\Models\Taxonomy;
use App\Models\TaxonomyTerm;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class TaxonomyService
{
    /**
     * Get all taxonomies with their terms count.
     *
     * @return Collection<int, Taxonomy>
     */
    public function all(): Collection
    {
        return Taxonomy::withCount('terms')->orderBy('name')->get();
    }

    /**
     * Find a taxonomy by ID with its terms, ordered.
     *
     * @throws ModelNotFoundException
     */
    public function find(int $id): Taxonomy
    {
        return Taxonomy::with(['terms' => function ($query): void {
            $query->orderBy('order')->orderBy('name');
        }])->findOrFail($id);
    }

    /**
     * Create a new taxonomy.
     *
     * @param array<string, mixed> $data
     */
    public function create(array $data): Taxonomy
    {
        if (empty($data['slug']) && !empty($data['name'])) {
            $data['slug'] = Str::slug($data['name']);
        }

        $taxonomy = Taxonomy::create($data);

        CMS::fire('taxonomy.created', $taxonomy);

        return $taxonomy;
    }

    /**
     * Update an existing taxonomy.
     *
     * @param array<string, mixed> $data
     */
    public function update(Taxonomy $taxonomy, array $data): Taxonomy
    {
        $taxonomy->update($data);

        CMS::fire('taxonomy.updated', $taxonomy);

        return $taxonomy->fresh() ?? $taxonomy;
    }

    /**
     * Delete a taxonomy and all its terms.
     */
    public function delete(Taxonomy $taxonomy): bool
    {
        CMS::fire('taxonomy.deleting', $taxonomy);

        // Delete all terms belonging to this taxonomy
        $taxonomy->terms()->delete();

        $deleted = (bool) $taxonomy->delete();

        if ($deleted) {
            CMS::fire('taxonomy.deleted', $taxonomy);
        }

        return $deleted;
    }

    /**
     * Add a term to a taxonomy.
     * Auto-generates a slug from the name if not provided.
     *
     * @param array<string, mixed> $data
     */
    public function addTerm(Taxonomy $taxonomy, array $data): TaxonomyTerm
    {
        if (empty($data['slug']) && !empty($data['name'])) {
            $data['slug'] = Str::slug($data['name']);
        }

        $data['taxonomy_id'] = $taxonomy->id;

        $term = TaxonomyTerm::create($data);

        CMS::fire('taxonomy.term_created', $term, $taxonomy);

        return $term;
    }

    /**
     * Update an existing taxonomy term.
     *
     * @param array<string, mixed> $data
     */
    public function updateTerm(TaxonomyTerm $term, array $data): TaxonomyTerm
    {
        if (isset($data['name']) && empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name']);
        }

        $term->update($data);

        CMS::fire('taxonomy.term_updated', $term);

        return $term->fresh() ?? $term;
    }

    /**
     * Delete a taxonomy term.
     */
    public function deleteTerm(TaxonomyTerm $term): bool
    {
        CMS::fire('taxonomy.term_deleting', $term);

        $deleted = (bool) $term->delete();

        if ($deleted) {
            CMS::fire('taxonomy.term_deleted', $term);
        }

        return $deleted;
    }
}
