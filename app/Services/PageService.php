<?php

declare(strict_types=1);

namespace App\Services;

use App\CMS\Facades\CMS;
use App\Models\Page;
use App\Models\PreviewToken;
use App\Models\Revision;
use App\Services\Concerns\CreatesRevisions;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Auth;

class PageService
{
    use CreatesRevisions;
    /**
     * Get paginated pages with optional filtering.
     *
     * @param array<string, mixed> $filters
     * @return LengthAwarePaginator<Page>
     */
    public function all(array $filters = []): LengthAwarePaginator
    {
        $query = Page::with(['author', 'parent']);

        if (isset($filters['status']) && $filters['status'] !== '') {
            $query->where('status', $filters['status']);
        } else {
            // "Tout" exclut la corbeille
            $query->where('status', '!=', 'trash');
        }

        if (isset($filters['search']) && $filters['search'] !== '') {
            $search = $filters['search'];
            $query->where(function ($q) use ($search): void {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        if (isset($filters['parent_id'])) {
            if ($filters['parent_id'] === null || $filters['parent_id'] === 'root') {
                $query->whereNull('parent_id');
            } else {
                $query->where('parent_id', $filters['parent_id']);
            }
        }

        $sortBy = $filters['sort_by'] ?? 'updated_at';
        $sortDir = $filters['sort_dir'] ?? 'desc';
        $query->orderBy($sortBy, $sortDir);

        $perPage = (int) ($filters['per_page'] ?? 15);

        return $query->paginate($perPage);
    }

    /**
     * Find a page by ID or throw.
     *
     * @throws ModelNotFoundException
     */
    public function find(int $id): Page
    {
        return Page::with(['author', 'parent', 'children', 'revisions', 'terms'])->findOrFail($id);
    }

    /**
     * Create a new page with revision.
     *
     * @param array<string, mixed> $data
     */
    public function create(array $data): Page
    {
        $data['created_by'] = $data['created_by'] ?? Auth::id();

        $page = Page::create($data);

        $this->createRevision($page, $this->buildPageSnapshot($page), 'auto', 'Page created');

        CMS::fire('page.created', $page);

        return $page->load(['author', 'parent']);
    }

    /**
     * Update an existing page. Creates a revision if content changed.
     *
     * @param array<string, mixed> $data
     */
    public function update(Page $page, array $data): Page
    {
        $contentChanged = isset($data['content']) && $data['content'] !== $page->content;

        $page->update($data);

        if ($contentChanged) {
            $this->createRevision($page, $this->buildPageSnapshot($page), 'auto', 'Content updated');
        }

        CMS::fire('page.updated', $page);

        return $page->fresh(['author', 'parent']) ?? $page;
    }

    /**
     * Move a page to trash (set status to 'trash').
     */
    public function delete(Page $page): bool
    {
        CMS::fire('page.deleting', $page);

        $page->update(['status' => 'trash']);

        CMS::fire('page.deleted', $page);

        return true;
    }

    /**
     * Restore a trashed page (set status back to 'draft').
     * Handles both status-based trash and SoftDeletes.
     */
    public function restore(Page $page): bool
    {
        // Restore from SoftDeletes if applicable
        if ($page->trashed()) {
            $page->restore();
        }

        // Reset status from 'trash' to 'draft'
        if ($page->status === 'trash') {
            $page->update(['status' => 'draft']);
        }

        CMS::fire('page.restored', $page);

        return true;
    }

    /**
     * Permanently delete a page.
     */
    public function forceDelete(Page $page): bool
    {
        CMS::fire('page.forceDeleting', $page);

        // Delete all revisions
        $page->revisions()->delete();

        return (bool) $page->forceDelete();
    }

    /**
     * Publish a page (set status to published, published_at to now).
     */
    public function publish(Page $page): Page
    {
        $page->update([
            'status' => 'published',
            'published_at' => now(),
        ]);

        $this->createRevision($page, $this->buildPageSnapshot($page), 'published', 'Page published');

        CMS::fire('page.published', $page);

        return $page->fresh(['author', 'parent']) ?? $page;
    }

    /**
     * Unpublish a page (set status back to draft).
     */
    public function unpublish(Page $page): Page
    {
        $page->update([
            'status' => 'draft',
        ]);

        CMS::fire('page.unpublished', $page);

        return $page->fresh(['author', 'parent']) ?? $page;
    }

    /**
     * Submit a page for review (set status to pending_review).
     */
    public function submitForReview(Page $page): Page
    {
        $page->update([
            'status' => 'pending_review',
            'rejection_reason' => null,
        ]);

        $this->createRevision($page, $this->buildPageSnapshot($page), 'workflow', 'Submitted for review');

        CMS::fire('page.submitted_for_review', $page);

        return $page->fresh(['author', 'parent']) ?? $page;
    }

    /**
     * Approve a page (set status to approved).
     */
    public function approve(Page $page): Page
    {
        $page->update([
            'status' => 'approved',
            'rejection_reason' => null,
            'reviewed_by' => Auth::id(),
            'reviewed_at' => now(),
        ]);

        $this->createRevision($page, $this->buildPageSnapshot($page), 'workflow', 'Page approved');

        CMS::fire('page.approved', $page);

        return $page->fresh(['author', 'parent']) ?? $page;
    }

    /**
     * Reject a page (set status back to draft with reason).
     */
    public function reject(Page $page, string $reason): Page
    {
        $page->update([
            'status' => 'draft',
            'rejection_reason' => $reason,
            'reviewed_by' => Auth::id(),
            'reviewed_at' => now(),
        ]);

        $this->createRevision($page, $this->buildPageSnapshot($page), 'workflow', 'Page rejected: ' . $reason);

        CMS::fire('page.rejected', $page);

        return $page->fresh(['author', 'parent']) ?? $page;
    }

    /**
     * Duplicate a page.
     */
    public function duplicate(Page $page): Page
    {
        $newPage = $page->replicate(['checked_out_by', 'checked_out_at']);
        $newPage->title = __('cms.pages.copy_prefix') . $page->title;
        $newPage->slug = $page->slug . '-copy';
        $newPage->status = 'draft';
        $newPage->published_at = null;
        $newPage->save();

        CMS::fire('page.duplicated', $newPage);

        return $newPage;
    }

    /**
     * Empty the trash (permanently delete all trashed pages).
     */
    public function emptyTrash(): int
    {
        $trashedPages = Page::where('status', 'trash')->get();
        $count = 0;

        foreach ($trashedPages as $page) {
            $this->forceDelete($page);
            $count++;
        }

        return $count;
    }

    /**
     * Check out a page for editing (acquire content lock).
     */
    public function checkout(Page $page, int $userId): void
    {
        $page->update([
            'checked_out_by' => $userId,
            'checked_out_at' => now(),
        ]);
    }

    /**
     * Check in a page (release content lock).
     */
    public function checkin(Page $page, int $userId): void
    {
        if ($page->checked_out_by === $userId) {
            $page->update([
                'checked_out_by' => null,
                'checked_out_at' => null,
            ]);
        }
    }

    /**
     * Generate a shareable preview token for a page.
     */
    public function generatePreviewToken(Page $page, int $userId): PreviewToken
    {
        return PreviewToken::create([
            'previewable_type' => Page::class,
            'previewable_id' => $page->id,
            'token' => bin2hex(random_bytes(32)),
            'expires_at' => now()->addHours(48),
            'created_by' => $userId,
            'created_at' => now(),
        ]);
    }

    /**
     * Get parent page options for dropdowns.
     *
     * @return Collection<int, Page>
     */
    public function getParentOptions(?int $excludeId = null): Collection
    {
        $query = Page::whereNull('parent_id')->orderBy('title');

        if ($excludeId !== null) {
            $query->where('id', '!=', $excludeId);
        }

        return $query->get(['id', 'title']);
    }

    /**
     * Sync related content for a page.
     *
     * @param array<int, array{type: string, id: int}> $relatedItems
     */
    public function syncRelated(Page $page, array $relatedItems): void
    {
        $page->relatedContent()->delete();

        foreach ($relatedItems as $order => $item) {
            $page->relatedContent()->create([
                'related_type' => $item['type'],
                'related_id' => $item['id'],
                'order' => $order,
            ]);
        }
    }

    /**
     * Perform a bulk action on multiple pages.
     *
     * @param array<int, int> $ids
     */
    public function bulkAction(array $ids, string $action): int
    {
        $pages = Page::whereIn('id', $ids)->get();
        $count = 0;

        foreach ($pages as $page) {
            match ($action) {
                'publish' => $this->publish($page),
                'draft' => $this->unpublish($page),
                'delete' => $this->delete($page),
                'restore' => $this->restore($page),
                default => null,
            };
            $count++;
        }

        return $count;
    }

    /**
     * Build revision snapshot data for a page.
     *
     * @return array<string, mixed>
     */
    private function buildPageSnapshot(Page $page): array
    {
        return [
            'title' => $page->title,
            'slug' => $page->slug,
            'content' => $page->content,
            'status' => $page->status,
            'template' => $page->template,
            'meta_title' => $page->meta_title,
            'meta_description' => $page->meta_description,
        ];
    }
}
