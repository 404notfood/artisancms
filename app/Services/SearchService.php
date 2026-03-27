<?php

declare(strict_types=1);

namespace App\Services;

use App\CMS\Blocks\BlockTextExtractor;
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
     * Search across all content types and merge results sorted by relevance.
     *
     * @return array{results: array<int, array<string, mixed>>, total: int, query: string}
     */
    public function searchAll(string $query, int $limit = 20): array
    {
        $minLength = (int) config('cms.search.min_query_length', 2);

        if (mb_strlen($query) < $minLength) {
            return ['results' => [], 'total' => 0, 'query' => $query];
        }

        $pages = $this->searchPages($query, $limit);
        $posts = $this->searchPosts($query, $limit);

        $merged = $pages->concat($posts)
            ->sortByDesc(fn (array $item): int => $this->computeRelevance($item, $query))
            ->take($limit)
            ->values();

        return [
            'results' => $merged->toArray(),
            'total' => $pages->count() + $posts->count(),
            'query' => $query,
        ];
    }

    /**
     * Search pages using Scout when available, LIKE fallback otherwise.
     *
     * @return Collection<int, array<string, mixed>>
     */
    private function searchPages(string $query, int $limit): Collection
    {
        if ($this->useScoutDriver()) {
            return $this->searchPagesWithScout($query, $limit);
        }

        return $this->searchPagesWithLike($query, $limit);
    }

    /**
     * Search posts using Scout when available, LIKE fallback otherwise.
     *
     * @return Collection<int, array<string, mixed>>
     */
    private function searchPosts(string $query, int $limit): Collection
    {
        if ($this->useScoutDriver()) {
            return $this->searchPostsWithScout($query, $limit);
        }

        return $this->searchPostsWithLike($query, $limit);
    }

    // ---- Scout implementations ----

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function searchPagesWithScout(string $query, int $limit): Collection
    {
        return Page::search($query)
            ->where('status', 'published')
            ->take($limit)
            ->get()
            ->map(fn (Page $p): array => $this->formatPage($p));
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function searchPostsWithScout(string $query, int $limit): Collection
    {
        return Post::search($query)
            ->where('status', 'published')
            ->take($limit)
            ->get()
            ->map(fn (Post $p): array => $this->formatPost($p));
    }

    // ---- LIKE fallback implementations ----

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function searchPagesWithLike(string $query, int $limit): Collection
    {
        $term = '%' . $this->escapeLike($query) . '%';

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
            ->map(fn (Page $p): array => $this->formatPage($p));
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function searchPostsWithLike(string $query, int $limit): Collection
    {
        $term = '%' . $this->escapeLike($query) . '%';

        return Post::where('status', 'published')
            ->where(function ($q) use ($term): void {
                $q->where('title', 'like', $term)
                    ->orWhere('slug', 'like', $term)
                    ->orWhere('excerpt', 'like', $term)
                    ->orWhere('meta_title', 'like', $term)
                    ->orWhere('meta_keywords', 'like', $term);
            })
            ->orderByRaw("CASE WHEN title LIKE ? THEN 0 ELSE 1 END", [$term])
            ->limit($limit)
            ->get()
            ->map(fn (Post $p): array => $this->formatPost($p));
    }

    // ---- Formatting ----

    /**
     * @return array<string, mixed>
     */
    private function formatPage(Page $page): array
    {
        return [
            'type' => 'page',
            'id' => $page->id,
            'title' => $page->title,
            'slug' => $page->slug,
            'excerpt' => $page->meta_description
                ?? Str::limit(BlockTextExtractor::extract($page->content), 160),
            'url' => "/{$page->slug}",
            'published_at' => $page->published_at?->toIso8601String(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function formatPost(Post $post): array
    {
        return [
            'type' => 'post',
            'id' => $post->id,
            'title' => $post->title,
            'slug' => $post->slug,
            'excerpt' => $post->excerpt
                ?? Str::limit(BlockTextExtractor::extract($post->content), 160),
            'url' => "/blog/{$post->slug}",
            'published_at' => $post->published_at?->toIso8601String(),
        ];
    }

    // ---- Helpers ----

    /**
     * Determine whether a real Scout driver (not null/database) is configured.
     */
    private function useScoutDriver(): bool
    {
        $driver = config('scout.driver');

        return $driver !== null && $driver !== 'null';
    }

    /**
     * Escape LIKE wildcards to prevent injection via % and _ characters.
     */
    private function escapeLike(string $value): string
    {
        return str_replace(['%', '_'], ['\\%', '\\_'], $value);
    }

    /**
     * Compute a simple relevance score for merging results from different types.
     *
     * @param array<string, mixed> $item
     */
    private function computeRelevance(array $item, string $query): int
    {
        $score = 0;
        $lowerQuery = mb_strtolower($query);

        $title = mb_strtolower((string) ($item['title'] ?? ''));
        if ($title === $lowerQuery) {
            $score += 100;
        } elseif (str_starts_with($title, $lowerQuery)) {
            $score += 75;
        } elseif (str_contains($title, $lowerQuery)) {
            $score += 50;
        }

        $slug = mb_strtolower((string) ($item['slug'] ?? ''));
        if (str_contains($slug, $lowerQuery)) {
            $score += 20;
        }

        $excerpt = mb_strtolower((string) ($item['excerpt'] ?? ''));
        if (str_contains($excerpt, $lowerQuery)) {
            $score += 10;
        }

        return $score;
    }
}
