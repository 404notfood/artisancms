<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\Media;
use App\Models\Page;
use App\Models\Post;
use App\Services\DashboardService;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        private readonly DashboardService $dashboardService,
    ) {}

    public function __invoke(): Response
    {
        return Inertia::render('Admin/Dashboard', [
            'stats' => $this->dashboardService->getStats(),
            'recentPages' => Page::with('author')->latest()->take(5)->get(),
            'recentPosts' => Post::with('author')->latest()->take(5)->get(),
            'recentComments' => Comment::with('user')->latest()->take(5)->get(),
            'recentMedia' => Media::latest()->take(8)->get(),
            'contentStats' => $this->dashboardService->getContentStats(),
            'analytics' => $this->dashboardService->getAnalytics(),
            'system' => $this->dashboardService->getSystemInfo(),
        ]);
    }
}
