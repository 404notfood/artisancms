<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Redirect;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Cache;

class RedirectService
{
    /**
     * Cache key for active redirects.
     */
    private const CACHE_KEY = 'cms_redirects';

    /**
     * Cache TTL in seconds (1 hour).
     */
    private const CACHE_TTL = 3600;

    /**
     * Get paginated redirects with optional filtering.
     *
     * @param array<string, mixed> $filters
     * @return LengthAwarePaginator<Redirect>
     */
    public function all(array $filters = []): LengthAwarePaginator
    {
        $query = Redirect::query();

        if (isset($filters['search']) && $filters['search'] !== '') {
            $search = $filters['search'];
            $query->where(function ($q) use ($search): void {
                $q->where('source_path', 'like', "%{$search}%")
                    ->orWhere('target_url', 'like', "%{$search}%")
                    ->orWhere('note', 'like', "%{$search}%");
            });
        }

        $query->orderBy('updated_at', 'desc');

        $perPage = (int) ($filters['per_page'] ?? 15);

        return $query->paginate($perPage);
    }

    /**
     * Create a new redirect.
     *
     * @param array<string, mixed> $data
     */
    public function create(array $data): Redirect
    {
        $redirect = Redirect::create($data);

        $this->clearCache();

        return $redirect;
    }

    /**
     * Update an existing redirect.
     *
     * @param array<string, mixed> $data
     */
    public function update(Redirect $redirect, array $data): Redirect
    {
        $redirect->update($data);

        $this->clearCache();

        return $redirect->fresh() ?? $redirect;
    }

    /**
     * Delete a redirect.
     */
    public function delete(Redirect $redirect): bool
    {
        $deleted = (bool) $redirect->delete();

        if ($deleted) {
            $this->clearCache();
        }

        return $deleted;
    }

    /**
     * Find a matching redirect for a given path.
     */
    public function findByPath(string $path): ?Redirect
    {
        $redirects = $this->getCachedRedirects();

        $normalizedPath = '/' . ltrim($path, '/');

        return $redirects->first(function (Redirect $redirect) use ($normalizedPath): bool {
            return $redirect->source_path === $normalizedPath;
        });
    }

    /**
     * Increment the hit counter for a redirect.
     */
    public function incrementHits(Redirect $redirect): void
    {
        $redirect->increment('hits');
    }

    /**
     * Get all active redirects from cache.
     *
     * @return \Illuminate\Database\Eloquent\Collection<int, Redirect>
     */
    private function getCachedRedirects(): \Illuminate\Database\Eloquent\Collection
    {
        return Cache::remember(self::CACHE_KEY, self::CACHE_TTL, function () {
            return Redirect::active()->get();
        });
    }

    /**
     * Clear the redirect cache.
     */
    public function clearCache(): void
    {
        Cache::forget(self::CACHE_KEY);
    }
}
