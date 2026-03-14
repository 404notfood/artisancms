<?php

declare(strict_types=1);

namespace App\Services;

use App\CMS\Facades\CMS;
use App\Models\GlobalSection;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\Cache;

class GlobalSectionService
{
    /**
     * Cache key for the active header.
     */
    private const CACHE_KEY_HEADER = 'cms.global_section.active_header';

    /**
     * Cache key for the active footer.
     */
    private const CACHE_KEY_FOOTER = 'cms.global_section.active_footer';

    /**
     * Cache TTL in seconds (1 hour).
     */
    private const CACHE_TTL = 3600;

    /**
     * Get paginated global sections with optional filtering.
     *
     * @param array<string, mixed> $filters
     * @return LengthAwarePaginator<GlobalSection>
     */
    public function all(array $filters = []): LengthAwarePaginator
    {
        $query = GlobalSection::query();

        if (isset($filters['type']) && $filters['type'] !== '') {
            $query->where('type', $filters['type']);
        }

        if (isset($filters['search']) && $filters['search'] !== '') {
            $search = $filters['search'];
            $query->where(function ($q) use ($search): void {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        $query->orderBy('type')->orderBy('name');

        $perPage = (int) ($filters['per_page'] ?? 15);

        return $query->paginate($perPage);
    }

    /**
     * Find a global section by ID or throw.
     *
     * @throws ModelNotFoundException
     */
    public function find(int $id): GlobalSection
    {
        return GlobalSection::findOrFail($id);
    }

    /**
     * Find a global section by slug.
     */
    public function findBySlug(string $slug): ?GlobalSection
    {
        return GlobalSection::where('slug', $slug)->first();
    }

    /**
     * Create a new global section.
     *
     * @param array<string, mixed> $data
     */
    public function create(array $data): GlobalSection
    {
        $section = GlobalSection::create($data);

        CMS::fire('global_section.created', $section);

        return $section;
    }

    /**
     * Update an existing global section.
     *
     * @param array<string, mixed> $data
     */
    public function update(GlobalSection $section, array $data): GlobalSection
    {
        $section->update($data);

        // Invalidate cache if this section is active
        if ($section->status === 'active') {
            $this->clearCacheForType($section->type);
        }

        CMS::fire('global_section.updated', $section);

        return $section->fresh() ?? $section;
    }

    /**
     * Delete a global section.
     */
    public function delete(GlobalSection $section): bool
    {
        CMS::fire('global_section.deleting', $section);

        $type = $section->type;
        $wasActive = $section->status === 'active';

        $deleted = (bool) $section->delete();

        if ($deleted) {
            if ($wasActive) {
                $this->clearCacheForType($type);
            }
            CMS::fire('global_section.deleted', $section);
        }

        return $deleted;
    }

    /**
     * Activate a section as the current active header or footer.
     * Deactivates any other section of the same type first.
     */
    public function activate(GlobalSection $section): GlobalSection
    {
        // Deactivate all sections of the same type
        GlobalSection::where('type', $section->type)
            ->where('id', '!=', $section->id)
            ->where('status', 'active')
            ->update(['status' => 'inactive']);

        $section->update(['status' => 'active']);

        $this->clearCacheForType($section->type);

        CMS::fire('global_section.activated', $section);

        return $section->fresh() ?? $section;
    }

    /**
     * Get the active header section (cached).
     */
    public function getActiveHeader(): ?GlobalSection
    {
        return Cache::remember(self::CACHE_KEY_HEADER, self::CACHE_TTL, function (): ?GlobalSection {
            return GlobalSection::active()->headers()->first();
        });
    }

    /**
     * Get the active footer section (cached).
     */
    public function getActiveFooter(): ?GlobalSection
    {
        return Cache::remember(self::CACHE_KEY_FOOTER, self::CACHE_TTL, function (): ?GlobalSection {
            return GlobalSection::active()->footers()->first();
        });
    }

    /**
     * Clear cache for a given section type.
     */
    private function clearCacheForType(string $type): void
    {
        if ($type === 'header') {
            Cache::forget(self::CACHE_KEY_HEADER);
        } elseif ($type === 'footer') {
            Cache::forget(self::CACHE_KEY_FOOTER);
        }
    }
}
