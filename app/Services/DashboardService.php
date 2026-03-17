<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\ActivityLog;
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

class DashboardService
{
    /**
     * Get at-a-glance stats.
     *
     * @return array<string, int>
     */
    public function getStats(): array
    {
        return [
            'pages' => Page::count(),
            'posts' => Post::count(),
            'media' => Media::count(),
            'users' => User::count(),
        ];
    }

    /**
     * Get content status breakdown.
     *
     * @return array<string, int>
     */
    public function getContentStats(): array
    {
        return [
            'published_pages' => Page::where('status', 'published')->count(),
            'draft_pages' => Page::where('status', 'draft')->count(),
            'published_posts' => Post::where('status', 'published')->count(),
            'draft_posts' => Post::where('status', 'draft')->count(),
            'pending_comments' => Comment::where('status', 'pending')->count(),
            'total_comments' => Comment::count(),
        ];
    }

    /**
     * Get analytics data.
     *
     * @return array<string, mixed>
     */
    public function getAnalytics(): array
    {
        return [
            'today_views' => PageView::whereDate('created_at', today())->count(),
            'week_views' => PageView::where('created_at', '>=', now()->subDays(7))->count(),
            'month_views' => PageView::where('created_at', '>=', now()->subDays(30))->count(),
            'top_pages' => PageViewDaily::select('path', DB::raw('SUM(views_count) as total'))
                ->where('date', '>=', now()->subDays(30))
                ->groupBy('path')
                ->orderByDesc('total')
                ->take(5)
                ->get(),
        ];
    }

    /**
     * Get recent activity log entries.
     *
     * @return \Illuminate\Database\Eloquent\Collection<int, ActivityLog>
     */
    public function getRecentActivity(int $limit = 10): \Illuminate\Database\Eloquent\Collection
    {
        return ActivityLog::with('user')
            ->latest()
            ->take($limit)
            ->get();
    }

    /**
     * Get draft content for the current user.
     *
     * @return array<string, mixed>
     */
    public function getMyDrafts(int $userId, int $limit = 5): array
    {
        return [
            'pages' => Page::where('created_by', $userId)
                ->where('status', 'draft')
                ->latest('updated_at')
                ->take($limit)
                ->get(['id', 'title', 'updated_at']),
            'posts' => Post::where('created_by', $userId)
                ->where('status', 'draft')
                ->latest('updated_at')
                ->take($limit)
                ->get(['id', 'title', 'updated_at']),
        ];
    }

    /**
     * Get system information.
     *
     * @return array<string, mixed>
     */
    public function getSystemInfo(): array
    {
        return [
            'cms_version' => config('cms.version', '1.0.0'),
            'php_version' => PHP_VERSION,
            'laravel_version' => app()->version(),
            'active_plugins' => CmsPlugin::where('enabled', true)->count(),
            'active_theme' => CmsTheme::where('active', true)->value('name') ?? 'Default',
            'disk_usage' => $this->getDiskUsage(),
        ];
    }

    /**
     * Get system alerts.
     *
     * @return array<int, array<string, string>>
     */
    public function getSystemAlerts(): array
    {
        $alerts = [];

        // Check disk space
        $freeSpace = @disk_free_space(storage_path());
        if ($freeSpace !== false && $freeSpace < 100 * 1024 * 1024) {
            $alerts[] = [
                'type' => 'warning',
                'message' => 'Espace disque faible (< 100 Mo)',
            ];
        }

        // Check pending comments
        $pendingComments = Comment::where('status', 'pending')->count();
        if ($pendingComments > 10) {
            $alerts[] = [
                'type' => 'info',
                'message' => "{$pendingComments} commentaires en attente de moderation",
            ];
        }

        return $alerts;
    }

    private function getDiskUsage(): string
    {
        $bytes = 0;
        $path = storage_path('app/public');
        if (is_dir($path)) {
            foreach (new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($path, \FilesystemIterator::SKIP_DOTS)) as $file) {
                $bytes += $file->getSize();
            }
        }

        if ($bytes >= 1073741824) return round($bytes / 1073741824, 1) . ' Go';
        if ($bytes >= 1048576) return round($bytes / 1048576, 1) . ' Mo';
        return round($bytes / 1024, 1) . ' Ko';
    }
}
