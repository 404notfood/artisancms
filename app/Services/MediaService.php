<?php

declare(strict_types=1);

namespace App\Services;

use App\CMS\Facades\CMS;
use App\Models\Media;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MediaService
{
    public function __construct(
        private readonly ImageOptimizer $optimizer,
    ) {}

    /**
     * Upload a file, store it, and create a Media record.
     */
    public function upload(UploadedFile $file, ?string $folder = null): Media
    {
        $disk = 'public';
        $folder = $folder ?? 'media/' . now()->format('Y/m');

        $originalName = $file->getClientOriginalName();
        $extension = $file->getClientOriginalExtension();
        $basename = Str::slug(pathinfo($originalName, PATHINFO_FILENAME)) . '-' . Str::random(8);

        $mimeType = $file->getMimeType() ?? 'application/octet-stream';
        $metadata = ['extension' => $extension];
        $thumbnails = [];
        $path = null;

        // For rasterized images: run through optimizer
        $isOptimizableImage = str_starts_with($mimeType, 'image/')
            && !in_array($mimeType, ['image/svg+xml', 'image/gif']);

        if ($isOptimizableImage && $file->isValid() && $file->getRealPath() !== false) {
            try {
                $result = $this->optimizer->process($file, "{$folder}/{$basename}");

                $path = $result['original'] ?? $result['path'] ?? null;

                // Collect metadata
                $optMeta = $result['metadata'] ?? [];
                $metadata['width']            = $result['width']  ?? $optMeta['width']  ?? null;
                $metadata['height']           = $result['height'] ?? $optMeta['height'] ?? null;
                $metadata['original_size']    = $optMeta['original_size']    ?? $file->getSize();
                $metadata['optimized_size']   = $optMeta['optimized_size']   ?? null;
                $metadata['savings_percent']  = $optMeta['savings_percent']  ?? null;

                // Collect generated size paths as thumbnails
                foreach ($result as $key => $value) {
                    if (is_string($value) && $key !== 'original' && $key !== 'path' && $key !== 'webp_path' && $key !== 'webp') {
                        $thumbnails[$key] = $value;
                    }
                }
            } catch (\Throwable $e) {
                Log::warning('Image optimizer failed, using fallback upload', [
                    'file' => $originalName,
                    'error' => $e->getMessage(),
                ]);
                $path = null;
            }
        }

        // Fallback: plain file store (non-image or optimizer failure)
        if ($path === null) {
            $filename = "{$basename}.{$extension}";
            $storagePath = $folder . '/' . $filename;

            // Try getRealPath first, then getPathname
            $sourcePath = $file->getRealPath();
            if ($sourcePath === false || $sourcePath === '' || !file_exists($sourcePath)) {
                $sourcePath = $file->getPathname();
            }

            if ($sourcePath && $sourcePath !== '' && file_exists($sourcePath)) {
                Storage::disk($disk)->put($storagePath, fopen($sourcePath, 'r'));
            } else {
                // Last resort: read content directly
                Storage::disk($disk)->put($storagePath, $file->getContent());
            }

            $path = $storagePath;
        }

        $filename = basename((string)$path);

        // For non-optimized images, get dimensions
        if (str_starts_with($mimeType, 'image/') && empty($metadata['width'])) {
            $imagePath = Storage::disk($disk)->path((string)$path);
            $imageSize = @getimagesize($imagePath);
            if ($imageSize !== false) {
                $metadata['width']  = $imageSize[0];
                $metadata['height'] = $imageSize[1];
            }
        }

        $media = Media::create([
            'filename'          => $filename,
            'original_filename' => $originalName,
            'path'              => $path,
            'disk'              => $disk,
            'mime_type'         => $mimeType,
            'size'              => $file->getSize(),
            'alt_text'          => null,
            'title'             => pathinfo($originalName, PATHINFO_FILENAME),
            'caption'           => null,
            'metadata'          => $metadata,
            'thumbnails'        => $thumbnails,
            'folder'            => $folder,
            'uploaded_by'       => Auth::id(),
        ]);

        CMS::fire('media.uploaded', $media);

        return $media;
    }

    /**
     * Find a media record by ID or throw.
     *
     * @throws ModelNotFoundException
     */
    public function find(int $id): Media
    {
        return Media::with('uploader')->findOrFail($id);
    }

    /**
     * Get paginated media with optional filtering.
     *
     * @param array<string, mixed> $filters
     * @return LengthAwarePaginator<Media>
     */
    public function all(array $filters = []): LengthAwarePaginator
    {
        $query = Media::with('uploader');

        if (isset($filters['search']) && $filters['search'] !== '') {
            $search = $filters['search'];
            $query->where(function ($q) use ($search): void {
                $q->where('original_filename', 'like', "%{$search}%")
                    ->orWhere('title', 'like', "%{$search}%")
                    ->orWhere('alt_text', 'like', "%{$search}%");
            });
        }

        if (isset($filters['mime_type']) && $filters['mime_type'] !== '') {
            if (str_contains($filters['mime_type'], '/')) {
                $query->where('mime_type', $filters['mime_type']);
            } else {
                // Filter by category (e.g., 'image', 'video', 'application')
                $query->where('mime_type', 'like', $filters['mime_type'] . '/%');
            }
        }

        if (isset($filters['folder']) && $filters['folder'] !== '') {
            $query->where('folder', $filters['folder']);
        }

        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortDir = $filters['sort_dir'] ?? 'desc';
        $query->orderBy($sortBy, $sortDir);

        $perPage = (int) ($filters['per_page'] ?? 24);

        return $query->paginate($perPage);
    }

    /**
     * Update media metadata.
     *
     * @param array<string, mixed> $data
     */
    public function update(Media $media, array $data): Media
    {
        $media->update($data);

        CMS::fire('media.updated', $media);

        return $media->fresh() ?? $media;
    }

    /**
     * Delete a media record and its file from disk.
     */
    public function delete(Media $media): bool
    {
        CMS::fire('media.deleting', $media);

        $disk = $media->disk ?? 'public';

        // Delete the main file
        if (Storage::disk($disk)->exists($media->path)) {
            Storage::disk($disk)->delete($media->path);
        }

        // Delete thumbnails
        if (is_array($media->thumbnails)) {
            foreach ($media->thumbnails as $thumbnailPath) {
                if (is_string($thumbnailPath) && Storage::disk($disk)->exists($thumbnailPath)) {
                    Storage::disk($disk)->delete($thumbnailPath);
                }
            }
        }

        $deleted = (bool) $media->delete();

        if ($deleted) {
            CMS::fire('media.deleted', $media);
        }

        return $deleted;
    }

    /**
     * Crop an image to given pixel dimensions and save as new file.
     *
     * @param array{x: int, y: int, width: int, height: int} $cropData
     */
    public function crop(Media $media, array $cropData): Media
    {
        $disk = $media->disk ?? 'public';
        $sourcePath = Storage::disk($disk)->path($media->path);

        if (!file_exists($sourcePath)) {
            throw new \RuntimeException('Source file not found');
        }

        $imageInfo = getimagesize($sourcePath);
        if ($imageInfo === false) {
            throw new \RuntimeException('Not a valid image');
        }

        $mimeType = $imageInfo['mime'];
        $sourceImage = match ($mimeType) {
            'image/jpeg' => imagecreatefromjpeg($sourcePath),
            'image/png'  => imagecreatefrompng($sourcePath),
            'image/webp' => imagecreatefromwebp($sourcePath),
            default      => throw new \RuntimeException("Unsupported image format: {$mimeType}"),
        };

        if ($sourceImage === false) {
            throw new \RuntimeException('Failed to load image');
        }

        $cropped = imagecrop($sourceImage, [
            'x'      => max(0, $cropData['x']),
            'y'      => max(0, $cropData['y']),
            'width'  => max(1, $cropData['width']),
            'height' => max(1, $cropData['height']),
        ]);

        imagedestroy($sourceImage);

        if ($cropped === false) {
            throw new \RuntimeException('Crop failed');
        }

        // Overwrite the original file
        match ($mimeType) {
            'image/jpeg' => imagejpeg($cropped, $sourcePath, 90),
            'image/png'  => imagepng($cropped, $sourcePath, 6),
            'image/webp' => imagewebp($cropped, $sourcePath, 85),
            default      => null,
        };

        $newWidth = imagesx($cropped);
        $newHeight = imagesy($cropped);
        $newSize = filesize($sourcePath);
        imagedestroy($cropped);

        // Update metadata
        $metadata = is_array($media->metadata) ? $media->metadata : [];
        $metadata['width'] = $newWidth;
        $metadata['height'] = $newHeight;
        $metadata['cropped'] = true;

        $media->update([
            'size'     => $newSize,
            'metadata' => $metadata,
        ]);

        CMS::fire('media.cropped', $media);

        return $media->fresh() ?? $media;
    }

    /**
     * Replace a media file keeping the same record.
     */
    public function replace(Media $media, UploadedFile $file): Media
    {
        $oldPath = $media->path;

        $newPath = $file->storeAs(
            dirname($oldPath ?: 'media'),
            $file->hashName(),
            'public',
        );

        if ($oldPath && Storage::disk('public')->exists($oldPath)) {
            Storage::disk('public')->delete($oldPath);
        }

        $media->update([
            'path' => $newPath,
            'filename' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
        ]);

        CMS::fire('media.replaced', $media);

        return $media->fresh() ?? $media;
    }

    /**
     * Get media items formatted for the picker (AJAX).
     *
     * @param array<string, mixed> $filters
     * @return \Illuminate\Support\Collection<int, array<string, mixed>>
     */
    public function getForPicker(array $filters = []): \Illuminate\Support\Collection
    {
        $query = Media::query()->orderByDesc('created_at');

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('filename', 'like', "%{$search}%")
                  ->orWhere('alt_text', 'like', "%{$search}%");
            });
        }

        if (!empty($filters['mime_type'])) {
            $query->where('mime_type', 'like', "{$filters['mime_type']}/%");
        }

        return $query->limit(40)->get()->map(fn (Media $m) => [
            'id' => $m->id,
            'url' => $m->url,
            'alt' => $m->alt_text ?? '',
            'filename' => $m->filename,
            'mime_type' => $m->mime_type,
            'thumbnail_url' => $m->url,
        ]);
    }

}
