<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\MediaRequest;
use App\Http\Requests\MediaUploadRequest;
use App\Models\Media;
use App\Services\MediaFolderService;
use App\Services\MediaService;
use App\Services\OrphanMediaDetectorService;
use App\Services\StockPhotoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MediaController extends Controller
{
    public function __construct(
        private readonly MediaService $mediaService,
        private readonly MediaFolderService $folderService,
        private readonly OrphanMediaDetectorService $orphanDetector,
        private readonly StockPhotoService $stockService,
    ) {}

    /**
     * Display a paginated grid/list of media files.
     */
    public function index(Request $request): Response|JsonResponse
    {
        $filters = $request->only(['search', 'mime_type', 'type', 'folder', 'sort_by', 'sort_dir', 'per_page']);

        // Map 'type' (frontend param) to 'mime_type' (service param)
        if (!empty($filters['type']) && empty($filters['mime_type'])) {
            $filters['mime_type'] = $filters['type'];
        }
        unset($filters['type']);

        // JSON response for media picker (AJAX)
        if ($request->wantsJson() || $request->has('json')) {
            return response()->json(
                $this->mediaService->getForPicker($filters),
            );
        }

        $media = $this->mediaService->all($filters);

        return Inertia::render('Admin/Media/Index', [
            'media' => $media,
            'filters' => $filters,
        ]);
    }

    /**
     * Upload a new media file (AJAX response).
     */
    public function store(MediaUploadRequest $request): JsonResponse
    {
        $media = $this->mediaService->upload(
            $request->file('file'),
            $request->input('folder'),
        );

        return response()->json([
            'success' => true,
            'media' => $media,
        ], 201);
    }

    /**
     * Return media details as JSON.
     */
    public function show(Media $media): JsonResponse
    {
        $media->load('uploader');

        return response()->json([
            'media' => $media,
        ]);
    }

    /**
     * Update media metadata.
     */
    public function update(MediaRequest $request, Media $media): RedirectResponse
    {
        $this->mediaService->update($media, $request->validated());

        return redirect()
            ->back()
            ->with('success', __('cms.media.updated'));
    }

    /**
     * Crop an image.
     */
    public function crop(Request $request, Media $media): JsonResponse
    {
        $validated = $request->validate([
            'x' => ['required', 'integer', 'min:0'],
            'y' => ['required', 'integer', 'min:0'],
            'width' => ['required', 'integer', 'min:1'],
            'height' => ['required', 'integer', 'min:1'],
        ]);

        $media = $this->mediaService->crop($media, $validated);

        return response()->json([
            'success' => true,
            'url' => $media->url,
            'media' => $media,
        ]);
    }

    /**
     * Delete a media file and its record.
     */
    public function destroy(Media $media): RedirectResponse
    {
        $this->mediaService->delete($media);

        return redirect()
            ->route('admin.media.index')
            ->with('success', __('cms.media.deleted'));
    }

    /**
     * Get virtual folder tree.
     */
    public function folders(): JsonResponse
    {
        return response()->json($this->folderService->getFolderTree());
    }

    /**
     * Replace a media file keeping the same record.
     */
    public function replace(Request $request, Media $media): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'max:20480'],
        ]);

        $media = $this->mediaService->replace($media, $request->file('file'));

        return response()->json([
            'success' => true,
            'url' => $media->url,
            'media' => $media,
        ]);
    }

    /**
     * Get orphaned media files.
     */
    public function orphans(): JsonResponse
    {
        $orphans = $this->orphanDetector->findOrphans();

        return response()->json([
            'orphans' => $orphans,
            'count' => $orphans->count(),
        ]);
    }

    /**
     * Search stock photos from Unsplash/Pexels.
     */
    public function stockSearch(Request $request): JsonResponse
    {
        $query = $request->input('query', '');
        $provider = $request->input('provider', 'unsplash');

        if (!$query) {
            return response()->json(['results' => []]);
        }

        $results = $provider === 'pexels'
            ? $this->stockService->searchPexels($query)
            : $this->stockService->searchUnsplash($query);

        return response()->json(['results' => $results]);
    }

    /**
     * Download a stock photo and add it to the media library.
     */
    public function stockDownload(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'url' => ['required', 'url'],
            'filename' => ['required', 'string', 'max:255'],
            'author' => ['string', 'max:255'],
        ]);

        try {
            $media = $this->stockService->download(
                $validated['url'],
                $validated['filename'],
                $validated['author'] ?? null,
                (int) auth()->id(),
            );

            return response()->json([
                'success' => true,
                'media' => $media,
            ]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }
}
