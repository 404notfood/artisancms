<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\PostRequest;
use App\Models\Post;
use App\Models\PreviewToken;
use App\Models\Revision;
use App\Services\PostService;
use App\Services\TaxonomyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PostController extends Controller
{
    public function __construct(
        private readonly PostService $postService,
        private readonly TaxonomyService $taxonomyService,
    ) {}

    /**
     * Display a paginated list of posts with filters.
     */
    public function index(Request $request): Response
    {
        $filters = $request->only(['status', 'search', 'created_by', 'sort_by', 'sort_dir', 'per_page']);

        $posts = $this->postService->all($filters);

        return Inertia::render('Admin/Posts/Index', [
            'posts' => $posts,
            'filters' => $filters,
        ]);
    }

    /**
     * Show the form for creating a new post.
     */
    public function create(): Response
    {
        $taxonomies = $this->taxonomyService->all();

        return Inertia::render('Admin/Posts/Create', [
            'taxonomies' => $taxonomies,
        ]);
    }

    /**
     * Store a newly created post.
     */
    public function store(PostRequest $request): RedirectResponse
    {
        $this->postService->create($request->validated());

        return redirect()
            ->route('admin.posts.index')
            ->with('success', __('cms.posts.created'));
    }

    /**
     * Show the form for editing a post.
     */
    public function edit(Post $post): Response
    {
        $post->load(['author', 'revisions', 'terms']);

        $taxonomies = $this->taxonomyService->all();

        return Inertia::render('Admin/Posts/Edit', [
            'post' => $post,
            'taxonomies' => $taxonomies,
        ]);
    }

    /**
     * Update the specified post.
     */
    public function update(PostRequest $request, Post $post): RedirectResponse
    {
        $this->postService->update($post, $request->validated());

        return redirect()
            ->back()
            ->with('success', __('cms.posts.updated'));
    }

    /**
     * Soft delete the specified post.
     */
    public function destroy(Post $post): RedirectResponse
    {
        $this->postService->delete($post);

        return redirect()
            ->route('admin.posts.index')
            ->with('success', __('cms.posts.deleted'));
    }

    /**
     * Restore a soft-deleted post.
     */
    public function restore(Post $post): RedirectResponse
    {
        $this->postService->restore($post);

        return redirect()
            ->back()
            ->with('success', __('cms.posts.restored'));
    }

    /**
     * Move a post to trash.
     */
    public function trash(Post $post): RedirectResponse
    {
        $post->update(['status' => 'trash']);

        return redirect()
            ->back()
            ->with('success', __('cms.posts.trashed'));
    }

    /**
     * Permanently delete a post.
     */
    public function forceDelete(Post $post): RedirectResponse
    {
        $post->revisions()->delete();
        $post->forceDelete();

        return redirect()
            ->back()
            ->with('success', __('cms.posts.force_deleted'));
    }

    /**
     * Empty the trash (permanently delete all trashed posts).
     */
    public function emptyTrash(): RedirectResponse
    {
        $trashedPosts = Post::where('status', 'trash')->get();

        foreach ($trashedPosts as $post) {
            $post->revisions()->delete();
            $post->forceDelete();
        }

        return redirect()
            ->back()
            ->with('success', __('cms.posts.trash_emptied'));
    }

    /**
     * Duplicate a post.
     */
    public function duplicate(Post $post): RedirectResponse
    {
        $newPost = $post->replicate(['checked_out_by', 'checked_out_at']);
        $newPost->title = 'Copie de ' . $post->title;
        $newPost->slug = $post->slug . '-copy';
        $newPost->status = 'draft';
        $newPost->published_at = null;
        $newPost->save();

        return redirect()
            ->route('admin.posts.edit', $newPost)
            ->with('success', __('cms.posts.duplicated'));
    }

    /**
     * Publish a post.
     */
    public function publish(Post $post): RedirectResponse
    {
        $this->postService->publish($post);

        return redirect()
            ->back()
            ->with('success', __('cms.posts.published'));
    }

    /**
     * Unpublish a post (set back to draft).
     */
    public function unpublish(Post $post): RedirectResponse
    {
        $this->postService->unpublish($post);

        return redirect()
            ->back()
            ->with('success', __('cms.posts.unpublished'));
    }

    /**
     * Submit a post for review.
     */
    public function submitForReview(Post $post): RedirectResponse
    {
        $this->postService->submitForReview($post);

        return redirect()
            ->back()
            ->with('success', __('cms.posts.submitted_for_review'));
    }

    /**
     * Approve a post.
     */
    public function approve(Post $post): RedirectResponse
    {
        $this->postService->approve($post);

        return redirect()
            ->back()
            ->with('success', __('cms.posts.approved'));
    }

    /**
     * Reject a post with reason.
     */
    public function reject(Request $request, Post $post): RedirectResponse
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:1000'],
        ]);

        $this->postService->reject($post, $validated['reason']);

        return redirect()
            ->back()
            ->with('success', __('cms.posts.rejected'));
    }

    /**
     * Perform a bulk action on multiple posts.
     */
    public function bulk(Request $request): RedirectResponse
    {
        $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer|exists:posts,id',
            'action' => 'required|in:publish,draft,delete,restore',
        ]);

        $count = $this->postService->bulkAction($request->input('ids'), $request->input('action'));

        return redirect()->back()->with('success', __('cms.bulk_action_success', ['count' => $count]));
    }

    /**
     * List revisions for a post (JSON).
     */
    public function revisions(Post $post): JsonResponse
    {
        $revisions = $post->revisions()
            ->with('creator:id,name')
            ->orderByDesc('created_at')
            ->get(['id', 'data', 'reason', 'created_by', 'created_at']);

        return response()->json(['revisions' => $revisions]);
    }

    /**
     * Compare two revisions (JSON).
     */
    public function compareRevisions(Post $post, Revision $revision, Revision $compare): JsonResponse
    {
        $oldData = $compare->data;
        $newData = $revision->data;

        $changes = [];
        $allKeys = array_unique(array_merge(array_keys($oldData ?? []), array_keys($newData ?? [])));

        foreach ($allKeys as $key) {
            $old = $oldData[$key] ?? null;
            $new = $newData[$key] ?? null;
            if ($old !== $new) {
                $changes[$key] = ['old' => $old, 'new' => $new];
            }
        }

        return response()->json([
            'revision' => $revision,
            'compare' => $compare,
            'changes' => $changes,
        ]);
    }

    /**
     * Restore a post to a specific revision.
     */
    public function restoreRevision(Post $post, Revision $revision): RedirectResponse
    {
        $data = $revision->data;
        unset($data['type']);

        $this->postService->update($post, $data);

        return redirect()
            ->back()
            ->with('success', __('cms.posts.revision_restored'));
    }

    /**
     * Check out a post for editing (acquire content lock).
     */
    public function checkout(Post $post): JsonResponse
    {
        $post->update([
            'checked_out_by' => auth()->id(),
            'checked_out_at' => now(),
        ]);

        return response()->json(['success' => true]);
    }

    /**
     * Check in a post (release content lock).
     */
    public function checkin(Post $post): JsonResponse
    {
        if ($post->checked_out_by === auth()->id()) {
            $post->update([
                'checked_out_by' => null,
                'checked_out_at' => null,
            ]);
        }

        return response()->json(['success' => true]);
    }

    /**
     * Generate a shareable preview link for a post.
     */
    public function generatePreview(Post $post): JsonResponse
    {
        $token = PreviewToken::create([
            'previewable_type' => Post::class,
            'previewable_id' => $post->id,
            'token' => bin2hex(random_bytes(32)),
            'expires_at' => now()->addHours(48),
            'created_by' => auth()->id(),
            'created_at' => now(),
        ]);

        return response()->json([
            'url' => route('preview', $token->token),
            'expires_at' => $token->expires_at->toISOString(),
        ]);
    }
}
