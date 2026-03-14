<?php

declare(strict_types=1);

namespace App\Services;

use App\CMS\Facades\CMS;
use App\Models\Comment;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class CommentService
{
    /**
     * Get paginated comments with optional filtering.
     *
     * @param array<string, mixed> $filters
     * @return LengthAwarePaginator<Comment>
     */
    public function all(array $filters = []): LengthAwarePaginator
    {
        $query = Comment::with(['post', 'user', 'parent']);

        if (isset($filters['status']) && $filters['status'] !== '') {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['post_id']) && $filters['post_id'] !== '') {
            $query->where('post_id', $filters['post_id']);
        }

        if (isset($filters['search']) && $filters['search'] !== '') {
            $search = $filters['search'];
            $query->where(function ($q) use ($search): void {
                $q->where('content', 'like', "%{$search}%")
                    ->orWhere('author_name', 'like', "%{$search}%")
                    ->orWhere('author_email', 'like', "%{$search}%");
            });
        }

        $query->orderBy('created_at', 'desc');

        $perPage = (int) ($filters['per_page'] ?? 20);

        return $query->paginate($perPage);
    }

    /**
     * Create a new comment.
     *
     * @param array<string, mixed> $data
     */
    public function store(array $data): Comment
    {
        // Auto-approve comments from logged-in admin users
        if (isset($data['user_id'])) {
            $user = \App\Models\User::find($data['user_id']);
            if ($user !== null && $user->isAdmin()) {
                $data['status'] = 'approved';
            }
        }

        $comment = Comment::create($data);

        CMS::fire('comment.created', $comment);

        return $comment->load(['post', 'user']);
    }

    /**
     * Approve a comment.
     */
    public function approve(Comment $comment): Comment
    {
        $comment->update(['status' => 'approved']);

        CMS::fire('comment.approved', $comment);

        return $comment;
    }

    /**
     * Reject a comment (set to trash).
     */
    public function reject(Comment $comment): Comment
    {
        $comment->update(['status' => 'trash']);

        CMS::fire('comment.rejected', $comment);

        return $comment;
    }

    /**
     * Mark a comment as spam.
     */
    public function markSpam(Comment $comment): Comment
    {
        $comment->update(['status' => 'spam']);

        CMS::fire('comment.spam', $comment);

        return $comment;
    }

    /**
     * Hard delete a comment.
     */
    public function delete(Comment $comment): bool
    {
        CMS::fire('comment.deleting', $comment);

        return (bool) $comment->delete();
    }

    /**
     * Get approved comments for a post, threaded (with replies).
     *
     * @return Collection<int, Comment>
     */
    public function getForPost(int $postId): Collection
    {
        return Comment::with(['user', 'replies' => function ($query): void {
            $query->approved()
                ->with('user')
                ->orderBy('created_at', 'asc');
        }])
            ->where('post_id', $postId)
            ->whereNull('parent_id')
            ->approved()
            ->orderBy('created_at', 'asc')
            ->get();
    }
}
