<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Site;
use Illuminate\Database\Eloquent\Collection;
use InvalidArgumentException;

class SiteService
{
    /**
     * Get all sites with relationship counts.
     *
     * @return Collection<int, Site>
     */
    public function all(): Collection
    {
        return Site::withCount(['pages', 'posts', 'users'])
            ->orderByDesc('is_primary')
            ->orderBy('name')
            ->get();
    }

    /**
     * Find a site by ID with relationship counts.
     */
    public function find(int $id): Site
    {
        return Site::withCount(['pages', 'posts', 'users'])->findOrFail($id);
    }

    /**
     * Create a new site.
     *
     * @param array<string, mixed> $data
     */
    public function create(array $data): Site
    {
        return Site::create($data);
    }

    /**
     * Update an existing site.
     *
     * @param array<string, mixed> $data
     */
    public function update(Site $site, array $data): Site
    {
        $site->update($data);

        return $site->fresh() ?? $site;
    }

    /**
     * Delete a site. Prevents deletion of the primary site.
     *
     * @throws InvalidArgumentException
     */
    public function delete(Site $site): bool
    {
        if ($site->is_primary) {
            throw new InvalidArgumentException(__('cms.sites.cannot_delete_primary'));
        }

        return (bool) $site->delete();
    }

    /**
     * Switch the current session to the given site.
     */
    public function switchSite(Site $site): void
    {
        session(['current_site_id' => $site->id]);
        app()->instance('current.site', $site);
    }
}
