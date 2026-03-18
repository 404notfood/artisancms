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
        $folders = Media::whereNotNull('folder')
            ->where('folder', '!=', '')
            ->selectRaw('folder, COUNT(*) as media_count')
            ->groupBy('folder')
            ->orderBy('folder')
            ->get();

        $tree = [];
        foreach ($folders as $row) {
            $folder = $row->folder;
            $parts = explode('/', $folder);
            $name = implode('/', $parts);
            $tree[] = [
                'name' => $name,
                'path' => $folder,
                'count' => (int) $row->media_count,
            ];
        }

        return $tree;
    }

    /**
     * Get media in a specific virtual folder.
     */
    public function getMediaInFolder(string $folder): Collection
    {
        return Media::where('folder', $folder)
            ->latest()
            ->get();
    }

    /**
     * Move a media file to a different virtual folder.
     */
    public function moveToFolder(Media $media, string $targetFolder): Media
    {
        $filename = basename($media->path ?? $media->filename);
        $newPath = rtrim($targetFolder, '/') . '/' . $filename;

        if ($media->path && Storage::disk('public')->exists($media->path)) {
            Storage::disk('public')->move($media->path, $newPath);
        }

        $media->update(['path' => $newPath]);

        return $media;
    }
}
