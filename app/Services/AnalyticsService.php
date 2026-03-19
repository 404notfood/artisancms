<?php

declare(strict_types=1);

namespace App\Services;

use App\Jobs\TrackPageViewJob;
use App\Models\PageView;
use App\Models\PageViewDaily;
use App\Support\UserAgentParser;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class AnalyticsService
{
    // ─── Tracking ─────────────────────────────────────────

    /**
     * Enregistrer une vue de page via un job en queue.
     */
    public function trackPageView(
        Request $request,
        ?string $viewableType = null,
        ?int $viewableId = null,
    ): void {
        if (!$this->isTrackingEnabled()) {
            return;
        }

        // Respecter l'en-tete DNT si configure
        if ($this->shouldRespectDnt() && $request->header('DNT') === '1') {
            return;
        }

        $userAgent = (string) $request->userAgent();

        // Exclure les bots
        if (UserAgentParser::isBot($userAgent)) {
            return;
        }

        // Exclure les administrateurs si configure
        if (config('cms.analytics.exclude_admins', true)) {
            $user = $request->user();
            if ($user !== null && method_exists($user, 'isAdmin') && $user->isAdmin()) {
                return;
            }
        }

        TrackPageViewJob::dispatch([
            'path'          => mb_substr($request->path(), 0, 500),
            'viewable_type' => $viewableType,
            'viewable_id'   => $viewableId,
            'referrer'      => $this->sanitizeReferrer($request->header('referer')),
            'user_agent'    => mb_substr($userAgent, 0, 255),
            'country'       => null, // IP geolocation optionnelle (non implementee en V1)
            'device_type'   => UserAgentParser::detectDeviceType($userAgent),
            'browser'       => UserAgentParser::detectBrowser($userAgent),
            'date'          => Carbon::today()->toDateString(),
        ]);
    }

    // ─── Donnees analytiques ──────────────────────────────

    /**
     * Obtenir un apercu general des analytics pour une periode donnee.
     *
     * @return array<string, mixed>
     */
    public function getOverview(string $period = '30d'): array
    {
        [$from, $to] = $this->resolvePeriod($period);

        $totals = PageViewDaily::betweenDates($from, $to)
            ->selectRaw('COALESCE(SUM(views_count), 0) as total_views')
            ->selectRaw('COALESCE(SUM(unique_visitors), 0) as unique_visitors')
            ->first();

        return [
            'total_views'     => (int) ($totals->total_views ?? 0),
            'unique_visitors' => (int) ($totals->unique_visitors ?? 0),
            'top_pages'       => $this->getTopPages($period, 10),
            'top_referrers'   => $this->getTrafficSources($period, 10),
            'period_data'     => $this->getDailyData($from, $to),
            'device_stats'    => $this->getDeviceStats($period),
            'browser_stats'   => $this->getBrowserStats($period),
        ];
    }

    /**
     * Obtenir les pages les plus visitees.
     *
     * @return Collection<int, object>
     */
    public function getTopPages(string $period = '30d', int $limit = 10): Collection
    {
        [$from, $to] = $this->resolvePeriod($period);

        return PageViewDaily::betweenDates($from, $to)
            ->select('path')
            ->selectRaw('SUM(views_count) as total_views')
            ->selectRaw('SUM(unique_visitors) as total_visitors')
            ->groupBy('path')
            ->orderByDesc('total_views')
            ->limit($limit)
            ->get();
    }

    /**
     * Obtenir les sources de trafic (referrers).
     *
     * @return Collection<int, object>
     */
    public function getTrafficSources(string $period = '30d', int $limit = 10): Collection
    {
        [$from, $to] = $this->resolvePeriod($period);

        return PageView::betweenDates($from, $to)
            ->whereNotNull('referrer')
            ->where('referrer', '!=', '')
            ->select(DB::raw("SUBSTRING_INDEX(SUBSTRING_INDEX(referrer, '/', 3), '/', -1) as domain"))
            ->selectRaw('COUNT(*) as visits')
            ->groupBy('domain')
            ->orderByDesc('visits')
            ->limit($limit)
            ->get();
    }

    /**
     * Obtenir les statistiques par type d'appareil.
     *
     * @return Collection<int, object>
     */
    public function getDeviceStats(string $period = '30d'): Collection
    {
        [$from, $to] = $this->resolvePeriod($period);

        return PageView::betweenDates($from, $to)
            ->whereNotNull('device_type')
            ->select('device_type')
            ->selectRaw('COUNT(*) as count')
            ->groupBy('device_type')
            ->orderByDesc('count')
            ->get();
    }

    /**
     * Obtenir les statistiques par navigateur.
     *
     * @return Collection<int, object>
     */
    public function getBrowserStats(string $period = '30d'): Collection
    {
        [$from, $to] = $this->resolvePeriod($period);

        return PageView::betweenDates($from, $to)
            ->whereNotNull('browser')
            ->select('browser')
            ->selectRaw('COUNT(*) as count')
            ->groupBy('browser')
            ->orderByDesc('count')
            ->get();
    }

    /**
     * Obtenir les statistiques pour un chemin de page specifique.
     *
     * @return array<string, mixed>
     */
    public function getPageStats(string $path, string $period = '30d'): array
    {
        [$from, $to] = $this->resolvePeriod($period);

        $totals = PageViewDaily::betweenDates($from, $to)
            ->forPath($path)
            ->selectRaw('COALESCE(SUM(views_count), 0) as total_views')
            ->selectRaw('COALESCE(SUM(unique_visitors), 0) as unique_visitors')
            ->first();

        $dailyData = PageViewDaily::betweenDates($from, $to)
            ->forPath($path)
            ->select('date', 'views_count', 'unique_visitors')
            ->orderBy('date')
            ->get();

        $topReferrers = PageView::betweenDates($from, $to)
            ->forPath($path)
            ->whereNotNull('referrer')
            ->where('referrer', '!=', '')
            ->select(DB::raw("SUBSTRING_INDEX(SUBSTRING_INDEX(referrer, '/', 3), '/', -1) as domain"))
            ->selectRaw('COUNT(*) as visits')
            ->groupBy('domain')
            ->orderByDesc('visits')
            ->limit(5)
            ->get();

        return [
            'path'            => $path,
            'total_views'     => (int) ($totals->total_views ?? 0),
            'unique_visitors' => (int) ($totals->unique_visitors ?? 0),
            'daily_data'      => $dailyData,
            'top_referrers'   => $topReferrers,
        ];
    }

    /**
     * Obtenir les donnees quotidiennes pour un graphique (avec remplissage des jours vides).
     *
     * @return Collection<int, array<string, mixed>>
     */
    public function getDailyData(string $from, string $to): Collection
    {
        $records = PageViewDaily::betweenDates($from, $to)
            ->select('date')
            ->selectRaw('SUM(views_count) as views')
            ->selectRaw('SUM(unique_visitors) as visitors')
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->keyBy(fn ($item) => $item->date->toDateString());

        $period = CarbonPeriod::create($from, $to);
        $result = collect();

        foreach ($period as $date) {
            $dateString = $date->toDateString();
            $record = $records->get($dateString);

            $result->push([
                'date'     => $dateString,
                'views'    => (int) ($record->views ?? 0),
                'visitors' => (int) ($record->visitors ?? 0),
            ]);
        }

        return $result;
    }

    // ─── Utilitaires de periode ───────────────────────────

    /**
     * Convertir un identifiant de periode en dates de debut et fin.
     *
     * @return array{0: string, 1: string}
     */
    public function resolvePeriod(string $period): array
    {
        $to = Carbon::today()->toDateString();

        $from = match ($period) {
            '7d'    => Carbon::today()->subDays(6)->toDateString(),
            '30d'   => Carbon::today()->subDays(29)->toDateString(),
            '90d'   => Carbon::today()->subDays(89)->toDateString(),
            '1y'    => Carbon::today()->subYear()->addDay()->toDateString(),
            default => Carbon::today()->subDays(29)->toDateString(),
        };

        return [$from, $to];
    }

    // ─── Configuration ────────────────────────────────────

    /**
     * Verifier si le tracking analytique est active.
     */
    public function isTrackingEnabled(): bool
    {
        return (bool) config('cms.analytics.enabled', true);
    }

    /**
     * Verifier si l'en-tete DNT doit etre respecte.
     */
    public function shouldRespectDnt(): bool
    {
        return (bool) config('cms.analytics.respect_dnt', true);
    }

    /**
     * Nettoyer le referrer en supprimant les parametres de requete (vie privee).
     */
    public function sanitizeReferrer(?string $referrer): ?string
    {
        if ($referrer === null || $referrer === '') {
            return null;
        }

        $parsed = parse_url($referrer);

        if ($parsed === false || !isset($parsed['host'])) {
            return null;
        }

        $scheme = $parsed['scheme'] ?? 'https';
        $host = $parsed['host'];
        $path = $parsed['path'] ?? '/';

        $sanitized = "{$scheme}://{$host}{$path}";

        // Tronquer a 500 caracteres
        return mb_substr($sanitized, 0, 500);
    }
}
