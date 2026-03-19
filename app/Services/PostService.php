<?php

declare(strict_types=1);

namespace App\Services;

use App\CMS\Facades\CMS;
use App\Models\Post;
use App\Models\PreviewToken;
use App\Models\Revision;
use App\Services\Concerns\CreatesRevisions;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;

class PostService
{
    use CreatesRevisions;
    /**
     * Get paginated posts with optional filtering.
     *
     * @param array<string, mixed> $filters
     * @return LengthAwarePaginator<Post>
     */
    public function all(array $filters = []): LengthAwarePaginator
    {
        $query = Post::with(['author', 'terms']);

        if (isset($filters['status']) && $filters['status'] !== '') {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['search']) && $filters['search'] !== '') {
            $search = $filters['search'];
            $query->where(function ($q) use ($search): void {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%")
                    ->orWhere('excerpt', 'like', "%{$search}%");
            });
        }

        if (isset($filters['created_by'])) {
            $query->where('created_by', $filters['created_by']);
        }

        $sortBy = $filters['sort_by'] ?? 'updated_at';
        $sortDir = $filters['sort_dir'] ?? 'desc';
        $query->orderBy($sortBy, $sortDir);

        $perPage = (int) ($filters['per_page'] ?? 15);

        return $query->paginate($perPage);
    }

    /**
     * Find a post by ID or throw.
     *
     * @throws ModelNotFoundException
     */
    public function find(int $id): Post
    {
        return Post::with(['author', 'revisions', 'terms'])->findOrFail($id);
    }

    /**
     * Create a new post with revision.
     *
     * @param array<string, mixed> $data
     */
    public function create(array $data): Post
    {
        $data['created_by'] = $data['created_by'] ?? Auth::id();

        $post = Post::create($data);

        $this->createRevision($post, $this->buildPostSnapshot($post), 'auto', 'Post created');

        CMS::fire('post.created', $post);

        return $post->load(['author', 'terms']);
    }

    /**
     * Update an existing post. Creates a revision if content changed.
     *
     * @param array<string, mixed> $data
     */
    public function update(Post $post, array $data): Post
    {
        $contentChanged = isset($data['content']) && $data['content'] !== $post->content;

        $post->update($data);

        if ($contentChanged) {
            $this->createRevision($post, $this->buildPostSnapshot($post), 'auto', 'Content updated');
        }

        CMS::fire('post.updated', $post);

        return $post->fresh(['author', 'terms']) ?? $post;
    }

    /**
     * Soft delete a post.
     */
    public function delete(Post $post): bool
    {
        CMS::fire('post.deleting', $post);

        $deleted = (bool) $post->delete();

        if ($deleted) {
            CMS::fire('post.deleted', $post);
        }

        return $deleted;
    }

    /**
     * Restore a soft-deleted post.
     */
    public function restore(Post $post): bool
    {
        $restored = $post->restore();

        if ($restored) {
            CMS::fire('post.restored', $post);
        }

        return (bool) $restored;
    }

    /**
     * Permanently delete a post.
     */
    public function forceDelete(Post $post): bool
    {
        CMS::fire('post.forceDeleting', $post);

        // Delete all revisions
        $post->revisions()->delete();

        return (bool) $post->forceDelete();
    }

    /**
     * Publish a post (set status to published, published_at to now).
     */
    public function publish(Post $post): Post
    {
        $post->update([
            'status' => 'published',
            'published_at' => now(),
        ]);

        $this->createRevision($post, $this->buildPostSnapshot($post), 'published', 'Post published');

        CMS::fire('post.published', $post);

        return $post->fresh(['author', 'terms']) ?? $post;
    }

    /**
     * Unpublish a post (set status back to draft).
     */
    public function unpublish(Post $post): Post
    {
        $post->update([
            'status' => 'draft',
        ]);

        CMS::fire('post.unpublished', $post);

        return $post->fresh(['author', 'terms']) ?? $post;
    }

    /**
     * Submit a post for review (set status to pending_review).
     */
    public function submitForReview(Post $post): Post
    {
        $post->update([
            'status' => 'pending_review',
            'rejection_reason' => null,
        ]);

        $this->createRevision($post, $this->buildPostSnapshot($post), 'workflow', 'Submitted for review');

        CMS::fire('post.submitted_for_review', $post);

        return $post->fresh(['author', 'terms']) ?? $post;
    }

    /**
     * Approve a post (set status to approved).
     */
    public function approve(Post $post): Post
    {
        $post->update([
            'status' => 'approved',
            'rejection_reason' => null,
            'reviewed_by' => Auth::id(),
            'reviewed_at' => now(),
        ]);

        $this->createRevision($post, $this->buildPostSnapshot($post), 'workflow', 'Post approved');

        CMS::fire('post.approved', $post);

        return $post->fresh(['author', 'terms']) ?? $post;
    }

    /**
     * Reject a post (set status back to draft with reason).
     */
    public function reject(Post $post, string $reason): Post
    {
        $post->update([
            'status' => 'draft',
            'rejection_reason' => $reason,
            'reviewed_by' => Auth::id(),
            'reviewed_at' => now(),
        ]);

        $this->createRevision($post, $this->buildPostSnapshot($post), 'workflow', 'Post rejected: ' . $reason);

        CMS::fire('post.rejected', $post);

        return $post->fresh(['author', 'terms']) ?? $post;
    }

    /**
     * Duplicate a post.
     */
    public function duplicate(Post $post): Post
    {
        $newPost = $post->replicate(['checked_out_by', 'checked_out_at']);
        $newPost->title = __('cms.posts.copy_prefix') . $post->title;
        $newPost->slug = $post->slug . '-copy';
        $newPost->status = 'draft';
        $newPost->published_at = null;
        $newPost->save();

        CMS::fire('post.duplicated', $newPost);

        return $newPost;
    }

    /**
     * Empty the trash (permanently delete all trashed posts).
     */
    public function emptyTrash(): int
    {
        $trashedPosts = Post::where('status', 'trash')->get();
        $count = 0;

        foreach ($trashedPosts as $post) {
            $this->forceDelete($post);
            $count++;
        }

        return $count;
    }

    /**
     * Check out a post for editing (acquire content lock).
     */
    public function checkout(Post $post, int $userId): void
    {
        $post->update([
            'checked_out_by' => $userId,
            'checked_out_at' => now(),
        ]);
    }

    /**
     * Check in a post (release content lock).
     */
    public function checkin(Post $post, int $userId): void
    {
        if ($post->checked_out_by === $userId) {
            $post->update([
                'checked_out_by' => null,
                'checked_out_at' => null,
            ]);
        }
    }

    /**
     * Generate a shareable preview token for a post.
     */
    public function generatePreviewToken(Post $post, int $userId): PreviewToken
    {
        return PreviewToken::create([
            'previewable_type' => Post::class,
            'previewable_id' => $post->id,
            'token' => bin2hex(random_bytes(32)),
            'expires_at' => now()->addHours(48),
            'created_by' => $userId,
            'created_at' => now(),
        ]);
    }

    /**
     * Sync related content for a post.
     *
     * @param array<int, array{type: string, id: int}> $relatedItems
     */
    public function syncRelated(Post $post, array $relatedItems): void
    {
        $post->relatedContent()->delete();

        foreach ($relatedItems as $order => $item) {
            $post->relatedContent()->create([
                'related_type' => $item['type'],
                'related_id' => $item['id'],
                'order' => $order,
            ]);
        }
    }

    /**
     * Perform a bulk action on multiple posts.
     *
     * @param array<int, int> $ids
     */
    public function bulkAction(array $ids, string $action): int
    {
        $posts = Post::whereIn('id', $ids)->get();
        $count = 0;

        foreach ($posts as $post) {
            match ($action) {
                'publish' => $this->publish($post),
                'draft' => $this->unpublish($post),
                'delete' => $this->delete($post),
                'restore' => $this->restore($post),
                default => null,
            };
            $count++;
        }

        return $count;
    }

    /**
     * Build revision snapshot data for a post.
     *
     * @return array<string, mixed>
     */
    private function buildPostSnapshot(Post $post): array
    {
        return [
            'title' => $post->title,
            'slug' => $post->slug,
            'content' => $post->content,
            'excerpt' => $post->excerpt,
            'status' => $post->status,
            'featured_image' => $post->featured_image,
        ];
    }
}
