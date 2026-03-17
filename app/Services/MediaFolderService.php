<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Media;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;

class MediaFolderService
{
    /**
     * Get virtual folder tree based on media paths.
     *
     * @return array<int, array{name: string, path: string, count: int}>
     */
    public function getFolderTree(): array
    {
        $folders = Media::selectRaw("SUBSTRING_INDEX(disk_path, '/', -2) as folder_path")
            ->whereNotNull('disk_path')
            ->groupBy('folder_path')
            ->get()
            ->pluck('folder_path')
            ->unique()
            ->values();

        $tree = [];
        foreach ($folders as $path) {
            $parts = explode('/', $path);
            $name = $parts[0] ?? 'media';
            $tree[] = [
                'name' => $name,
                'path' => $path,
                'count' => Media::where('disk_path', 'LIKE', $path . '%')->count(),
            ];
        }

        return $tree;
    }

    /**
     * Get media in a specific virtual folder.
     */
    public function getMediaInFolder(string $folder): Collection
    {
        return Media::where('disk_path', 'LIKE', $folder . '%')
            ->latest()
            ->get();
    }

    /**
     * Move a media file to a different virtual folder.
     */
    public function moveToFolder(Media $media, string $targetFolder): Media
    {
        $filename = basename($media->disk_path ?? $media->filename);
        $newPath = rtrim($targetFolder, '/') . '/' . $filename;

        if ($media->disk_path && Storage::disk('public')->exists($media->disk_path)) {
            Storage::disk('public')->move($media->disk_path, $newPath);
        }

        $media->update(['disk_path' => $newPath]);

        return $media;
    }
}
