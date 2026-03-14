<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Services\CommentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CommentController extends Controller
{
    public function __construct(
        private readonly CommentService $commentService,
    ) {}

    /**
     * Display a paginated list of comments with filters.
     */
    public function index(Request $request): Response
    {
        $filters = $request->only(['status', 'post_id', 'search', 'per_page']);

        $comments = $this->commentService->all($filters);

        // Get counts per status for tab badges
        $counts = [
            'all' => Comment::count(),
            'pending' => Comment::where('status', 'pending')->count(),
            'approved' => Comment::where('status', 'approved')->count(),
            'spam' => Comment::where('status', 'spam')->count(),
        ];

        return Inertia::render('Admin/Comments/Index', [
            'comments' => $comments,
            'filters' => $filters,
            'counts' => $counts,
        ]);
    }

    /**
     * Approve a comment.
     */
    public function approve(Comment $comment): RedirectResponse
    {
        $this->commentService->approve($comment);

        return redirect()
            ->back()
            ->with('success', __('cms.comments.approved'));
    }

    /**
     * Reject a comment (set to trash).
     */
    public function reject(Comment $comment): RedirectResponse
    {
        $this->commentService->reject($comment);

        return redirect()
            ->back()
            ->with('success', __('cms.comments.rejected'));
    }

    /**
     * Mark a comment as spam.
     */
    public function spam(Comment $comment): RedirectResponse
    {
        $this->commentService->markSpam($comment);

        return redirect()
            ->back()
            ->with('success', __('cms.comments.spam'));
    }

    /**
     * Delete a comment permanently.
     */
    public function destroy(Comment $comment): RedirectResponse
    {
        $this->commentService->delete($comment);

        return redirect()
            ->back()
            ->with('success', __('cms.comments.deleted'));
    }
}
