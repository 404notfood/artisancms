<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CmsPlugin;
use App\Models\CmsTheme;
use App\Models\Comment;
use App\Models\Media;
use App\Models\Page;
use App\Models\PageView;
use App\Models\PageViewDaily;
use App\Models\Post;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'pages' => Page::count(),
                'posts' => Post::count(),
                'media' => Media::count(),
                'users' => User::count(),
            ],
            'recentPages' => Page::with('author')->latest()->take(5)->get(),
            'recentPosts' => Post::with('author')->latest()->take(5)->get(),
            'recentComments' => Comment::with('user')->latest()->take(5)->get(),
            'recentMedia' => Media::latest()->take(8)->get(),
            'contentStats' => [
                'published_pages' => Page::where('status', 'published')->count(),
                'draft_pages' => Page::where('status', 'draft')->count(),
                'published_posts' => Post::where('status', 'published')->count(),
                'draft_posts' => Post::where('status', 'draft')->count(),
                'pending_comments' => Comment::where('status', 'pending')->count(),
                'total_comments' => Comment::count(),
            ],
            'analytics' => [
                'today_views' => PageView::whereDate('created_at', today())->count(),
                'week_views' => PageView::where('created_at', '>=', now()->subDays(7))->count(),
                'month_views' => PageView::where('created_at', '>=', now()->subDays(30))->count(),
                'top_pages' => PageViewDaily::select('path', DB::raw('SUM(views_count) as total'))
                    ->where('date', '>=', now()->subDays(30))
                    ->groupBy('path')
                    ->orderByDesc('total')
                    ->take(5)
                    ->get(),
            ],
            'system' => [
                'cms_version' => config('cms.version', '1.0.0'),
                'php_version' => PHP_VERSION,
                'laravel_version' => app()->version(),
                'active_plugins' => CmsPlugin::where('enabled', true)->count(),
                'active_theme' => CmsTheme::where('active', true)->value('name') ?? 'Default',
            ],
        ]);
    }
}
