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
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
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
        $filters = $request->only(['search', 'mime_type', 'folder', 'sort_by', 'sort_dir', 'per_page']);

        // JSON response for media picker (AJAX)
        if ($request->wantsJson() || $request->has('json')) {
            $query = Media::query()->orderByDesc('created_at');

            if ($search = $request->input('search')) {
                $query->where(function ($q) use ($search) {
                    $q->where('filename', 'like', "%{$search}%")
                      ->orWhere('alt_text', 'like', "%{$search}%");
                });
            }

            if ($type = $request->input('type')) {
                $query->where('mime_type', 'like', "{$type}/%");
            }

            $media = $query->limit(40)->get()->map(fn (Media $m) => [
                'id' => $m->id,
                'url' => $m->url,
                'alt' => $m->alt_text ?? '',
                'filename' => $m->filename,
                'mime_type' => $m->mime_type,
                'thumbnail_url' => $m->url,
            ]);

            return response()->json($media);
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

        $file = $request->file('file');
        $oldPath = $media->disk_path;

        // Store new file
        $newPath = $file->storeAs(
            dirname($oldPath ?: 'media'),
            $file->hashName(),
            'public',
        );

        // Delete old file
        if ($oldPath && Storage::disk('public')->exists($oldPath)) {
            Storage::disk('public')->delete($oldPath);
        }

        $media->update([
            'disk_path' => $newPath,
            'filename' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
        ]);

        return response()->json([
            'success' => true,
            'url' => $media->url,
            'media' => $media->fresh(),
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
            $response = Http::timeout(30)->get($validated['url']);

            if (!$response->successful()) {
                return response()->json(['success' => false, 'error' => 'Download failed'], 422);
            }

            $filename = $validated['filename'];
            $path = 'media/' . date('Y/m') . '/' . $filename;

            Storage::disk('public')->put($path, $response->body());

            $media = Media::create([
                'filename' => $filename,
                'original_filename' => $filename,
                'disk_path' => $path,
                'mime_type' => $response->header('Content-Type', 'image/jpeg'),
                'size' => strlen($response->body()),
                'alt_text' => 'Photo by ' . ($validated['author'] ?? 'Unknown'),
                'uploaded_by' => auth()->id(),
            ]);

            return response()->json([
                'success' => true,
                'media' => $media,
            ]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }
}
