<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\PageRequest;
use App\Models\Page;
use App\Models\PreviewToken;
use App\Models\Revision;
use App\Services\ContentSanitizer;
use App\Services\PageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PageController extends Controller
{
    public function __construct(
        private readonly PageService $pageService,
        private readonly ContentSanitizer $sanitizer,
    ) {}

    /**
     * Display a paginated list of pages with filters.
     */
    public function index(Request $request): Response
    {
        $filters = $request->only(['status', 'search', 'parent_id', 'sort_by', 'sort_dir', 'per_page']);

        $pages = $this->pageService->all($filters);

        return Inertia::render('Admin/Pages/Index', [
            'pages' => $pages,
            'filters' => $filters,
        ]);
    }

    /**
     * Show the form for creating a new page.
     */
    public function create(): Response
    {
        $parentPages = Page::whereNull('parent_id')
            ->orderBy('title')
            ->get(['id', 'title']);

        return Inertia::render('Admin/Pages/Create', [
            'parentPages' => $parentPages,
        ]);
    }

    /**
     * Store a newly created page.
     */
    public function store(PageRequest $request): RedirectResponse
    {
        $this->pageService->create($request->validated());

        return redirect()
            ->route('admin.pages.index')
            ->with('success', __('cms.pages.created'));
    }

    /**
     * Show the form for editing a page.
     */
    public function edit(Page $page): Response
    {
        $page->load(['author', 'parent', 'children', 'revisions', 'terms']);

        $parentPages = Page::where('id', '!=', $page->id)
            ->whereNull('parent_id')
            ->orderBy('title')
            ->get(['id', 'title']);

        return Inertia::render('Admin/Pages/Edit', [
            'page' => $page,
            'parentPages' => $parentPages,
        ]);
    }

    /**
     * Update the specified page.
     */
    public function update(PageRequest $request, Page $page): RedirectResponse
    {
        $this->pageService->update($page, $request->validated());

        return redirect()
            ->back()
            ->with('success', __('cms.pages.updated'));
    }

    /**
     * Soft delete the specified page.
     */
    public function destroy(Page $page): RedirectResponse
    {
        $this->pageService->delete($page);

        return redirect()
            ->route('admin.pages.index')
            ->with('success', __('cms.pages.deleted'));
    }

    /**
     * Restore a soft-deleted page.
     */
    public function restore(Page $page): RedirectResponse
    {
        $this->pageService->restore($page);

        return redirect()
            ->back()
            ->with('success', __('cms.pages.restored'));
    }

    /**
     * Move a page to trash (alias for destroy).
     */
    public function trash(Page $page): RedirectResponse
    {
        $this->pageService->delete($page);

        return redirect()
            ->back()
            ->with('success', __('cms.pages.trashed'));
    }

    /**
     * Permanently delete a page.
     */
    public function forceDelete(Page $page): RedirectResponse
    {
        $page->revisions()->delete();
        $page->forceDelete();

        return redirect()
            ->back()
            ->with('success', __('cms.pages.force_deleted'));
    }

    /**
     * Empty the trash (permanently delete all trashed pages).
     */
    public function emptyTrash(): RedirectResponse
    {
        $trashedPages = Page::where('status', 'trash')->get();

        foreach ($trashedPages as $page) {
            $page->revisions()->delete();
            $page->forceDelete();
        }

        return redirect()
            ->back()
            ->with('success', __('cms.pages.trash_emptied'));
    }

    /**
     * Duplicate a page.
     */
    public function duplicate(Page $page): RedirectResponse
    {
        $newPage = $page->replicate(['checked_out_by', 'checked_out_at']);
        $newPage->title = 'Copie de ' . $page->title;
        $newPage->slug = $page->slug . '-copy';
        $newPage->status = 'draft';
        $newPage->published_at = null;
        $newPage->save();

        return redirect()
            ->route('admin.pages.edit', $newPage)
            ->with('success', __('cms.pages.duplicated'));
    }

    /**
     * Publish a page.
     */
    public function publish(Page $page): RedirectResponse
    {
        $this->pageService->publish($page);

        return redirect()
            ->back()
            ->with('success', __('cms.pages.published'));
    }

    /**
     * Unpublish a page (set back to draft).
     */
    public function unpublish(Page $page): RedirectResponse
    {
        $this->pageService->unpublish($page);

        return redirect()
            ->back()
            ->with('success', __('cms.pages.unpublished'));
    }

    /**
     * Submit a page for review.
     */
    public function submitForReview(Page $page): RedirectResponse
    {
        $this->pageService->submitForReview($page);

        return redirect()
            ->back()
            ->with('success', __('cms.pages.submitted_for_review'));
    }

    /**
     * Approve a page.
     */
    public function approve(Page $page): RedirectResponse
    {
        $this->pageService->approve($page);

        return redirect()
            ->back()
            ->with('success', __('cms.pages.approved'));
    }

    /**
     * Reject a page with reason.
     */
    public function reject(Request $request, Page $page): RedirectResponse
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:1000'],
        ]);

        $this->pageService->reject($page, $validated['reason']);

        return redirect()
            ->back()
            ->with('success', __('cms.pages.rejected'));
    }

    /**
     * Show the page builder interface.
     */
    public function builder(Page $page): Response
    {
        return Inertia::render('Builder/Edit', [
            'page' => $page,
        ]);
    }

    /**
     * List revisions for a page (JSON).
     */
    public function revisions(Page $page): JsonResponse
    {
        $revisions = $page->revisions()
            ->with('creator:id,name')
            ->orderByDesc('created_at')
            ->get(['id', 'data', 'reason', 'created_by', 'created_at']);

        return response()->json(['revisions' => $revisions]);
    }

    /**
     * Compare two revisions (JSON).
     */
    public function compareRevisions(Page $page, Revision $revision, Revision $compare): JsonResponse
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
     * Restore a page to a specific revision.
     */
    public function restoreRevision(Page $page, Revision $revision): RedirectResponse
    {
        $data = $revision->data;
        unset($data['type']);

        $this->pageService->update($page, $data);

        return redirect()
            ->back()
            ->with('success', __('cms.pages.revision_restored'));
    }

    /**
     * Perform a bulk action on multiple pages.
     */
    public function bulk(Request $request): RedirectResponse
    {
        $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer|exists:pages,id',
            'action' => 'required|in:publish,draft,delete,restore',
        ]);

        $count = $this->pageService->bulkAction($request->input('ids'), $request->input('action'));

        return redirect()->back()->with('success', __('cms.bulk_action_success', ['count' => $count]));
    }

    /**
     * Check out a page for editing (acquire content lock).
     */
    public function checkout(Page $page): JsonResponse
    {
        $page->update([
            'checked_out_by' => auth()->id(),
            'checked_out_at' => now(),
        ]);

        return response()->json(['success' => true]);
    }

    /**
     * Check in a page (release content lock).
     */
    public function checkin(Page $page): JsonResponse
    {
        if ($page->checked_out_by === auth()->id()) {
            $page->update([
                'checked_out_by' => null,
                'checked_out_at' => null,
            ]);
        }

        return response()->json(['success' => true]);
    }

    /**
     * Save the page builder content.
     */
    public function updateBuilder(Request $request, Page $page): RedirectResponse
    {
        $validated = $request->validate([
            'content' => ['required', 'array'],
        ]);

        $content = $validated['content'];
        $isAdmin = $request->user()?->isAdmin() ?? false;

        if (isset($content['blocks']) && is_array($content['blocks'])) {
            $content['blocks'] = $this->sanitizer->sanitizeBlockTree($content['blocks'], $isAdmin);
        }

        $this->pageService->update($page, [
            'content' => $content,
        ]);

        return redirect()
            ->back()
            ->with('success', __('cms.pages.updated'));
    }

    /**
     * Generate a shareable preview link for a page.
     */
    public function generatePreview(Page $page): JsonResponse
    {
        $token = PreviewToken::create([
            'previewable_type' => Page::class,
            'previewable_id' => $page->id,
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
