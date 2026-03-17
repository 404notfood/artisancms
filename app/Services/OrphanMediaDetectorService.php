<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Media;
use App\Models\Page;
use App\Models\Post;
use Illuminate\Support\Collection;

class OrphanMediaDetectorService
{
    /**
     * Find media files that are not referenced anywhere in content.
     *
     * @return Collection<int, Media>
     */
    public function findOrphans(): Collection
    {
        $allMedia = Media::all();
        $usedUrls = $this->collectUsedUrls();

        return $allMedia->filter(function (Media $media) use ($usedUrls) {
            $url = $media->url ?? '';
            $filename = $media->filename ?? '';

            // Check if the media URL or filename appears in any content
            return !$usedUrls->contains(fn (string $content) =>
                str_contains($content, $url) || str_contains($content, $filename)
            );
        })->values();
    }

    /**
     * Collect all content strings that may reference media.
     *
     * @return Collection<int, string>
     */
    private function collectUsedUrls(): Collection
    {
        $contentStrings = collect();

        // Pages content (JSON)
        Page::whereNotNull('content')
            ->chunk(100, function ($pages) use ($contentStrings) {
                foreach ($pages as $page) {
                    $contentStrings->push(
                        is_string($page->content) ? $page->content : json_encode($page->content)
                    );
                }
            });

        // Posts content
        Post::whereNotNull('content')
            ->chunk(100, function ($posts) use ($contentStrings) {
                foreach ($posts as $post) {
                    $contentStrings->push(
                        is_string($post->content) ? $post->content : json_encode($post->content)
                    );
                }
            });

        return $contentStrings;
    }

    /**
     * Count orphaned media files.
     */
    public function countOrphans(): int
    {
        return $this->findOrphans()->count();
    }
}
