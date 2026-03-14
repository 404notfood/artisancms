# Blueprint 16 - Multi-site / Multi-tenant

## Vue d'ensemble
Le multi-site permet de gérer plusieurs sites clients depuis une seule installation d'ArtisanCMS. Chaque site a son propre domaine, contenu, thème et utilisateurs, mais partage le même code et la même base de données.

---

## Approche choisie : Shared DB avec tenant isolation

```
┌──────────────────────────────────────────────┐
│         Installation ArtisanCMS unique        │
│                                                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │  Site A   │ │  Site B   │ │  Site C   │     │
│  │ client.fr │ │ agence.io │ │ shop.com  │     │
│  │ theme: X  │ │ theme: Y  │ │ theme: Z  │     │
│  │ 12 pages  │ │ 8 pages   │ │ 25 pages  │     │
│  └──────────┘ └──────────┘ └──────────┘      │
│                    │                           │
│            Base de données unique              │
│         (toutes les tables ont site_id)        │
└──────────────────────────────────────────────┘
```

**Pourquoi shared DB ?**
- Plus simple à maintenir (un seul backup, une seule migration)
- Pas besoin de créer une DB par client
- Les requêtes sont scopées par `site_id` (performant avec index)
- Possibilité de partager la media library entre sites

---

## 1. Table : sites

```php
Schema::create('sites', function (Blueprint $table) {
    $table->id();
    $table->string('name');                         // "Client Corp"
    $table->string('slug')->unique();               // "client-corp"
    $table->string('domain')->unique()->nullable();  // "client-corp.fr"
    $table->string('subdomain')->unique()->nullable(); // "client-corp" (.artisancms.dev)
    $table->boolean('is_primary')->default(false);   // Site principal (admin global)
    $table->boolean('is_active')->default(true);
    $table->json('settings')->nullable();            // Settings spécifiques au site
    $table->json('branding')->nullable();            // Logo, couleurs, nom custom (white-label)
    $table->string('locale')->default('fr');
    $table->string('timezone')->default('Europe/Paris');
    $table->foreignId('owner_id')->nullable()->constrained('users')->nullOnDelete();
    $table->timestamp('expires_at')->nullable();     // Pour les sites avec abonnement
    $table->timestamps();

    $table->index('domain');
    $table->index('subdomain');
    $table->index('is_active');
});
```

## 2. Table pivot : site_users

```php
Schema::create('site_users', function (Blueprint $table) {
    $table->id();
    $table->foreignId('site_id')->constrained()->cascadeOnDelete();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->foreignId('role_id')->nullable()->constrained()->nullOnDelete();
    $table->boolean('is_owner')->default(false);
    $table->timestamps();

    $table->unique(['site_id', 'user_id']);
});
```

## 3. Ajout de `site_id` aux tables existantes

```php
// Migration : add_site_id_to_content_tables
// Ajouter site_id à : pages, posts, media, menus, settings, cms_plugins, cms_themes

foreach (['pages', 'posts', 'media', 'menus', 'settings'] as $table) {
    Schema::table($table, function (Blueprint $table) {
        $table->foreignId('site_id')->after('id')->constrained()->cascadeOnDelete();
        $table->index('site_id');
    });
}
```

---

## 4. Middleware de résolution du site

```php
// app/Http/Middleware/ResolveSite.php
<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\Site;
use Closure;
use Illuminate\Http\Request;

class ResolveSite
{
    public function handle(Request $request, Closure $next)
    {
        $site = $this->resolveSite($request);

        if (!$site) {
            abort(404, 'Site non trouvé.');
        }

        if (!$site->is_active) {
            abort(503, 'Ce site est actuellement désactivé.');
        }

        // Stocker le site courant dans le container
        app()->instance('current.site', $site);

        // Appliquer les settings du site
        app()->setLocale($site->locale);
        config(['app.timezone' => $site->timezone]);

        return $next($request);
    }

    protected function resolveSite(Request $request): ?Site
    {
        $host = $request->getHost();

        // 1. Chercher par domaine custom
        $site = Site::where('domain', $host)->first();
        if ($site) return $site;

        // 2. Chercher par sous-domaine
        $baseDomain = config('cms.multisite.base_domain', 'artisancms.dev');
        if (str_ends_with($host, ".{$baseDomain}")) {
            $subdomain = str_replace(".{$baseDomain}", '', $host);
            return Site::where('subdomain', $subdomain)->first();
        }

        // 3. Retourner le site principal
        return Site::where('is_primary', true)->first();
    }
}
```

---

## 5. Trait HasSiteScope

```php
// app/Traits/HasSiteScope.php
<?php

declare(strict_types=1);

namespace App\Traits;

use App\Models\Site;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

trait HasSiteScope
{
    /**
     * Boot : scope automatique par site courant
     */
    protected static function bootHasSiteScope(): void
    {
        // Filtrer automatiquement par site courant
        static::addGlobalScope('site', function (Builder $builder) {
            if (app()->bound('current.site')) {
                $builder->where($builder->getModel()->getTable() . '.site_id', app('current.site')->id);
            }
        });

        // Auto-assigner le site_id à la création
        static::creating(function ($model) {
            if (app()->bound('current.site') && empty($model->site_id)) {
                $model->site_id = app('current.site')->id;
            }
        });
    }

    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }
}
```

**Usage dans les models :**
```php
// app/Models/Page.php
class Page extends Model
{
    use SoftDeletes, HasSiteScope;
    // ...
}
```

Avec ce trait, `Page::all()` retourne automatiquement les pages du site courant. Pas besoin de modifier les controllers ou services.

---

## 6. Admin : gestion des sites

### Controller
```php
// app/Http/Controllers/Admin/SiteController.php
class SiteController extends Controller
{
    public function index(): Response
    {
        // Accessible uniquement aux super-admins
        $sites = Site::withCount(['pages', 'posts', 'users'])->get();
        return Inertia::render('Admin/Sites/Index', ['sites' => $sites]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Sites/Create');
    }

    public function store(StoreSiteRequest $request): RedirectResponse
    {
        $site = Site::create($request->validated());

        // Créer les settings par défaut pour le nouveau site
        app(InstallerService::class)->seedSiteDefaults($site);

        return redirect()->route('admin.sites.index')
            ->with('message', __('cms.sites.messages.created'));
    }

    public function switch(Site $site): RedirectResponse
    {
        // Switcher vers un autre site
        session(['current_site_id' => $site->id]);
        return redirect()->route('admin.dashboard');
    }
}
```

### Pages React
```
resources/js/pages/Admin/Sites/
├── Index.tsx          # Liste des sites avec stats
├── Create.tsx         # Formulaire création de site
├── Edit.tsx           # Paramètres du site
└── components/
    ├── SiteCard.tsx    # Carte d'un site (nom, domaine, stats)
    └── SiteSwitcher.tsx # Dropdown dans le header admin pour switcher
```

---

## 7. Site Switcher dans l'admin

```tsx
// resources/js/components/site-switcher.tsx
interface SiteSwitcherProps {
    currentSite: Site;
    sites: Site[];
}

export function SiteSwitcher({ currentSite, sites }: SiteSwitcherProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span>{currentSite.name}</span>
                <ChevronDown className="h-3 w-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                {sites.map(site => (
                    <DropdownMenuItem key={site.id} asChild>
                        <Link href={`/admin/sites/${site.id}/switch`} method="post">
                            {site.name}
                            {site.id === currentSite.id && <Check className="ml-auto h-4 w-4" />}
                        </Link>
                    </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/admin/sites/create">
                        <Plus className="mr-2 h-4 w-4" /> Nouveau site
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
```

---

## 8. Configuration

```php
// config/cms.php — section multisite
'multisite' => [
    'enabled' => env('CMS_MULTISITE', false),
    'base_domain' => env('CMS_BASE_DOMAIN', 'artisancms.dev'),
    'max_sites' => env('CMS_MAX_SITES', 50),
    'shared_media' => false,           // Partager la media library entre sites
    'allow_custom_domains' => true,    // Autoriser les domaines custom
],
```

---

## 9. Cache multi-site

Les clés de cache doivent être préfixées par site :
```php
// Clé sans multi-site : cms.settings.all
// Clé avec multi-site : cms.site.{site_id}.settings.all

// Helper
function siteCacheKey(string $key): string
{
    $siteId = app()->bound('current.site') ? app('current.site')->id : 'global';
    return "cms.site.{$siteId}.{$key}";
}
```

---

## 10. Phase d'implémentation

Le multi-site est un **feature Phase 8** (après la V1 de base). Il nécessite que toute la V1 fonctionne d'abord en mono-site.

**Étapes :**
1. Créer la table `sites` et `site_users`
2. Ajouter `site_id` à toutes les tables de contenu
3. Créer le trait `HasSiteScope` et l'appliquer aux models
4. Créer le middleware `ResolveSite`
5. Créer le `SiteSwitcher` dans l'admin
6. Adapter le cache (préfixe par site)
7. Tests multi-tenant
