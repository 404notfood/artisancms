<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\MediaRequest;
use App\Http\Requests\MediaUploadRequest;
use App\Models\Media;
use App\Services\MediaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MediaController extends Controller
{
    public function __construct(
        private readonly MediaService $mediaService,
    ) {}

    /**
     * Display a paginated grid/list of media files.
     */
    public function index(Request $request): Response
    {
        $filters = $request->only(['search', 'mime_type', 'folder', 'sort_by', 'sort_dir', 'per_page']);

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
}
