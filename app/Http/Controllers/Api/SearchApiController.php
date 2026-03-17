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
    public function search(Request $request): JsonResponse
    {
        $query = trim($request->input('q', ''));
        if (strlen($query) < 2) {
            return response()->json(['results' => []]);
        }

        $results = [];

        // Search pages
        $pages = Page::where('status', 'published')
            ->where(function ($q) use ($query) {
                $q->where('title', 'LIKE', "%{$query}%")
                  ->orWhere('meta_description', 'LIKE', "%{$query}%");
            })
            ->take(5)
            ->get(['id', 'title', 'slug', 'meta_description']);

        foreach ($pages as $page) {
            $results[] = [
                'id' => $page->id,
                'title' => $page->title,
                'type' => 'page',
                'url' => "/{$page->slug}",
                'excerpt' => $page->meta_description,
            ];
        }

        // Search posts
        $posts = Post::where('status', 'published')
            ->where(function ($q) use ($query) {
                $q->where('title', 'LIKE', "%{$query}%")
                  ->orWhere('excerpt', 'LIKE', "%{$query}%");
            })
            ->take(5)
            ->get(['id', 'title', 'slug', 'excerpt', 'featured_image']);

        foreach ($posts as $post) {
            $results[] = [
                'id' => $post->id,
                'title' => $post->title,
                'type' => 'post',
                'url' => "/blog/{$post->slug}",
                'excerpt' => $post->excerpt,
                'thumbnail' => $post->featured_image,
            ];
        }

        // Log the search
        SearchLog::create([
            'query' => $query,
            'results_count' => count($results),
            'user_id' => auth()->id(),
            'ip_address' => $request->ip(),
            'source' => 'front',
        ]);

        return response()->json(['results' => $results]);
    }
}
