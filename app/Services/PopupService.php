<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Popup;
use Illuminate\Database\Eloquent\Collection;

class PopupService
{
    /**
     * Get all popups ordered by creation date.
     *
     * @return Collection<int, Popup>
     */
    public function getAll(): Collection
    {
        return Popup::orderBy('created_at', 'desc')->get();
    }

    /**
     * Create a new popup.
     *
     * @param array<string, mixed> $data
     */
    public function create(array $data): Popup
    {
        return Popup::create($data);
    }

    /**
     * Update an existing popup.
     *
     * @param array<string, mixed> $data
     */
    public function update(Popup $popup, array $data): Popup
    {
        $popup->update($data);

        return $popup->fresh() ?? $popup;
    }

    /**
     * Delete a popup.
     */
    public function delete(Popup $popup): void
    {
        $popup->delete();
    }

    /**
     * Get active popups that should show for a given URL path.
     *
     * @return Collection<int, Popup>
     */
    public function getActiveForPath(string $path): Collection
    {
        $popups = Popup::active()->current()->get();

        return $popups->filter(function (Popup $popup) use ($path) {
            // If pages is null or empty, show on all pages
            if (empty($popup->pages)) {
                return true;
            }

            // Check if the current path matches any of the configured pages
            foreach ($popup->pages as $page) {
                if ($page === $path || $page === '/' . ltrim($path, '/')) {
                    return true;
                }

                // Support wildcard matching (e.g., /blog/*)
                if (str_ends_with($page, '*')) {
                    $prefix = rtrim($page, '*');
                    if (str_starts_with('/' . ltrim($path, '/'), $prefix)) {
                        return true;
                    }
                }
            }

            return false;
        })->values();
    }
}
