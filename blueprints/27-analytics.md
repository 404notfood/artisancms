# Blueprint 27 - Analytics

## Vue d'ensemble
Ce document definit le systeme d'analytics integre d'ArtisanCMS. L'objectif est de fournir un tableau de bord analytique leger, performant et respectueux de la vie privee, directement dans l'administration, sans dependance externe obligatoire. Une integration optionnelle avec Google Analytics 4 (GA4) est egalement prevue pour les utilisateurs souhaitant des metriques avancees.

**Principes directeurs :**
- Analytics integre 100% server-side (pas de cookies tiers, pas de JavaScript de tracking)
- Dashboard admin avec metriques essentielles : vues, visiteurs uniques, top pages, sources de trafic
- Donnees anonymisees et conformes au RGPD par defaut
- Tracking asynchrone via queue pour ne pas impacter les performances
- Agregation quotidienne pour des requetes rapides sur les periodes longues
- Integration GA4 optionnelle (injection du script gtag.js avec gestion du consentement)

---

## 1. Table `page_views` (donnees brutes)

Table principale pour enregistrer chaque vue de page individuelle. Les donnees brutes sont conservees temporairement (90 jours par defaut) avant d'etre agregees puis purgees.

```php
// database/migrations/xxxx_xx_xx_create_cms_page_views_table.php
<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cms_page_views', function (Blueprint $table) {
            $table->id();
            $table->string('path', 500);
            $table->nullableMorphs('viewable');               // viewable_type + viewable_id (Page ou Post)
            $table->string('referrer', 500)->nullable();
            $table->string('user_agent')->nullable();
            $table->string('country', 2)->nullable();         // Code ISO pays (deduit de l'IP)
            $table->string('device_type', 20)->nullable();    // desktop, mobile, tablet
            $table->string('browser', 50)->nullable();
            $table->date('date');
            $table->timestamp('created_at')->useCurrent();

            // Index pour agregation et requetes frequentes
            $table->index(['path', 'date']);
            $table->index(['viewable_type', 'viewable_id', 'date']);
            $table->index('date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cms_page_views');
    }
};
```

### Colonnes detaillees

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | bigint | Cle primaire auto-incrementee |
| `path` | varchar(500) | Chemin URL de la page visitee (ex: `/blog/mon-article`) |
| `viewable_type` | varchar | Type du modele (App\Models\Page, App\Models\Post) |
| `viewable_id` | bigint | ID de l'entite concernee |
| `referrer` | varchar(500) | URL du referrer HTTP (nullable) |
| `user_agent` | varchar(255) | User-Agent du navigateur (nullable) |
| `country` | char(2) | Code pays ISO 3166-1 alpha-2 (deduit de l'IP, nullable) |
| `device_type` | varchar(20) | Type d'appareil : `desktop`, `mobile`, `tablet` |
| `browser` | varchar(50) | Nom du navigateur : `Chrome`, `Firefox`, `Safari`, etc. |
| `date` | date | Date de la vue (pour faciliter l'agregation) |
| `created_at` | timestamp | Horodatage exact de la vue |

> **Note :** L'adresse IP n'est **jamais** stockee en base. Le code pays est deduit au moment du tracking puis l'IP est supprimee. Cela garantit la conformite RGPD sans necessite de consentement specifique.

---

## 2. Table `page_views_daily` (agregation)

Table pre-agregee pour les requetes de dashboard. Alimentee par un job quotidien qui consolide les donnees brutes de `cms_page_views`.

```php
// database/migrations/xxxx_xx_xx_create_cms_page_views_daily_table.php
<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cms_page_views_daily', function (Blueprint $table) {
            $table->id();
            $table->string('path', 500);
            $table->nullableMorphs('viewable');
            $table->date('date');
            $table->unsignedInteger('views_count')->default(0);
            $table->unsignedInteger('unique_visitors')->default(0);

            // Contrainte unique pour eviter les doublons d'agregation
            $table->unique(['path', 'date']);
            $table->index('date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cms_page_views_daily');
    }
};
```

### Logique d'agregation

Les `unique_visitors` sont comptes par combinaison unique de `user_agent + country + device_type` pour un meme `path` et `date`. Ce n'est pas un comptage parfait (pas de cookie ni fingerprint), mais c'est une approximation raisonnable et respectueuse de la vie privee.

---

## 3. Modele PageView

```php
// app/Models/PageView.php
<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class PageView extends Model
{
    public $timestamps = false;

    protected $table = 'cms_page_views';

    protected $fillable = [
        'path',
        'viewable_type',
        'viewable_id',
        'referrer',
        'user_agent',
        'country',
        'device_type',
        'browser',
        'date',
        'created_at',
    ];

    protected $casts = [
        'date' => 'date',
        'created_at' => 'datetime',
    ];

    // --- Relations -------------------------------------------

    public function viewable(): MorphTo
    {
        return $this->morphTo();
    }

    // --- Scopes -----------------------------------------------

    public function scopeForPath($query, string $path)
    {
        return $query->where('path', $path);
    }

    public function scopeForDate($query, string $date)
    {
        return $query->where('date', $date);
    }

    public function scopeBetweenDates($query, string $from, string $to)
    {
        return $query->whereBetween('date', [$from, $to]);
    }

    public function scopeForViewable($query, string $type, int $id)
    {
        return $query->where('viewable_type', $type)->where('viewable_id', $id);
    }
}
```

---

## 4. Modele PageViewDaily

```php
// app/Models/PageViewDaily.php
<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class PageViewDaily extends Model
{
    public $timestamps = false;

    protected $table = 'cms_page_views_daily';

    protected $fillable = [
        'path',
        'viewable_type',
        'viewable_id',
        'date',
        'views_count',
        'unique_visitors',
    ];

    protected $casts = [
        'date' => 'date',
        'views_count' => 'integer',
        'unique_visitors' => 'integer',
    ];

    // --- Relations -------------------------------------------

    public function viewable(): MorphTo
    {
        return $this->morphTo();
    }

    // --- Scopes -----------------------------------------------

    public function scopeBetweenDates($query, string $from, string $to)
    {
        return $query->whereBetween('date', [$from, $to]);
    }

    public function scopeForPath($query, string $path)
    {
        return $query->where('path', $path);
    }
}
```

---

## 5. AnalyticsService

Service principal contenant toute la logique metier des analytics. Les controllers ne font qu'appeler ce service.

```php
// app/Services/AnalyticsService.php
<?php

declare(strict_types=1);

namespace App\Services;

use App\Jobs\TrackPageViewJob;
use App\Models\PageView;
use App\Models\PageViewDaily;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class AnalyticsService
{
    // --- Tracking -----------------------------------------------

    /**
     * Enregistre une vue de page via la queue (asynchrone).
     * Appele par le middleware TrackPageView.
     */
    public function trackPageView(Request $request, ?string $viewableType = null, ?int $viewableId = null): void
    {
        if (! $this->isTrackingEnabled()) {
            return;
        }

        if ($this->shouldRespectDnt() && $request->header('DNT') === '1') {
            return;
        }

        $userAgent = $request->userAgent() ?? '';

        if ($this->isBot($userAgent)) {
            return;
        }

        TrackPageViewJob::dispatch([
            'path'           => $request->path(),
            'viewable_type'  => $viewableType,
            'viewable_id'    => $viewableId,
            'referrer'       => $this->sanitizeReferrer($request->header('Referer')),
            'user_agent'     => mb_substr($userAgent, 0, 255),
            'country'        => $this->resolveCountry($request->ip()),
            'device_type'    => $this->detectDeviceType($userAgent),
            'browser'        => $this->detectBrowser($userAgent),
            'date'           => now()->toDateString(),
        ]);
    }

    // --- Requetes de donnees ------------------------------------

    /**
     * Vue d'ensemble pour le dashboard.
     * Retourne : total_views, unique_visitors, top_pages, top_referrers, period_data.
     *
     * @param string $period '7d', '30d', '90d', '1y'
     * @return array{total_views: int, unique_visitors: int, top_pages: Collection, top_referrers: Collection, period_data: Collection}
     */
    public function getOverview(string $period = '30d'): array
    {
        [$from, $to] = $this->resolvePeriod($period);

        $totals = PageViewDaily::betweenDates($from, $to)
            ->selectRaw('SUM(views_count) as total_views, SUM(unique_visitors) as unique_visitors')
            ->first();

        return [
            'total_views'     => (int) ($totals->total_views ?? 0),
            'unique_visitors' => (int) ($totals->unique_visitors ?? 0),
            'top_pages'       => $this->getTopPages($period, 10),
            'top_referrers'   => $this->getTrafficSources($period, 10),
            'period_data'     => $this->getDailyData($from, $to),
        ];
    }

    /**
     * Statistiques pour une page specifique.
     */
    public function getPageStats(string $path, string $period = '30d'): array
    {
        [$from, $to] = $this->resolvePeriod($period);

        $totals = PageViewDaily::betweenDates($from, $to)
            ->forPath($path)
            ->selectRaw('SUM(views_count) as total_views, SUM(unique_visitors) as unique_visitors')
            ->first();

        $dailyData = PageViewDaily::betweenDates($from, $to)
            ->forPath($path)
            ->orderBy('date')
            ->get(['date', 'views_count', 'unique_visitors']);

        return [
            'path'            => $path,
            'total_views'     => (int) ($totals->total_views ?? 0),
            'unique_visitors' => (int) ($totals->unique_visitors ?? 0),
            'daily_data'      => $dailyData,
        ];
    }

    /**
     * Top N pages les plus vues sur la periode.
     */
    public function getTopPages(string $period = '30d', int $limit = 10): Collection
    {
        [$from, $to] = $this->resolvePeriod($period);

        return PageViewDaily::betweenDates($from, $to)
            ->select('path')
            ->selectRaw('SUM(views_count) as total_views')
            ->selectRaw('SUM(unique_visitors) as unique_visitors')
            ->groupBy('path')
            ->orderByDesc('total_views')
            ->limit($limit)
            ->get();
    }

    /**
     * Sources de trafic (referrers) groupees par domaine.
     */
    public function getTrafficSources(string $period = '30d', int $limit = 10): Collection
    {
        [$from, $to] = $this->resolvePeriod($period);

        return PageView::betweenDates($from, $to)
            ->whereNotNull('referrer')
            ->where('referrer', '!=', '')
            ->selectRaw("
                SUBSTRING_INDEX(SUBSTRING_INDEX(REPLACE(REPLACE(referrer, 'https://', ''), 'http://', ''), '/', 1), '?', 1) as domain,
                COUNT(*) as visits
            ")
            ->groupBy('domain')
            ->orderByDesc('visits')
            ->limit($limit)
            ->get();
    }

    /**
     * Repartition par type d'appareil (desktop, mobile, tablet).
     */
    public function getDeviceBreakdown(string $period = '30d'): Collection
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
     * Repartition geographique par pays.
     */
    public function getCountryBreakdown(string $period = '30d', int $limit = 20): Collection
    {
        [$from, $to] = $this->resolvePeriod($period);

        return PageView::betweenDates($from, $to)
            ->whereNotNull('country')
            ->select('country')
            ->selectRaw('COUNT(*) as count')
            ->groupBy('country')
            ->orderByDesc('count')
            ->limit($limit)
            ->get();
    }

    // --- Agregation --------------------------------------------

    /**
     * Agregation quotidienne des donnees brutes vers cms_page_views_daily.
     * Appelee par le job AggregatePageViewsJob (cron quotidien a 2h).
     */
    public function aggregate(?string $date = null): int
    {
        $date = $date ?? now()->subDay()->toDateString();

        $rows = DB::table('cms_page_views')
            ->where('date', $date)
            ->select(
                'path',
                'viewable_type',
                'viewable_id',
                DB::raw('COUNT(*) as views_count'),
                DB::raw("COUNT(DISTINCT CONCAT(COALESCE(user_agent, ''), '|', COALESCE(country, ''), '|', COALESCE(device_type, ''))) as unique_visitors"),
                DB::raw("'{$date}' as date")
            )
            ->groupBy('path', 'viewable_type', 'viewable_id')
            ->get();

        $inserted = 0;

        foreach ($rows as $row) {
            PageViewDaily::updateOrCreate(
                [
                    'path' => $row->path,
                    'date' => $date,
                ],
                [
                    'viewable_type'   => $row->viewable_type,
                    'viewable_id'     => $row->viewable_id,
                    'views_count'     => $row->views_count,
                    'unique_visitors' => $row->unique_visitors,
                ]
            );
            $inserted++;
        }

        return $inserted;
    }

    // --- Nettoyage ---------------------------------------------

    /**
     * Supprime les donnees brutes anterieures a $days jours.
     * Les donnees agregees dans cms_page_views_daily sont conservees.
     */
    public function cleanup(?int $days = null): int
    {
        $days = $days ?? (int) config('cms.analytics.retention_days', 90);
        $cutoff = now()->subDays($days)->toDateString();

        return PageView::where('date', '<', $cutoff)->delete();
    }

    // --- Methodes privees --------------------------------------

    /**
     * Resout une periode en dates [from, to].
     *
     * @return array{0: string, 1: string}
     */
    private function resolvePeriod(string $period): array
    {
        $to = now()->toDateString();

        $from = match ($period) {
            '7d'    => now()->subDays(7)->toDateString(),
            '30d'   => now()->subDays(30)->toDateString(),
            '90d'   => now()->subDays(90)->toDateString(),
            '1y'    => now()->subYear()->toDateString(),
            default => now()->subDays(30)->toDateString(),
        };

        return [$from, $to];
    }

    /**
     * Retourne les donnees quotidiennes pour le graphique (avec jours vides combles).
     */
    private function getDailyData(string $from, string $to): Collection
    {
        $data = PageViewDaily::betweenDates($from, $to)
            ->select('date')
            ->selectRaw('SUM(views_count) as views')
            ->selectRaw('SUM(unique_visitors) as visitors')
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->keyBy(fn ($item) => $item->date->toDateString());

        // Combler les jours sans donnees avec des zeros
        $period = CarbonPeriod::create($from, $to);
        $result = collect();

        foreach ($period as $date) {
            $key = $date->toDateString();
            $result->push([
                'date'     => $key,
                'views'    => (int) ($data[$key]->views ?? 0),
                'visitors' => (int) ($data[$key]->visitors ?? 0),
            ]);
        }

        return $result;
    }

    /**
     * Detecte si le user-agent est un bot/crawler.
     */
    private function isBot(string $userAgent): bool
    {
        if (! config('cms.analytics.bot_detection', true)) {
            return false;
        }

        $botPatterns = [
            'bot', 'crawl', 'spider', 'slurp', 'mediapartners',
            'lighthouse', 'pagespeed', 'pingdom', 'uptimerobot',
            'headlesschrome', 'phantomjs', 'semrush', 'ahref',
            'mj12bot', 'dotbot', 'petalbot', 'yandex', 'baidu',
            'bingbot', 'googlebot', 'duckduckbot', 'facebookexternal',
            'twitterbot', 'linkedinbot', 'whatsapp', 'telegrambot',
        ];

        $lower = mb_strtolower($userAgent);

        foreach ($botPatterns as $pattern) {
            if (str_contains($lower, $pattern)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Detecte le type d'appareil a partir du user-agent.
     */
    private function detectDeviceType(string $userAgent): string
    {
        $lower = mb_strtolower($userAgent);

        if (str_contains($lower, 'tablet') || str_contains($lower, 'ipad')) {
            return 'tablet';
        }

        if (str_contains($lower, 'mobile') || str_contains($lower, 'android') || str_contains($lower, 'iphone')) {
            return 'mobile';
        }

        return 'desktop';
    }

    /**
     * Detecte le navigateur a partir du user-agent.
     */
    private function detectBrowser(string $userAgent): string
    {
        return match (true) {
            str_contains($userAgent, 'Edg/')    => 'Edge',
            str_contains($userAgent, 'OPR/')    => 'Opera',
            str_contains($userAgent, 'Chrome/') => 'Chrome',
            str_contains($userAgent, 'Safari/')
                && ! str_contains($userAgent, 'Chrome/') => 'Safari',
            str_contains($userAgent, 'Firefox/')         => 'Firefox',
            default                                      => 'Other',
        };
    }

    /**
     * Resout le code pays a partir de l'IP (anonymisee).
     * Utilise une base GeoIP legere (ex: MaxMind GeoLite2).
     */
    private function resolveCountry(?string $ip): ?string
    {
        if (! $ip) {
            return null;
        }

        // Utiliser un package GeoIP leger si disponible
        // ex: stevebauman/location ou torann/geoip
        try {
            if (function_exists('geoip')) {
                $location = geoip($ip);
                return $location->iso_code ?? null;
            }
        } catch (\Throwable) {
            // Silencieux en cas d'erreur GeoIP
        }

        return null;
    }

    /**
     * Nettoie le referrer (supprime les query strings sensibles).
     */
    private function sanitizeReferrer(?string $referrer): ?string
    {
        if (! $referrer) {
            return null;
        }

        // Supprimer les query strings pour la vie privee
        $parsed = parse_url($referrer);

        if (! isset($parsed['host'])) {
            return null;
        }

        $scheme = $parsed['scheme'] ?? 'https';
        $host = $parsed['host'];
        $path = $parsed['path'] ?? '/';

        return "{$scheme}://{$host}{$path}";
    }

    private function isTrackingEnabled(): bool
    {
        return (bool) config('cms.analytics.enabled', true);
    }

    private function shouldRespectDnt(): bool
    {
        return (bool) config('cms.analytics.respect_dnt', true);
    }
}
```

---

## 6. Job de tracking asynchrone

```php
// app/Jobs/TrackPageViewJob.php
<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\PageView;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class TrackPageViewJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /**
     * Nombre maximum de tentatives.
     */
    public int $tries = 2;

    /**
     * Timeout en secondes.
     */
    public int $timeout = 10;

    public function __construct(
        private readonly array $data,
    ) {}

    public function handle(): void
    {
        PageView::create($this->data);
    }

    /**
     * Queue basse priorite pour ne pas bloquer les jobs importants.
     */
    public function viaQueue(): string
    {
        return 'analytics';
    }
}
```

---

## 7. Job d'agregation quotidienne

```php
// app/Jobs/AggregatePageViewsJob.php
<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Services\AnalyticsService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class AggregatePageViewsJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 3;
    public int $timeout = 300;

    public function __construct(
        private readonly ?string $date = null,
    ) {}

    public function handle(AnalyticsService $analytics): void
    {
        $date = $this->date ?? now()->subDay()->toDateString();

        $count = $analytics->aggregate($date);

        Log::info("[Analytics] Agregation terminee pour {$date} : {$count} lignes agregees.");
    }
}
```

---

## 8. Middleware de tracking

```php
// app/Http/Middleware/TrackPageView.php
<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\Page;
use App\Models\Post;
use App\Services\AnalyticsService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TrackPageView
{
    public function __construct(
        private readonly AnalyticsService $analytics,
    ) {}

    /**
     * Enregistre une vue de page pour chaque requete front (pas admin, pas API).
     *
     * - Ignore les requetes AJAX/API
     * - Ignore les pages admin
     * - Ignore les bots (detection dans AnalyticsService)
     * - Respecte le header Do Not Track (si configure)
     * - Dispatch le tracking en queue pour ne pas ralentir la reponse
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Ne tracker que les reponses reussies (2xx)
        if ($response->getStatusCode() < 200 || $response->getStatusCode() >= 300) {
            return $response;
        }

        // Ne tracker que les requetes GET (pas POST, PUT, DELETE...)
        if (! $request->isMethod('GET')) {
            return $response;
        }

        // Ignorer les requetes AJAX/JSON
        if ($request->ajax() || $request->wantsJson()) {
            return $response;
        }

        // Ignorer les chemins exclus (admin, api, etc.)
        if ($this->isExcludedPath($request->path())) {
            return $response;
        }

        // Resoudre l'entite viewable si possible
        [$viewableType, $viewableId] = $this->resolveViewable($request);

        $this->analytics->trackPageView($request, $viewableType, $viewableId);

        return $response;
    }

    /**
     * Verifie si le chemin est dans la liste d'exclusion.
     */
    private function isExcludedPath(string $path): bool
    {
        $excluded = config('cms.analytics.excluded_paths', ['/admin/*', '/api/*']);

        foreach ($excluded as $pattern) {
            $pattern = ltrim($pattern, '/');

            if (fnmatch($pattern, $path)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Tente de resoudre le modele associe a la page (Page ou Post).
     *
     * @return array{0: ?string, 1: ?int}
     */
    private function resolveViewable(Request $request): array
    {
        $route = $request->route();

        if (! $route) {
            return [null, null];
        }

        // Si la route a un parametre page ou post, on le recupere
        if ($page = $route->parameter('page')) {
            if ($page instanceof Page) {
                return [Page::class, $page->id];
            }
        }

        if ($post = $route->parameter('post')) {
            if ($post instanceof Post) {
                return [Post::class, $post->id];
            }
        }

        return [null, null];
    }
}
```

### Enregistrement du middleware

```php
// bootstrap/app.php (Laravel 12)
->withMiddleware(function (Middleware $middleware) {
    $middleware->web(append: [
        \App\Http\Middleware\TrackPageView::class,
    ]);
})
```

> **Note :** Le middleware est ajoute au groupe `web` mais filtre en interne les requetes admin/API. Alternativement, on peut creer un groupe de middleware `front` dedie aux routes publiques.

---

## 9. Commandes Artisan

### Commande d'agregation

```php
// app/Console/Commands/AnalyticsAggregateCommand.php
<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\AnalyticsService;
use Illuminate\Console\Command;

class AnalyticsAggregateCommand extends Command
{
    protected $signature = 'cms:analytics:aggregate
                            {--date= : Date specifique a agreger (YYYY-MM-DD), defaut: hier}';

    protected $description = 'Agrege les vues de pages brutes en donnees quotidiennes';

    public function handle(AnalyticsService $analytics): int
    {
        $date = $this->option('date');

        $this->info("Agregation des donnees analytics pour : " . ($date ?? 'hier'));

        $count = $analytics->aggregate($date);

        $this->info("Termine : {$count} lignes agregees.");

        return self::SUCCESS;
    }
}
```

### Commande de nettoyage

```php
// app/Console/Commands/AnalyticsCleanupCommand.php
<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\AnalyticsService;
use Illuminate\Console\Command;

class AnalyticsCleanupCommand extends Command
{
    protected $signature = 'cms:analytics:cleanup
                            {--days= : Nombre de jours de retention (defaut: config cms.analytics.retention_days)}';

    protected $description = 'Supprime les donnees brutes de page_views anterieures a la periode de retention';

    public function handle(AnalyticsService $analytics): int
    {
        $days = $this->option('days')
            ? (int) $this->option('days')
            : null;

        $retentionDays = $days ?? (int) config('cms.analytics.retention_days', 90);

        $this->info("Nettoyage des donnees brutes anterieures a {$retentionDays} jours...");

        $deleted = $analytics->cleanup($days);

        $this->info("Termine : {$deleted} lignes supprimees.");

        return self::SUCCESS;
    }
}
```

### Scheduler (planification)

```php
// app/Console/Kernel.php ou routes/console.php (Laravel 12)
use Illuminate\Support\Facades\Schedule;

Schedule::command('cms:analytics:aggregate')->dailyAt('02:00');
Schedule::command('cms:analytics:cleanup')->dailyAt('03:00');
```

---

## 10. Controller admin

```php
// app/Http/Controllers/Admin/AnalyticsController.php
<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\AnalyticsService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AnalyticsController extends Controller
{
    public function __construct(
        private readonly AnalyticsService $analytics,
    ) {}

    /**
     * Dashboard analytics principal.
     * Route : GET /admin/analytics
     * Nom   : admin.analytics.index
     */
    public function index(Request $request): Response
    {
        $period = $request->get('period', '30d');

        $overview = $this->analytics->getOverview($period);
        $devices = $this->analytics->getDeviceBreakdown($period);
        $countries = $this->analytics->getCountryBreakdown($period);

        return Inertia::render('Admin/Analytics/Index', [
            'overview'  => $overview,
            'devices'   => $devices,
            'countries' => $countries,
            'period'    => $period,
            'periods'   => [
                ['value' => '7d',  'label' => __('cms.analytics.period_7d')],
                ['value' => '30d', 'label' => __('cms.analytics.period_30d')],
                ['value' => '90d', 'label' => __('cms.analytics.period_90d')],
                ['value' => '1y',  'label' => __('cms.analytics.period_1y')],
            ],
        ]);
    }

    /**
     * Stats detaillees pour une page specifique.
     * Route : GET /admin/analytics/page
     * Nom   : admin.analytics.page
     */
    public function page(Request $request): Response
    {
        $path = $request->get('path', '/');
        $period = $request->get('period', '30d');

        $stats = $this->analytics->getPageStats($path, $period);

        return Inertia::render('Admin/Analytics/PageDetail', [
            'stats'  => $stats,
            'period' => $period,
        ]);
    }
}
```

### Routes

```php
// routes/admin.php
Route::prefix('admin')->middleware(['auth', 'verified', 'role:admin'])->group(function () {
    // ...

    Route::get('/analytics', [AnalyticsController::class, 'index'])
        ->name('admin.analytics.index');

    Route::get('/analytics/page', [AnalyticsController::class, 'page'])
        ->name('admin.analytics.page');
});
```

---

## 11. Composants React (Dashboard admin)

### Page principale : AnalyticsDashboard

```tsx
// resources/js/pages/Admin/Analytics/Index.tsx
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { router } from '@inertiajs/react';

import AdminLayout from '@/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import PageViewsChart from '@/components/analytics/PageViewsChart';
import TopPagesTable from '@/components/analytics/TopPagesTable';
import TrafficSourcesTable from '@/components/analytics/TrafficSourcesTable';
import DeviceBreakdownChart from '@/components/analytics/DeviceBreakdownChart';
import CountryTable from '@/components/analytics/CountryTable';
import KpiCard from '@/components/analytics/KpiCard';

// --- Types ---

interface PeriodData {
    date: string;
    views: number;
    visitors: number;
}

interface TopPage {
    path: string;
    total_views: number;
    unique_visitors: number;
}

interface TrafficSource {
    domain: string;
    visits: number;
}

interface DeviceData {
    device_type: string;
    count: number;
}

interface CountryData {
    country: string;
    count: number;
}

interface PeriodOption {
    value: string;
    label: string;
}

interface AnalyticsIndexProps {
    overview: {
        total_views: number;
        unique_visitors: number;
        top_pages: TopPage[];
        top_referrers: TrafficSource[];
        period_data: PeriodData[];
    };
    devices: DeviceData[];
    countries: CountryData[];
    period: string;
    periods: PeriodOption[];
}

// --- Composant principal ---

export default function AnalyticsIndex({
    overview,
    devices,
    countries,
    period,
    periods,
}: AnalyticsIndexProps) {
    const handlePeriodChange = (value: string) => {
        router.get(
            route('admin.analytics.index'),
            { period: value },
            { preserveState: true, preserveScroll: true },
        );
    };

    // Calcul du taux de rebond approximatif
    const bounceRate =
        overview.total_views > 0
            ? Math.round(
                  (1 - overview.unique_visitors / overview.total_views) * 100,
              )
            : 0;

    // Pages par visite (approximation)
    const pagesPerVisit =
        overview.unique_visitors > 0
            ? (overview.total_views / overview.unique_visitors).toFixed(1)
            : '0';

    return (
        <AdminLayout>
            <Head title="Analytics" />

            <div className="space-y-6">
                {/* En-tete avec selecteur de periode */}
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold tracking-tight">
                        Analytics
                    </h1>
                    <Select value={period} onValueChange={handlePeriodChange}>
                        <SelectTrigger className="w-40">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {periods.map((p) => (
                                <SelectItem key={p.value} value={p.value}>
                                    {p.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* KPIs */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <KpiCard
                        title="Total vues"
                        value={overview.total_views.toLocaleString()}
                        icon="eye"
                    />
                    <KpiCard
                        title="Visiteurs uniques"
                        value={overview.unique_visitors.toLocaleString()}
                        icon="users"
                    />
                    <KpiCard
                        title="Pages / visite"
                        value={pagesPerVisit}
                        icon="layers"
                    />
                    <KpiCard
                        title="Taux de rebond"
                        value={`${bounceRate}%`}
                        icon="log-out"
                    />
                </div>

                {/* Graphique principal */}
                <Card>
                    <CardHeader>
                        <CardTitle>Vues de pages</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <PageViewsChart data={overview.period_data} />
                    </CardContent>
                </Card>

                {/* Grille inferieure */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Top pages */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Pages les plus vues</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <TopPagesTable pages={overview.top_pages} />
                        </CardContent>
                    </Card>

                    {/* Sources de trafic */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Sources de trafic</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <TrafficSourcesTable
                                sources={overview.top_referrers}
                            />
                        </CardContent>
                    </Card>

                    {/* Repartition appareils */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Appareils</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <DeviceBreakdownChart data={devices} />
                        </CardContent>
                    </Card>

                    {/* Repartition geographique */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Pays</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CountryTable data={countries} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}
```

### Composant : PageViewsChart (Recharts)

```tsx
// resources/js/components/analytics/PageViewsChart.tsx
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

interface PeriodData {
    date: string;
    views: number;
    visitors: number;
}

interface PageViewsChartProps {
    data: PeriodData[];
}

export default function PageViewsChart({ data }: PageViewsChartProps) {
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
        });
    };

    return (
        <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={data}>
                <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    className="text-xs text-muted-foreground"
                />
                <YAxis className="text-xs text-muted-foreground" />
                <Tooltip
                    labelFormatter={formatDate}
                    contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid hsl(var(--border))',
                        backgroundColor: 'hsl(var(--popover))',
                        color: 'hsl(var(--popover-foreground))',
                    }}
                />
                <Area
                    type="monotone"
                    dataKey="views"
                    name="Vues"
                    stroke="#6366f1"
                    fillOpacity={1}
                    fill="url(#colorViews)"
                />
                <Area
                    type="monotone"
                    dataKey="visitors"
                    name="Visiteurs"
                    stroke="#22c55e"
                    fillOpacity={1}
                    fill="url(#colorVisitors)"
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}
```

### Composant : KpiCard

```tsx
// resources/js/components/analytics/KpiCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Layers, LogOut, Users } from 'lucide-react';

interface KpiCardProps {
    title: string;
    value: string;
    icon: 'eye' | 'users' | 'layers' | 'log-out';
}

const iconMap = {
    eye: Eye,
    users: Users,
    layers: Layers,
    'log-out': LogOut,
};

export default function KpiCard({ title, value, icon }: KpiCardProps) {
    const Icon = iconMap[icon];

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
            </CardContent>
        </Card>
    );
}
```

### Composant : TopPagesTable

```tsx
// resources/js/components/analytics/TopPagesTable.tsx
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface TopPage {
    path: string;
    total_views: number;
    unique_visitors: number;
}

interface TopPagesTableProps {
    pages: TopPage[];
}

export default function TopPagesTable({ pages }: TopPagesTableProps) {
    if (pages.length === 0) {
        return (
            <p className="py-4 text-center text-sm text-muted-foreground">
                Aucune donnee pour cette periode.
            </p>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Page</TableHead>
                    <TableHead className="text-right">Vues</TableHead>
                    <TableHead className="text-right">Visiteurs</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {pages.map((page) => (
                    <TableRow key={page.path}>
                        <TableCell className="max-w-[300px] truncate font-mono text-sm">
                            {page.path}
                        </TableCell>
                        <TableCell className="text-right">
                            {page.total_views.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                            {page.unique_visitors.toLocaleString()}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
```

### Composant : TrafficSourcesTable

```tsx
// resources/js/components/analytics/TrafficSourcesTable.tsx
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface TrafficSource {
    domain: string;
    visits: number;
}

interface TrafficSourcesTableProps {
    sources: TrafficSource[];
}

export default function TrafficSourcesTable({ sources }: TrafficSourcesTableProps) {
    if (sources.length === 0) {
        return (
            <p className="py-4 text-center text-sm text-muted-foreground">
                Aucune source de trafic pour cette periode.
            </p>
        );
    }

    const total = sources.reduce((sum, s) => sum + s.visits, 0);

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Visites</TableHead>
                    <TableHead className="text-right">%</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {sources.map((source) => (
                    <TableRow key={source.domain}>
                        <TableCell className="font-mono text-sm">
                            {source.domain}
                        </TableCell>
                        <TableCell className="text-right">
                            {source.visits.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                            {total > 0
                                ? Math.round((source.visits / total) * 100)
                                : 0}
                            %
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
```

### Composant : DeviceBreakdownChart

```tsx
// resources/js/components/analytics/DeviceBreakdownChart.tsx
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface DeviceData {
    device_type: string;
    count: number;
}

interface DeviceBreakdownChartProps {
    data: DeviceData[];
}

const COLORS: Record<string, string> = {
    desktop: '#6366f1',
    mobile: '#22c55e',
    tablet: '#f59e0b',
};

const LABELS: Record<string, string> = {
    desktop: 'Desktop',
    mobile: 'Mobile',
    tablet: 'Tablette',
};

export default function DeviceBreakdownChart({ data }: DeviceBreakdownChartProps) {
    if (data.length === 0) {
        return (
            <p className="py-4 text-center text-sm text-muted-foreground">
                Aucune donnee pour cette periode.
            </p>
        );
    }

    const chartData = data.map((item) => ({
        name: LABELS[item.device_type] ?? item.device_type,
        value: item.count,
        color: COLORS[item.device_type] ?? '#94a3b8',
    }));

    return (
        <ResponsiveContainer width="100%" height={250}>
            <PieChart>
                <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                >
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Pie>
                <Tooltip />
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    );
}
```

### Composant : CountryTable

```tsx
// resources/js/components/analytics/CountryTable.tsx
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface CountryData {
    country: string;
    count: number;
}

interface CountryTableProps {
    data: CountryData[];
}

export default function CountryTable({ data }: CountryTableProps) {
    if (data.length === 0) {
        return (
            <p className="py-4 text-center text-sm text-muted-foreground">
                Aucune donnee geographique pour cette periode.
            </p>
        );
    }

    const total = data.reduce((sum, c) => sum + c.count, 0);

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Pays</TableHead>
                    <TableHead className="text-right">Vues</TableHead>
                    <TableHead className="text-right">%</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((row) => (
                    <TableRow key={row.country}>
                        <TableCell className="font-mono text-sm uppercase">
                            {row.country}
                        </TableCell>
                        <TableCell className="text-right">
                            {row.count.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                            {total > 0
                                ? Math.round((row.count / total) * 100)
                                : 0}
                            %
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
```

---

## 12. Widget dashboard (vue d'ensemble rapide)

Un composant leger pour le dashboard admin principal qui affiche un mini-graphique des 7 derniers jours.

```tsx
// resources/js/components/analytics/AnalyticsWidget.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@inertiajs/react';
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip } from 'recharts';

interface WidgetData {
    date: string;
    views: number;
}

interface AnalyticsWidgetProps {
    data: WidgetData[];
    totalViews: number;
}

export default function AnalyticsWidget({ data, totalViews }: AnalyticsWidgetProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">
                    Vues (7 derniers jours)
                </CardTitle>
                <Link
                    href={route('admin.analytics.index')}
                    className="text-xs text-primary hover:underline"
                >
                    Voir tout
                </Link>
            </CardHeader>
            <CardContent>
                <div className="mb-2 text-2xl font-bold">
                    {totalViews.toLocaleString()}
                </div>
                <ResponsiveContainer width="100%" height={80}>
                    <BarChart data={data}>
                        <XAxis dataKey="date" hide />
                        <Tooltip
                            labelFormatter={(label: string) =>
                                new Date(label).toLocaleDateString('fr-FR', {
                                    day: 'numeric',
                                    month: 'short',
                                })
                            }
                        />
                        <Bar
                            dataKey="views"
                            fill="#6366f1"
                            radius={[2, 2, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
```

---

## 13. Integration Google Analytics 4 (optionnel)

L'integration GA4 est entierement optionnelle et se limite a l'injection du script de tracking Google sur les pages front. Les donnees GA4 restent dans la console Google Analytics et ne sont pas rapatriees dans le dashboard admin.

### Configuration

Le Measurement ID est saisi dans les parametres du CMS (`admin.settings`) ou via la variable d'environnement `GA4_MEASUREMENT_ID`.

```php
// config/cms.php (section analytics)
'analytics' => [
    'enabled' => true,
    'driver' => 'database',                              // 'database' ou 'ga4' (tracking uniquement)
    'ga4_measurement_id' => env('GA4_MEASUREMENT_ID'),   // G-XXXXXXXXXX
    'retention_days' => 90,
    'aggregate_daily' => true,
    'respect_dnt' => true,
    'bot_detection' => true,
    'excluded_paths' => ['/admin/*', '/api/*'],
],
```

### Injection du script gtag.js

```php
// app/CMS/Analytics/GA4ScriptInjector.php
<?php

declare(strict_types=1);

namespace App\CMS\Analytics;

class GA4ScriptInjector
{
    /**
     * Genere le snippet HTML Google Analytics 4.
     * Retourne null si pas de Measurement ID configure.
     */
    public static function render(): ?string
    {
        $measurementId = config('cms.analytics.ga4_measurement_id');

        if (! $measurementId) {
            return null;
        }

        // Echapper le Measurement ID
        $id = e($measurementId);

        return <<<HTML
        <!-- Google Analytics 4 -->
        <script async src="https://www.googletagmanager.com/gtag/js?id={$id}"></script>
        <script>
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '{$id}', {
                anonymize_ip: true,
                cookie_flags: 'SameSite=None;Secure'
            });
        </script>
        HTML;
    }

    /**
     * Version avec gestion du consentement cookies.
     * Le script ne se declenche qu'apres acceptation des cookies analytics.
     */
    public static function renderWithConsent(): ?string
    {
        $measurementId = config('cms.analytics.ga4_measurement_id');

        if (! $measurementId) {
            return null;
        }

        $id = e($measurementId);

        return <<<HTML
        <!-- Google Analytics 4 (avec consentement) -->
        <script>
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}

            // Mode consentement par defaut : refuse
            gtag('consent', 'default', {
                analytics_storage: 'denied',
            });

            // Quand l'utilisateur accepte les cookies analytics,
            // appeler : gtag('consent', 'update', { analytics_storage: 'granted' });
            window.addEventListener('cookie-consent-analytics', function() {
                gtag('consent', 'update', { analytics_storage: 'granted' });
            });
        </script>
        <script async src="https://www.googletagmanager.com/gtag/js?id={$id}"></script>
        <script>
            gtag('js', new Date());
            gtag('config', '{$id}', {
                anonymize_ip: true,
                cookie_flags: 'SameSite=None;Secure'
            });
        </script>
        HTML;
    }
}
```

### Utilisation dans le layout front

```blade
{{-- resources/views/layouts/front.blade.php ou via Inertia --}}
<head>
    {{-- ... --}}

    @if(config('cms.analytics.ga4_measurement_id'))
        {!! \App\CMS\Analytics\GA4ScriptInjector::renderWithConsent() !!}
    @endif
</head>
```

---

## 14. RGPD et confidentialite

### Principes appliques

| Aspect | Implementation |
|--------|---------------|
| **Pas de cookies tiers** | L'analytics integre est 100% server-side, aucun cookie n'est depose |
| **IP anonymisees** | L'IP n'est jamais stockee en base ; seul le code pays est conserve |
| **Retention limitee** | Donnees brutes supprimees apres 90 jours (configurable) |
| **Donnees agregees** | Les donnees dans `page_views_daily` ne contiennent aucune donnee personnelle |
| **Do Not Track** | Le header DNT est respecte par defaut (configurable) |
| **GA4 et consentement** | Le script GA4 utilise le mode consentement ; ne s'active qu'apres acceptation |
| **Desactivation** | Le tracking peut etre entierement desactive dans la configuration |
| **Pas de fingerprinting** | Aucun fingerprint navigateur n'est calcule ni stocke |

### Anonymisation de l'IP

```php
/**
 * L'IP n'est utilisee QUE pour deduire le code pays via GeoIP.
 * Elle n'est jamais ecrite en base de donnees.
 *
 * Flux :
 * 1. Requete HTTP arrive avec IP dans $_SERVER
 * 2. AnalyticsService::resolveCountry($ip) → retourne 'FR', 'US', etc.
 * 3. Seul le code pays (2 caracteres) est enregistre dans PageView
 * 4. L'IP est supprimee (jamais passee au Job)
 */
```

### Option de desactivation complete

```php
// Dans les parametres admin : Settings > Analytics
// Ou dans config/cms.php :
'analytics' => [
    'enabled' => false,  // Desactive completement le tracking
],
```

---

## 15. Configuration complete

```php
// config/cms.php (section analytics)
'analytics' => [
    /*
    |--------------------------------------------------------------------------
    | Activer/desactiver le tracking analytics
    |--------------------------------------------------------------------------
    */
    'enabled' => env('CMS_ANALYTICS_ENABLED', true),

    /*
    |--------------------------------------------------------------------------
    | Driver de tracking
    |--------------------------------------------------------------------------
    | 'database' : analytics integre (server-side, pas de cookies)
    | 'ga4'      : Google Analytics 4 uniquement (script client-side)
    | 'both'     : les deux simultanement
    */
    'driver' => env('CMS_ANALYTICS_DRIVER', 'database'),

    /*
    |--------------------------------------------------------------------------
    | Google Analytics 4 - Measurement ID
    |--------------------------------------------------------------------------
    | Format : G-XXXXXXXXXX
    | Utilise uniquement si driver = 'ga4' ou 'both'
    */
    'ga4_measurement_id' => env('GA4_MEASUREMENT_ID'),

    /*
    |--------------------------------------------------------------------------
    | Retention des donnees brutes (en jours)
    |--------------------------------------------------------------------------
    | Les donnees brutes (cms_page_views) sont supprimees apres cette periode.
    | Les donnees agregees (cms_page_views_daily) sont conservees indefiniment.
    */
    'retention_days' => (int) env('CMS_ANALYTICS_RETENTION_DAYS', 90),

    /*
    |--------------------------------------------------------------------------
    | Agregation quotidienne automatique
    |--------------------------------------------------------------------------
    */
    'aggregate_daily' => true,

    /*
    |--------------------------------------------------------------------------
    | Respecter le header Do Not Track
    |--------------------------------------------------------------------------
    */
    'respect_dnt' => true,

    /*
    |--------------------------------------------------------------------------
    | Detection des bots / crawlers
    |--------------------------------------------------------------------------
    */
    'bot_detection' => true,

    /*
    |--------------------------------------------------------------------------
    | Chemins exclus du tracking
    |--------------------------------------------------------------------------
    | Patterns glob. Les pages admin et API sont exclues par defaut.
    */
    'excluded_paths' => [
        'admin/*',
        'api/*',
        '_debugbar/*',
        'telescope/*',
        'horizon/*',
    ],
],
```

---

## 16. Resume de l'architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        Requete HTTP (front)                         │
└─────────────────────────────┬────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│               Middleware TrackPageView                               │
│  - Filtre admin/API/bots/DNT                                        │
│  - Resout le modele viewable (Page/Post)                            │
│  - Dispatch TrackPageViewJob (queue 'analytics')                    │
└─────────────────────────────┬────────────────────────────────────────┘
                              │ (async)
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│               TrackPageViewJob                                       │
│  - Insert dans cms_page_views                                        │
└─────────────────────────────┬────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│               cms_page_views (donnees brutes)                        │
│  - Conservees 90 jours par defaut                                    │
└─────────────────────────────┬────────────────────────────────────────┘
                              │ (cron 02:00)
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│         AggregatePageViewsJob (cms:analytics:aggregate)              │
│  - Consolide les vues par path/date                                  │
│  - Calcule les visiteurs uniques approximatifs                       │
└─────────────────────────────┬────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│         cms_page_views_daily (donnees agregees)                      │
│  - Conservees indefiniment                                           │
│  - Utilisees par le dashboard admin                                  │
└─────────────────────────────┬────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│               AnalyticsController → Inertia                          │
│  - getOverview(), getTopPages(), getDeviceBreakdown()                │
│  - Rendu via React : AnalyticsDashboard                              │
└──────────────────────────────────────────────────────────────────────┘

      ┌─────────────────────────────────┐
      │  GA4 (optionnel, client-side)   │
      │  Script gtag.js injecte dans    │
      │  le <head> des pages front      │
      │  Gere via consent mode          │
      └─────────────────────────────────┘
```

---

## 17. Fichiers a creer

| Fichier | Description |
|---------|-------------|
| `database/migrations/xxxx_create_cms_page_views_table.php` | Migration table donnees brutes |
| `database/migrations/xxxx_create_cms_page_views_daily_table.php` | Migration table agregee |
| `app/Models/PageView.php` | Modele Eloquent page_views |
| `app/Models/PageViewDaily.php` | Modele Eloquent page_views_daily |
| `app/Services/AnalyticsService.php` | Service principal analytics |
| `app/Jobs/TrackPageViewJob.php` | Job async de tracking |
| `app/Jobs/AggregatePageViewsJob.php` | Job d'agregation quotidienne |
| `app/Http/Middleware/TrackPageView.php` | Middleware de tracking |
| `app/Http/Controllers/Admin/AnalyticsController.php` | Controller admin |
| `app/Console/Commands/AnalyticsAggregateCommand.php` | Commande artisan agregation |
| `app/Console/Commands/AnalyticsCleanupCommand.php` | Commande artisan nettoyage |
| `app/CMS/Analytics/GA4ScriptInjector.php` | Injection script GA4 |
| `resources/js/pages/Admin/Analytics/Index.tsx` | Page dashboard analytics |
| `resources/js/pages/Admin/Analytics/PageDetail.tsx` | Page detail par page |
| `resources/js/components/analytics/PageViewsChart.tsx` | Graphique vues (Recharts) |
| `resources/js/components/analytics/KpiCard.tsx` | Carte KPI |
| `resources/js/components/analytics/TopPagesTable.tsx` | Table top pages |
| `resources/js/components/analytics/TrafficSourcesTable.tsx` | Table sources trafic |
| `resources/js/components/analytics/DeviceBreakdownChart.tsx` | Pie chart appareils |
| `resources/js/components/analytics/CountryTable.tsx` | Table pays |
| `resources/js/components/analytics/AnalyticsWidget.tsx` | Widget mini dashboard |

---

## 18. Dependances

| Package | Usage | Installation |
|---------|-------|-------------|
| `recharts` | Graphiques React (line, bar, pie) | `npm install recharts` |
| `torann/geoip` ou `stevebauman/location` | Resolution GeoIP (optionnel) | `composer require stevebauman/location` |

> **Note :** Le package GeoIP est optionnel. Sans lui, la colonne `country` restera `null` et la repartition geographique ne sera pas disponible.

---

## 19. Tests

### Tests unitaires (PHPUnit)

```php
// tests/Unit/Services/AnalyticsServiceTest.php

// Tests a couvrir :
// - trackPageView() dispatch bien un job en queue
// - trackPageView() respecte le header DNT
// - trackPageView() ignore les bots
// - isBot() detecte correctement les user-agents de bots
// - detectDeviceType() retourne le bon type (desktop, mobile, tablet)
// - detectBrowser() retourne le bon navigateur
// - aggregate() consolide correctement les donnees
// - cleanup() supprime les donnees au-dela de la retention
// - getOverview() retourne les bonnes metriques
// - getTopPages() retourne les pages triees par vues
// - getTrafficSources() groupe correctement les referrers
// - getDeviceBreakdown() retourne la bonne repartition
// - resolvePeriod() calcule les bonnes dates
```

### Tests d'integration

```php
// tests/Feature/Analytics/AnalyticsTrackingTest.php

// Tests a couvrir :
// - Le middleware enregistre une vue pour une page front
// - Le middleware n'enregistre PAS pour les pages admin
// - Le middleware n'enregistre PAS pour les requetes API
// - Le middleware n'enregistre PAS pour les bots
// - Le middleware respecte DNT quand active
// - L'agregation cree les bonnes lignes dans page_views_daily
// - Le cleanup supprime les bonnes lignes
// - Le controller retourne les bonnes donnees Inertia
```

### Tests frontend (Vitest)

```typescript
// resources/js/components/analytics/__tests__/PageViewsChart.test.tsx
// resources/js/components/analytics/__tests__/TopPagesTable.test.tsx
// resources/js/components/analytics/__tests__/DeviceBreakdownChart.test.tsx

// Tests a couvrir :
// - Le graphique se rend sans erreur avec des donnees
// - Le graphique gere les donnees vides
// - Les tables affichent le bon nombre de lignes
// - Les pourcentages sont calcules correctement
// - Le selecteur de periode declenche la navigation Inertia
```
