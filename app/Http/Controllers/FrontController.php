<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\HasFrontData;
use App\Models\AnnouncementBar;
use App\Models\Page;
use App\Models\Post;
use App\Models\PreviewToken;
use App\Services\DesignTokenService;
use App\Services\SettingService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class FrontController extends Controller
{
    use HasFrontData;

    public function __construct(
        private readonly SettingService $settingService,
        private readonly DesignTokenService $designTokenService,
    ) {}

    public function home(): Response
    {
        // Try both setting keys (content.homepage_id and homepage_id)
        $homepageId = $this->settingService->get('content.homepage_id')
            ?? $this->settingService->get('homepage_id');

        $page = null;

        if ($homepageId) {
            $page = Page::where('id', (int) $homepageId)
                ->where('status', 'published')
                ->first();
        }

        // Fallback: look for a page flagged as homepage by slug
        if (! $page) {
            $page = Page::where('slug', 'accueil')
                ->where('status', 'published')
                ->first();
        }

        if (! $page) {
            $page = Page::where('status', 'published')
                ->orderBy('created_at')
                ->first();
        }

        return $this->renderPage($page);
    }

    public function show(string $slug): Response
    {
        $page = Page::where('slug', $slug)
            ->where('status', 'published')
            ->firstOrFail();

        if ($page->access_level === 'authenticated' && ! Auth::check()) {
            abort(403, __('cms.content.login_required'));
        }

        return $this->renderPage($page);
    }

    public function preview(Request $request, string $token): Response
    {
        $previewToken = PreviewToken::where('token', $token)
            ->valid()
            ->firstOrFail();

        $previewable = $previewToken->previewable;

        if (! $previewable) {
            abort(404);
        }

        // Handle temporal preview: ?at=YYYY-MM-DD
        $previewAt = $request->query('at');
        $previewDate = null;
        if (is_string($previewAt) && $previewAt !== '') {
            try {
                $previewDate = Carbon::parse($previewAt)->endOfDay();
                // Store in container so scopePublished uses this date
                app()->instance('cms.preview_at', $previewDate);
            } catch (\Throwable) {
                // Invalid date, ignore
            }
        }

        $data = [
            ...$this->frontData(),
            'isPreview' => true,
            'previewAt' => $previewDate?->toDateString(),
        ];

        if ($previewable instanceof Page) {
            $data['page'] = $previewable;
            return Inertia::render('Front/Page', $data);
        }

        if ($previewable instanceof Post) {
            $previewable->load('terms');
            $data['post'] = $previewable;
            return Inertia::render('Front/Page', $data);
        }

        abort(404);
    }

    private function renderPage(?Page $page): Response
    {
        try {
            $announcement = AnnouncementBar::current()->first();
        } catch (\Throwable) {
            $announcement = null;
        }

        return Inertia::render('Front/Page', [
            ...$this->frontData(),
            'page' => $page,
            'seo' => $page ? $this->buildSeoMeta($page) : [],
            'designTokensCss' => $this->designTokenService->generateCssVariables(),
            'announcement' => $announcement,
        ]);
    }
}
