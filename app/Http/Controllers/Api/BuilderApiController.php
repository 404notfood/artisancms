<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Helpers\ApiResponse;
use App\Models\Page;
use App\Services\ContentSanitizer;
use App\Services\MediaService;
use App\Services\PageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BuilderApiController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly PageService $pageService,
        private readonly ContentSanitizer $sanitizer,
        private readonly MediaService $mediaService,
    ) {}

    /**
     * Save page builder content with revision.
     *
     * PUT /api/builder/pages/{page}/content
     */
    public function saveContent(Request $request, Page $page): JsonResponse
    {
        $validated = $request->validate([
            'content' => ['required', 'array'],
        ]);

        $content = $this->sanitizeContent($validated['content'], $request);

        $page = $this->pageService->update($page, [
            'content' => $content,
        ]);

        $latestRevision = $page->revisions()->latest()->first();

        return $this->success([
            'page_id' => $page->id,
            'revision_id' => $latestRevision?->id,
            'saved_at' => now()->toISOString(),
        ], __('cms.pages.updated'));
    }

    /**
     * Autosave page builder content (draft, no revision).
     *
     * POST /api/builder/pages/{page}/autosave
     */
    public function autosave(Request $request, Page $page): JsonResponse
    {
        $validated = $request->validate([
            'content' => ['required', 'array'],
        ]);

        $content = $this->sanitizeContent($validated['content'], $request);

        $page->update([
            'content' => $content,
        ]);

        return $this->success([
            'page_id' => $page->id,
            'autosaved_at' => now()->toISOString(),
        ]);
    }

    /**
     * Upload media from the builder (inline upload).
     *
     * POST /api/builder/media/upload
     */
    public function uploadMedia(Request $request): JsonResponse
    {
        $allowedMimes = config('cms.media.allowed_mimes', [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/svg+xml',
            'application/pdf',
            'video/mp4',
            'video/webm',
            'audio/mpeg',
            'audio/wav',
        ]);

        $maxSize = (int) config('cms.media.max_upload_size', 10240);

        $request->validate([
            'file' => [
                'required',
                'file',
                'max:' . $maxSize,
                function (string $attribute, mixed $value, \Closure $fail) use ($allowedMimes): void {
                    if ($value && method_exists($value, 'getMimeType')) {
                        $mime = $value->getMimeType();
                        if (!in_array($mime, $allowedMimes, true)) {
                            $fail(__('The :attribute has an invalid MIME type: :mime.', [
                                'attribute' => $attribute,
                                'mime' => $mime,
                            ]));
                        }
                    }
                },
            ],
            'folder' => ['nullable', 'string', 'max:255'],
        ]);

        $media = $this->mediaService->upload(
            $request->file('file'),
            $request->input('folder'),
        );

        return $this->created(self::formatMediaResponse($media));
    }

    /**
     * Duplicate a page with "(copie)" suffix.
     *
     * POST /api/admin/pages/{page}/duplicate
     */
    public function duplicatePage(Request $request, Page $page): JsonResponse
    {
        $newPage = $this->pageService->create([
            'title' => $page->title . ' (copie)',
            'slug' => $page->slug . '-copie',
            'content' => $page->content,
            'status' => 'draft',
            'template' => $page->template,
            'meta_title' => $page->meta_title,
            'meta_description' => $page->meta_description,
            'meta_keywords' => $page->meta_keywords,
            'og_image' => $page->og_image,
            'parent_id' => $page->parent_id,
            'order' => $page->order,
            'created_by' => Auth::id(),
        ]);

        return $this->created([
            'id' => $newPage->id,
            'title' => $newPage->title,
            'slug' => $newPage->slug,
            'status' => $newPage->status,
            'created_at' => $newPage->created_at?->toISOString(),
        ]);
    }

    /**
     * Reorder pages based on provided items array.
     *
     * POST /api/admin/pages/reorder
     */
    public function reorderPages(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'items' => ['required', 'array'],
            'items.*.id' => ['required', 'integer', 'exists:pages,id'],
            'items.*.order' => ['required', 'integer', 'min:0'],
            'items.*.parent_id' => ['nullable', 'integer', 'exists:pages,id'],
        ]);

        foreach ($validated['items'] as $item) {
            Page::where('id', $item['id'])->update([
                'order' => $item['order'],
                'parent_id' => $item['parent_id'] ?? null,
            ]);
        }

        return $this->success(null, __('cms.pages.reordered'));
    }

    // ── Private helpers ──────────────────────────

    /**
     * Sanitize content block tree, supporting both flat array and { blocks: [...] } formats.
     */
    private function sanitizeContent(array $content, Request $request): array
    {
        $isAdmin = $request->user()?->isAdmin() ?? false;

        // Content may be a flat block array or { blocks: [...] }
        if (isset($content['blocks']) && is_array($content['blocks'])) {
            $content['blocks'] = $this->sanitizer->sanitizeBlockTree($content['blocks'], $isAdmin);
        } elseif (isset($content[0])) {
            // Flat block array (sent directly from the builder)
            $content = $this->sanitizer->sanitizeBlockTree($content, $isAdmin);
        }

        return $content;
    }

    /**
     * Format a Media model into a standard API response array.
     */
    private static function formatMediaResponse(object $media): array
    {
        return [
            'id' => $media->id,
            'filename' => $media->filename,
            'original_filename' => $media->original_filename,
            'path' => $media->path,
            'url' => $media->url,
            'mime_type' => $media->mime_type,
            'size' => $media->size,
            'alt_text' => $media->alt_text,
            'title' => $media->title,
            'metadata' => $media->metadata,
            'thumbnails' => $media->thumbnails,
        ];
    }
}
