<?php

declare(strict_types=1);

namespace App\Http\Controllers\Front;

use App\Http\Controllers\Concerns\HasFrontData;
use App\Http\Controllers\Controller;
use App\Models\Page;
use App\Models\Post;
use App\Services\SettingService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ErrorController extends Controller
{
    use HasFrontData;

    public function __construct(
        private readonly SettingService $settingService,
    ) {}

    public function notFound(): Response
    {
        $recentPages = Page::where('status', 'published')
            ->select(['id', 'title', 'slug'])
            ->orderByDesc('published_at')
            ->limit(5)
            ->get()
            ->map(fn (Page $p) => [
                'title' => $p->title,
                'url' => "/{$p->slug}",
            ]);

        $recentPosts = Post::published()
            ->select(['id', 'title', 'slug', 'published_at'])
            ->orderByDesc('published_at')
            ->limit(5)
            ->get()
            ->map(fn (Post $p) => [
                'title' => $p->title,
                'url' => "/blog/{$p->slug}",
            ]);

        return Inertia::render('Front/Error404', [
            ...$this->frontData(),
            'recentPages' => $recentPages,
            'recentPosts' => $recentPosts,
        ]);
    }

    public function maintenance(): Response|RedirectResponse
    {
        if (! $this->settingService->get('maintenance.enabled')) {
            return redirect('/');
        }

        return Inertia::render('Front/Maintenance', [
            'message' => $this->settingService->get(
                'maintenance.message',
                __('cms.maintenance.default_message'),
            ),
        ]);
    }
}
