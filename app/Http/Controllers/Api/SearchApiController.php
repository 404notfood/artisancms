<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Page;
use App\Models\Post;
use App\Models\SearchLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchApiController extends Controller
{
    private const MAX_RESULTS_PER_TYPE = 5;

    public function search(Request $request): JsonResponse
    {
        $query = trim($request->input('q', ''));
        if (strlen($query) < 2) {
            return response()->json(['results' => []]);
        }

        // Escape LIKE wildcards to prevent injection via % and _ characters
        $escapedQuery = str_replace(['%', '_'], ['\\%', '\\_'], $query);

        $results = [
            ...$this->searchPages($escapedQuery),
            ...$this->searchPosts($escapedQuery),
        ];

        SearchLog::create([
            'query' => $query,
            'results_count' => count($results),
            'user_id' => auth()->id(),
            'ip_address' => $request->ip(),
            'source' => 'front',
        ]);

        return response()->json(['results' => $results]);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function searchPages(string $query): array
    {
        return Page::where('status', 'published')
            ->where(function ($q) use ($query) {
                $q->where('title', 'LIKE', "%{$query}%")
                  ->orWhere('meta_description', 'LIKE', "%{$query}%");
            })
            ->take(self::MAX_RESULTS_PER_TYPE)
            ->get(['id', 'title', 'slug', 'meta_description'])
            ->map(fn (Page $page) => [
                'id' => $page->id,
                'title' => $page->title,
                'type' => 'page',
                'url' => "/{$page->slug}",
                'excerpt' => $page->meta_description,
            ])
            ->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function searchPosts(string $query): array
    {
        return Post::where('status', 'published')
            ->where(function ($q) use ($query) {
                $q->where('title', 'LIKE', "%{$query}%")
                  ->orWhere('excerpt', 'LIKE', "%{$query}%");
            })
            ->take(self::MAX_RESULTS_PER_TYPE)
            ->get(['id', 'title', 'slug', 'excerpt', 'featured_image'])
            ->map(fn (Post $post) => [
                'id' => $post->id,
                'title' => $post->title,
                'type' => 'post',
                'url' => "/blog/{$post->slug}",
                'excerpt' => $post->excerpt,
                'thumbnail' => $post->featured_image,
            ])
            ->all();
    }
}
