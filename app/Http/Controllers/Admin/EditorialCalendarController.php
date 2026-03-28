<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Page;
use App\Models\Post;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class EditorialCalendarController extends Controller
{
    /**
     * Display the editorial calendar for a given month.
     */
    public function index(Request $request): Response
    {
        $request->validate([
            'month' => ['sometimes', 'date_format:Y-m'],
        ]);

        $month = $request->query('month')
            ? Carbon::createFromFormat('Y-m', $request->query('month'))->startOfMonth()
            : Carbon::now()->startOfMonth();

        $startOfMonth = $month->copy()->startOfMonth();
        $endOfMonth = $month->copy()->endOfMonth();

        $fields = ['id', 'title', 'slug', 'status', 'published_at', 'created_at'];

        $posts = Post::query()
            ->select($fields)
            ->whereNotNull('published_at')
            ->whereBetween('published_at', [$startOfMonth, $endOfMonth])
            ->whereNotIn('status', ['trash'])
            ->orderBy('published_at')
            ->get()
            ->map(fn (Post $post) => [
                'id' => $post->id,
                'title' => $post->title,
                'slug' => $post->slug,
                'type' => 'post',
                'status' => $post->status,
                'published_at' => $post->published_at?->toISOString(),
                'edit_url' => route('admin.posts.edit', $post->id),
            ]);

        $pages = Page::query()
            ->select($fields)
            ->whereNotNull('published_at')
            ->whereBetween('published_at', [$startOfMonth, $endOfMonth])
            ->whereNotIn('status', ['trash'])
            ->orderBy('published_at')
            ->get()
            ->map(fn (Page $page) => [
                'id' => $page->id,
                'title' => $page->title,
                'slug' => $page->slug,
                'type' => 'page',
                'status' => $page->status,
                'published_at' => $page->published_at?->toISOString(),
                'edit_url' => route('admin.pages.edit', $page->id),
            ]);

        /** @var Collection<int, array<string, mixed>> $allItems */
        $allItems = $posts->concat($pages)->sortBy('published_at')->values();

        $grouped = $allItems->groupBy(function (array $item): string {
            return Carbon::parse($item['published_at'])->format('Y-m-d');
        })->map->values()->toArray();

        return Inertia::render('Admin/EditorialCalendar/Index', [
            'entries' => $grouped,
            'month' => $month->format('Y-m'),
        ]);
    }
}
