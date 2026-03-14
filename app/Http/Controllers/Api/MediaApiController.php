<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Helpers\ApiResponse;
use App\Http\Requests\MediaRequest;
use App\Http\Requests\MediaUploadRequest;
use App\Models\Media;
use App\Services\MediaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class MediaApiController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly MediaService $mediaService,
    ) {}

    /**
     * List media with filters and pagination.
     *
     * GET /api/media
     */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->only([
            'search',
            'mime_type',
            'folder',
            'sort_by',
            'sort_dir',
            'per_page',
        ]);

        // Map 'sort' and 'order' aliases if provided
        if ($request->has('sort') && !$request->has('sort_by')) {
            $filters['sort_by'] = $request->input('sort');
        }
        if ($request->has('order') && !$request->has('sort_dir')) {
            $filters['sort_dir'] = $request->input('order');
        }

        $media = $this->mediaService->all($filters);

        return $this->success($media);
    }

    /**
     * Upload a new media file.
     *
     * POST /api/media
     */
    public function store(MediaUploadRequest $request): JsonResponse
    {
        $media = $this->mediaService->upload(
            $request->file('file'),
            $request->input('folder'),
        );

        return $this->created([
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
        ]);
    }

    /**
     * Update media metadata.
     *
     * PUT /api/media/{media}
     */
    public function update(MediaRequest $request, Media $media): JsonResponse
    {
        $updatedMedia = $this->mediaService->update($media, $request->validated());

        return $this->success([
            'id' => $updatedMedia->id,
            'filename' => $updatedMedia->filename,
            'original_filename' => $updatedMedia->original_filename,
            'path' => $updatedMedia->path,
            'url' => $updatedMedia->url,
            'mime_type' => $updatedMedia->mime_type,
            'size' => $updatedMedia->size,
            'alt_text' => $updatedMedia->alt_text,
            'title' => $updatedMedia->title,
            'caption' => $updatedMedia->caption,
            'metadata' => $updatedMedia->metadata,
            'thumbnails' => $updatedMedia->thumbnails,
        ], __('cms.media.updated'));
    }

    /**
     * Delete a media file and its record.
     *
     * DELETE /api/media/{media}
     */
    public function destroy(Media $media): Response
    {
        $this->mediaService->delete($media);

        return response()->noContent();
    }
}
