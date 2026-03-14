<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\ContentEntry;
use App\Models\ContentType;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class ContentTypeService
{
    /**
     * Get all content types with entry counts.
     *
     * @return Collection<int, ContentType>
     */
    public function getAll(): Collection
    {
        return ContentType::withCount('entries')
            ->orderBy('menu_position')
            ->orderBy('name')
            ->get();
    }

    /**
     * Find a content type by ID.
     */
    public function find(int $id): ContentType
    {
        return ContentType::findOrFail($id);
    }

    /**
     * Find a content type by slug.
     */
    public function findBySlug(string $slug): ContentType
    {
        return ContentType::where('slug', $slug)->firstOrFail();
    }

    /**
     * Create a new content type.
     *
     * @param array<string, mixed> $data
     */
    public function create(array $data): ContentType
    {
        if (empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name']);
        }

        $data['fields'] = $data['fields'] ?? [];
        $data['supports'] = $data['supports'] ?? ['title', 'slug'];

        return ContentType::create($data);
    }

    /**
     * Update a content type.
     *
     * @param array<string, mixed> $data
     */
    public function update(ContentType $contentType, array $data): ContentType
    {
        $contentType->update($data);

        return $contentType->fresh() ?? $contentType;
    }

    /**
     * Delete a content type (only if no entries exist).
     *
     * @throws \RuntimeException
     */
    public function delete(ContentType $contentType): bool
    {
        if ($contentType->entries()->count() > 0) {
            throw new \RuntimeException(__('cms.content_types.has_entries'));
        }

        return (bool) $contentType->delete();
    }

    /**
     * Get paginated entries for a content type with optional filters.
     *
     * @param array<string, mixed> $filters
     * @return LengthAwarePaginator<ContentEntry>
     */
    public function getEntries(ContentType $contentType, array $filters = []): LengthAwarePaginator
    {
        $query = $contentType->entries()->with('author');

        if (isset($filters['status']) && $filters['status'] !== '') {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['search']) && $filters['search'] !== '') {
            $search = $filters['search'];
            $query->where(function ($q) use ($search): void {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        $sortBy = $filters['sort_by'] ?? 'updated_at';
        $sortDir = $filters['sort_dir'] ?? 'desc';
        $query->orderBy($sortBy, $sortDir);

        $perPage = (int) ($filters['per_page'] ?? 15);

        return $query->paginate($perPage);
    }

    /**
     * Create a new content entry.
     *
     * @param array<string, mixed> $data
     */
    public function createEntry(ContentType $contentType, array $data): ContentEntry
    {
        $data['content_type_id'] = $contentType->id;
        $data['created_by'] = $data['created_by'] ?? Auth::id();

        if ($data['status'] === 'published' && empty($data['published_at'])) {
            $data['published_at'] = now();
        }

        return $contentType->entries()->create($data);
    }

    /**
     * Update a content entry.
     *
     * @param array<string, mixed> $data
     */
    public function updateEntry(ContentEntry $entry, array $data): ContentEntry
    {
        if (($data['status'] ?? null) === 'published' && $entry->status !== 'published' && empty($data['published_at'])) {
            $data['published_at'] = now();
        }

        $entry->update($data);

        return $entry->fresh(['author', 'contentType']) ?? $entry;
    }

    /**
     * Delete a content entry.
     */
    public function deleteEntry(ContentEntry $entry): bool
    {
        return (bool) $entry->delete();
    }
}
