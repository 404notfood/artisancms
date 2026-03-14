<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Page;
use App\Models\Post;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class SearchService
{
    /**
     * Global search across pages and posts.
     *
     * @return array{results: array<int, array<string, mixed>>, total: int, query: string}
     */
    public function search(string $query, int $perPage = 20, ?string $type = null): array
    {
        $minLength = (int) config('cms.search.min_query_length', 2);

        if (mb_strlen($query) < $minLength) {
            return ['results' => [], 'total' => 0, 'query' => $query];
        }

        $results = collect();
        $searchableTypes = config('cms.search.searchable_types', ['pages', 'posts']);

        if ($type === 'all' || $type === null) {
            $searchTypes = $searchableTypes;
        } else {
            $searchTypes = in_array($type, $searchableTypes) ? [$type] : [];
        }

        if (in_array('pages', $searchTypes)) {
            $pages = $this->searchPages($query, $perPage);
            $results = $results->concat($pages);
        }

        if (in_array('posts', $searchTypes)) {
            $posts = $this->searchPosts($query, $perPage);
            $results = $results->concat($posts);
        }

        return [
            'results' => $results->take($perPage)->values()->toArray(),
            'total' => $results->count(),
            'query' => $query,
        ];
    }

    /**
     * Search pages using LIKE queries (database driver).
     *
     * @return Collection<int, array<string, mixed>>
     */
    private function searchPages(string $query, int $limit): Collection
    {
        $term = '%' . $query . '%';

        return Page::where('status', 'published')
            ->where(function ($q) use ($term): void {
                $q->where('title', 'like', $term)
                    ->orWhere('slug', 'like', $term)
                    ->orWhere('meta_title', 'like', $term)
                    ->orWhere('meta_description', 'like', $term);
            })
            ->orderByRaw("CASE WHEN title LIKE ? THEN 0 ELSE 1 END", [$term])
            ->limit($limit)
            ->get()
            ->map(fn (Page $p): array => [
                'type' => 'page',
                'id' => $p->id,
                'title' => $p->title,
                'slug' => $p->slug,
                'excerpt' => $p->meta_description ?? Str::limit($this->extractTextFromBlocks($p->content), 160),
                'url' => "/{$p->slug}",
                'published_at' => $p->published_at?->toIso8601String(),
            ]);
    }

    /**
     * Search posts using LIKE queries (database driver).
     *
     * @return Collection<int, array<string, mixed>>
     */
    private function searchPosts(string $query, int $limit): Collection
    {
        $term = '%' . $query . '%';

        return Post::where('status', 'published')
            ->where(function ($q) use ($term): void {
                $q->where('title', 'like', $term)
                    ->orWhere('slug', 'like', $term)
                    ->orWhere('excerpt', 'like', $term);
            })
            ->orderByRaw("CASE WHEN title LIKE ? THEN 0 ELSE 1 END", [$term])
            ->limit($limit)
            ->get()
            ->map(fn (Post $p): array => [
                'type' => 'post',
                'id' => $p->id,
                'title' => $p->title,
                'slug' => $p->slug,
                'excerpt' => $p->excerpt ?? Str::limit($this->extractTextFromBlocks($p->content), 160),
                'url' => "/blog/{$p->slug}",
                'published_at' => $p->published_at?->toIso8601String(),
            ]);
    }

    /**
     * Extract plain text from a page/post block tree.
     *
     * @param array<string, mixed>|null $content
     */
    private function extractTextFromBlocks(?array $content): string
    {
        if (!$content || !isset($content['blocks'])) {
            return '';
        }

        return trim($this->extractTextRecursive($content['blocks']));
    }

    /**
     * Recursively extract text from blocks.
     *
     * @param array<int, array<string, mixed>> $blocks
     */
    private function extractTextRecursive(array $blocks): string
    {
        $text = '';

        foreach ($blocks as $block) {
            if (isset($block['props']['text'])) {
                $text .= ' ' . strip_tags((string) $block['props']['text']);
            }
            if (isset($block['props']['html'])) {
                $text .= ' ' . strip_tags((string) $block['props']['html']);
            }
            if (!empty($block['children']) && is_array($block['children'])) {
                $text .= $this->extractTextRecursive($block['children']);
            }
        }

        return $text;
    }
}
