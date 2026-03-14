# Blueprint 08 - Phases d'implémentation détaillées

## Vue d'ensemble

Chaque phase est découpée en tâches précises avec :
- Les fichiers à créer/modifier
- Les commandes à exécuter
- Les critères de validation
- L'ordre d'exécution

---

## Phase 1 : Fondations (Semaine 1-2)

### 1.1 Installation Laravel + Starter Kit React

**Commandes :**
```bash
# Dans Laragon, ouvrir un terminal
cd D:\Logiciel\laragon\www\new-cms

# Créer le projet Laravel
composer create-project laravel/laravel . --prefer-dist

# Installer le starter kit React (Inertia 2)
# → https://laravel.com/docs/12.x/starter-kits
php artisan breeze:install react --typescript --ssr
# OU via laravel new (si on refait le dossier)

npm install
npm run build
```

**Configuration .env :**
```env
APP_NAME=ArtisanCMS
APP_URL=http://artisan-cms.test
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=artisan_cms
DB_USERNAME=root
DB_PASSWORD=
```

**Fichiers créés/modifiés :**
- `.env` → config DB
- `config/app.php` → nom de l'app
- Vérifier que `resources/js/pages/` existe avec les pages auth

**Validation :**
- [ ] `php artisan serve` démarre sans erreur
- [ ] `npm run dev` lance Vite sans erreur
- [ ] Page login accessible sur `http://localhost:8000/login`
- [ ] Création de compte + login fonctionnels

---

### 1.2 Configuration npm workspaces + Turborepo

**Commandes :**
```bash
# Installer Turborepo
npm install -D turbo

# Créer les dossiers packages
mkdir -p packages/page-builder/src
mkdir -p packages/blocks/src
mkdir -p packages/ui/src
mkdir -p packages/theme-engine/src
```

**Fichiers à modifier/créer :**

Dans le `package.json` racine, ajouter le champ workspaces :
```json
{
  "workspaces": [
    "packages/*"
  ]
}
```

`turbo.json` :
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"]
    },
    "lint": {}
  }
}
```

Chaque package aura son propre `package.json` :

`packages/page-builder/package.json` :
```json
{
  "name": "@artisan/page-builder",
  "version": "0.1.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "build": "tsup src/index.ts --format esm,cjs --dts",
    "dev": "tsup src/index.ts --format esm,cjs --dts --watch",
    "test": "vitest"
  },
  "dependencies": {
    "@dnd-kit/core": "^6.0.0",
    "@dnd-kit/sortable": "^10.0.0",
    "@dnd-kit/utilities": "^3.2.0",
    "@dnd-kit/modifiers": "^9.0.0"
  },
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  }
}
```

`packages/blocks/package.json` :
```json
{
  "name": "@artisan/blocks",
  "version": "0.1.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts",
  "peerDependencies": {
    "react": "^19.0.0"
  }
}
```

`packages/ui/package.json` :
```json
{
  "name": "@artisan/ui",
  "version": "0.1.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts",
  "peerDependencies": {
    "react": "^19.0.0"
  }
}
```

`packages/theme-engine/package.json` :
```json
{
  "name": "@artisan/theme-engine",
  "version": "0.1.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts",
  "peerDependencies": {
    "react": "^19.0.0"
  }
}
```

**Validation :**
- [ ] `npm install` résout les workspaces
- [ ] `npm run build --workspace=@artisan/page-builder` compile (même si vide)

---

### 1.3 Migrations Core CMS

**Commandes :**
```bash
# Créer toutes les migrations (dans cet ordre précis pour les foreign keys)
php artisan make:migration create_roles_table
php artisan make:migration add_role_to_users_table
php artisan make:migration create_pages_table
php artisan make:migration create_posts_table
php artisan make:migration create_media_table
php artisan make:migration create_menus_table
php artisan make:migration create_menu_items_table
php artisan make:migration create_taxonomies_table
php artisan make:migration create_taxonomy_terms_table
php artisan make:migration create_termables_table
php artisan make:migration create_settings_table
php artisan make:migration create_cms_plugins_table
php artisan make:migration create_cms_themes_table
php artisan make:migration create_blocks_table
php artisan make:migration create_revisions_table
```

Le contenu de chaque migration est détaillé dans **Blueprint 01 - Database Schema**.

**Validation :**
- [ ] `php artisan migrate` passe sans erreur
- [ ] `php artisan migrate:fresh` recrée tout proprement
- [ ] Toutes les tables sont visibles dans phpMyAdmin/adminer

---

### 1.4 Models Eloquent

**Fichiers à créer :**

```
app/Models/
├── User.php          (modifier l'existant)
├── Role.php
├── Page.php
├── Post.php
├── Media.php
├── Menu.php
├── MenuItem.php
├── Taxonomy.php
├── TaxonomyTerm.php
├── Setting.php
├── CmsPlugin.php
├── CmsTheme.php
├── Block.php
├── Revision.php
```

**Exemple complet - Page.php :**

```php
<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Relations\MorphToMany;
use Illuminate\Database\Eloquent\Casts\Attribute;

class Page extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'title', 'slug', 'content', 'status', 'template',
        'meta_title', 'meta_description', 'meta_keywords', 'og_image',
        'parent_id', 'order', 'created_by', 'published_at',
    ];

    protected $casts = [
        'content' => 'array',              // JSON → array automatique
        'published_at' => 'datetime',
        'order' => 'integer',
    ];

    // --- Relations ---

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Page::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(Page::class, 'parent_id')->orderBy('order');
    }

    public function revisions(): MorphMany
    {
        return $this->morphMany(Revision::class, 'revisionable')->orderByDesc('created_at');
    }

    public function terms(): MorphToMany
    {
        return $this->morphToMany(TaxonomyTerm::class, 'termable', 'termables', 'termable_id', 'term_id');
    }

    // --- Scopes ---

    public function scopePublished($query)
    {
        return $query->where('status', 'published')
            ->where('published_at', '<=', now());
    }

    public function scopeDraft($query)
    {
        return $query->where('status', 'draft');
    }

    // --- Accessors ---

    protected function url(): Attribute
    {
        return Attribute::make(
            get: fn () => '/' . $this->slug,
        );
    }

    protected function isPublished(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->status === 'published' && $this->published_at <= now(),
        );
    }

    // --- Lifecycle ---

    protected static function booted(): void
    {
        static::saving(function (Page $page) {
            // Auto-générer le slug si vide
            if (empty($page->slug)) {
                $page->slug = \Str::slug($page->title);
            }
        });

        static::updated(function (Page $page) {
            // Créer une révision automatique
            if ($page->wasChanged('content')) {
                $page->revisions()->create([
                    'data' => ['content' => $page->getOriginal('content'), 'title' => $page->getOriginal('title')],
                    'reason' => 'auto',
                    'created_by' => auth()->id(),
                ]);
            }
        });
    }
}
```

**Validation :**
- [ ] Tous les models sont créés avec les relations correctes
- [ ] `php artisan tinker` → `Page::create([...])` fonctionne
- [ ] Les relations sont fonctionnelles : `Page::with('author', 'children', 'revisions')->get()`

---

### 1.5 Services métier

**Fichiers à créer :**
```
app/Services/
├── PageService.php
├── PostService.php
├── MediaService.php
├── MenuService.php
├── SettingService.php
├── TaxonomyService.php
```

**Exemple - PageService.php :**

```php
<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Page;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Str;

class PageService
{
    public function list(array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        return Page::query()
            ->with('author')
            ->when($filters['status'] ?? null, fn ($q, $status) => $q->where('status', $status))
            ->when($filters['search'] ?? null, fn ($q, $search) => $q->where('title', 'like', "%{$search}%"))
            ->orderBy('updated_at', 'desc')
            ->paginate($perPage);
    }

    public function create(array $data): Page
    {
        $data['slug'] = $data['slug'] ?? Str::slug($data['title']);
        $data['created_by'] = auth()->id();

        $page = Page::create($data);

        // Hook pour les plugins
        app('cms.plugins')->fireHook('page.created', $page);

        return $page;
    }

    public function update(Page $page, array $data): Page
    {
        app('cms.plugins')->fireHook('page.updating', $page);

        $page->update($data);

        app('cms.plugins')->fireHook('page.updated', $page);

        return $page->fresh();
    }

    public function updateContent(Page $page, array $content): Page
    {
        // Appliquer les filtres des plugins sur le contenu
        $content = app('cms.plugins')->applyFilter('page_content', $content, $page);

        $page->update(['content' => $content]);

        return $page;
    }

    public function delete(Page $page): void
    {
        app('cms.plugins')->fireHook('page.deleting', $page);
        $page->delete(); // Soft delete
    }

    public function findBySlug(string $slug): ?Page
    {
        return Page::published()
            ->where('slug', $slug)
            ->first();
    }
}
```

**Validation :**
- [ ] Les services sont testables en isolation
- [ ] Logique métier dans les services, pas dans les controllers

---

### 1.6 CMS Core (Plugin, Theme, Block engines)

**Fichiers à créer :**
```
app/CMS/
├── CMSServiceProvider.php    # Service Provider principal du CMS
├── Plugins/
│   └── PluginManager.php     # Voir Blueprint 02
├── Themes/
│   └── ThemeManager.php      # Voir Blueprint 03
├── Blocks/
│   └── BlockRegistry.php     # Registre des blocs
└── Facades/
    └── CMS.php               # Facade
```

**CMSServiceProvider.php :**
```php
<?php

namespace App\CMS;

use Illuminate\Support\ServiceProvider;
use App\CMS\Plugins\PluginManager;
use App\CMS\Themes\ThemeManager;
use App\CMS\Blocks\BlockRegistry;

class CMSServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton('cms.plugins', fn () => new PluginManager());
        $this->app->singleton('cms.themes', fn () => new ThemeManager());
        $this->app->singleton('cms.blocks', fn () => new BlockRegistry());
    }

    public function boot(): void
    {
        // Charger les plugins activés
        $this->app->make('cms.plugins')->bootAll();

        // Charger la config du thème actif
        $this->app->make('cms.themes')->getActive();

        // Enregistrer les blocs core
        $this->app->make('cms.blocks')->registerCoreBlocks();

        // Charger les routes admin CMS
        $this->loadRoutesFrom(base_path('routes/admin.php'));
    }
}
```

**Validation :**
- [ ] `CMSServiceProvider` enregistré dans `bootstrap/providers.php`
- [ ] `app('cms.plugins')` retourne une instance de PluginManager
- [ ] `app('cms.themes')` retourne une instance de ThemeManager

---

### 1.7 Système d'installation (type WordPress)

Voir **Blueprint 09 - Installation System** pour l'architecture complète.

**Fichiers à créer :**
```
config/
└── cms.php                                 # Configuration CMS (version, paths, media, admin, cache)

app/Services/
├── RequirementsChecker.php                 # Vérification prérequis (PHP, extensions, permissions)
├── DatabaseConfigurator.php                # Test connexion DB, création DB, écriture .env
└── InstallerService.php                    # Orchestre les 10 étapes d'installation

app/Http/
├── Controllers/
│   └── InstallController.php               # Controller wizard 6 étapes
└── Middleware/
    └── EnsureInstalled.php                 # Redirige vers /install si pas installé

app/Console/Commands/
└── CMSInstall.php                          # php artisan cms:install (CLI)

resources/js/pages/Install/
├── Stack.tsx                               # Étape 1 : Choix du stack (Laravel / Next.js)
├── Language.tsx                             # Étape 2 : Sélection langue
├── Requirements.tsx                        # Étape 3 : Checklist prérequis (adaptés au stack)
├── Database.tsx                            # Étape 4 : Config MySQL
├── Site.tsx                                # Étape 5 : Infos du site
├── Admin.tsx                               # Étape 6 : Compte admin
├── Complete.tsx                            # Succès
├── Error.tsx                               # Erreur
└── components/
    ├── InstallLayout.tsx                   # Layout wizard (stepper + logo)
    ├── StepIndicator.tsx                   # Indicateur 1/7, 2/7...
    ├── StackCard.tsx                       # Carte de choix de stack
    └── PasswordStrength.tsx                # Force du mot de passe
```

**Routes (`routes/web.php`)** :
```
GET  /install                → Étape 1 (choix du stack Laravel/Next.js)
POST /install/stack          → Valider le stack choisi
GET  /install/language       → Étape 2 (langue)
POST /install/language       → Valider langue
GET  /install/requirements   → Étape 3 (prérequis, adaptés au stack)
GET  /install/database       → Étape 4 (DB)
POST /install/database/test  → Tester connexion (AJAX)
POST /install/database       → Valider DB
GET  /install/site           → Étape 5 (site)
POST /install/site           → Valider site
GET  /install/admin          → Étape 6 (admin)
POST /install/execute        → Lancer l'installation (étape 7)
```

**Validation :**
- [ ] `/install` accessible si `storage/.installed` n'existe pas
- [ ] `/install` retourne 404 si `storage/.installed` existe
- [ ] Les 6 étapes s'enchaînent correctement
- [ ] Tester connexion DB fonctionne (bouton AJAX)
- [ ] Installation crée : tables, rôles, admin, settings, thème, blocs, page d'accueil
- [ ] `php artisan cms:install` fonctionne en CLI
- [ ] `php artisan cms:install --quick` installe avec valeurs par défaut

---

### 1.8 Seeders de données initiales (pour le mode dev)

**Fichiers à créer :**
```
database/seeders/
├── RoleSeeder.php
├── AdminUserSeeder.php
├── SettingsSeeder.php
├── BlockSeeder.php
├── DefaultThemeSeeder.php
└── CMSSeeder.php (appelle les autres)
```

**CMSSeeder.php :**
```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class CMSSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,           // Rôles : admin, editor, author, subscriber
            AdminUserSeeder::class,      // Utilisateur admin par défaut
            SettingsSeeder::class,       // Settings par défaut (site name, etc.)
            BlockSeeder::class,          // Blocs core (heading, text, image, etc.)
            DefaultThemeSeeder::class,   // Thème par défaut activé
        ]);
    }
}
```

> **Note** : Les seeders sont utilisés par `migrate:fresh --seed` (dev).
> En production, c'est le wizard `/install` ou `php artisan cms:install` qui s'en charge.

---

### 1.9 Layout Admin CMS

**Fichiers à créer/modifier :**
- `resources/js/layouts/admin-layout.tsx` → Layout avec sidebar CMS
- `resources/js/components/cms-sidebar.tsx` → Navigation admin CMS
- `resources/js/pages/Admin/Dashboard.tsx` → Dashboard admin

**Validation Phase 1 complète :**
- [ ] Wizard `/install` guide l'utilisateur et installe le CMS
- [ ] `php artisan cms:install` fonctionne comme alternative CLI
- [ ] Dashboard admin accessible après login
- [ ] Sidebar avec tous les liens de navigation CMS
- [ ] `php artisan migrate:fresh --seed` reset tout proprement

---

## Phase 2 : Gestion de contenu (Semaine 3-4)

### Tâches
1. **CRUD Pages** : Controller, Service, Form Request, Pages React (index, create, edit)
2. **CRUD Posts** : Idem + association taxonomies
3. **Media Library** : Upload, galerie, crop/resize avec Intervention Image
4. **Menus Builder** : Drag & drop des items de menu (mini dnd-kit)
5. **Taxonomies** : Categories, tags, custom taxonomies
6. **Révisions** : Voir/restaurer les versions précédentes
7. **Settings admin** : Interface de paramètres (site name, logo, etc.)

### Fichiers pour la Phase 2
```
app/Http/Controllers/Admin/
├── DashboardController.php
├── PageController.php
├── PostController.php
├── MediaController.php
├── MenuController.php
├── TaxonomyController.php
├── SettingController.php
├── ThemeController.php
├── PluginController.php
├── UserController.php

app/Http/Requests/
├── StorePageRequest.php
├── UpdatePageRequest.php
├── StorePostRequest.php
├── UpdatePostRequest.php
├── UploadMediaRequest.php
├── StoreMenuRequest.php
├── UpdateSettingsRequest.php

resources/js/pages/Admin/
├── Dashboard.tsx
├── Pages/
│   ├── Index.tsx
│   ├── Create.tsx
│   └── Edit.tsx
├── Posts/
│   ├── Index.tsx
│   ├── Create.tsx
│   └── Edit.tsx
├── Media/
│   └── Index.tsx          # Galerie + upload
├── Menus/
│   ├── Index.tsx
│   └── Edit.tsx           # Builder de menu
├── Settings/
│   └── Index.tsx          # Onglets de settings
├── Users/
│   └── Index.tsx
├── Themes/
│   └── Index.tsx
└── Plugins/
    └── Index.tsx
```

---

## Phase 3 : Page Builder (Semaine 5-8)

### Tâches détaillées

1. **Package `@artisan/page-builder`** :
   - Store Zustand avec immer
   - DndContext avec sensors configurés
   - Canvas avec SortableContext imbriqués
   - DragOverlay
   - Sidebar : BlockLibrary + BlockSettings + StylePanel
   - Toolbar : devices, undo/redo, save
   - History (undo/redo) stack

2. **Package `@artisan/blocks`** :
   - Block Registry (enregistrer/découvrir les blocs)
   - Schémas Zod pour chaque bloc
   - Renderers React pour chaque bloc
   - Props par défaut
   - Icons pour la toolbox

3. **Intégration dans l'app Laravel** :
   - Route `/admin/builder/{page}` → Page Inertia Builder
   - API `PUT /api/builder/pages/{page}/content` → sauvegarde
   - API `POST /api/builder/media/upload` → upload inline
   - Auto-save debounced
   - Preview dans un iframe

4. **Responsive editing** :
   - 3 breakpoints visuels
   - Panel de styles adapté au breakpoint actif
   - Preview iframe redimensionnable

### Fichiers Phase 3
```
packages/page-builder/src/
├── (voir Blueprint 04 pour la structure complète)

packages/blocks/src/
├── index.ts
├── registry.ts
├── types.ts
├── schemas/
│   ├── section.ts
│   ├── grid.ts
│   ├── heading.ts
│   ├── text.ts
│   ├── image.ts
│   ├── button.ts
│   └── ...
├── renderers/
│   ├── SectionRenderer.tsx
│   ├── GridRenderer.tsx
│   ├── HeadingRenderer.tsx
│   ├── TextRenderer.tsx
│   ├── ImageRenderer.tsx
│   ├── ButtonRenderer.tsx
│   └── ...
└── defaults/
    └── index.ts           # Props par défaut de chaque bloc

resources/js/pages/
├── Builder/
│   └── Edit.tsx           # Page du builder Inertia
```

---

## Phase 4 : Thèmes & Plugins (Semaine 9-10)

### Tâches
1. ThemeManager + admin UI pour changer/personnaliser le thème
2. PluginManager + admin UI pour installer/activer les plugins
3. Thème par défaut complet (tous les layouts, partials, styles)
4. Plugin SEO (meta tags, sitemap, robots.txt)
5. Plugin formulaire de contact (comme preuve de concept)
6. Commandes Artisan : `cms:theme:create`, `cms:plugin:create`

---

## Phase 5 : E-commerce plugin (Semaine 11-13)

### Tâches
1. Plugin `ecommerce` avec tables : products, categories, orders, cart_items
2. Blocs : product-card, product-grid, cart-widget, checkout-form
3. Pages admin : produits, commandes, réglages boutique
4. Intégration Stripe pour le paiement

---

## Phase 6 : Adaptateur Next.js — REPORTÉE

> **Décision** : Next.js nécessite un VPS ou un PaaS (Vercel) pour fonctionner. Les clients cibles d'ArtisanCMS sont sur hébergement mutualisé (PHP + MySQL), où Next.js ne peut pas tourner. Cette phase est reportée à une version future, si la demande se présente pour des clients premium (VPS/Vercel).
>
> **Raison technique** : Next.js requiert un serveur Node.js en runtime permanent (SSR, API routes, middleware). L'export statique (`next export`) est trop limité (pas de SSR, pas d'ISR, pas de middleware). Les hébergeurs mutualisés (o2switch, OVH Web, LWS, Infomaniak) ne fournissent que PHP + MySQL.
>
> **Alternative possible (futur)** : Mode headless où Laravel reste le backend API, et un frontend Next.js séparé est déployé sur Vercel (free tier). Mais ce n'est pas prioritaire.

---

## Phase 7 : CLI & Marketplace (Semaine 14+)

### Tâches
1. Package npm `create-artisan-cms` (CLI d'installation)
2. Marketplace web pour thèmes et plugins
3. API d'upload/téléchargement de thèmes/plugins
4. Système de mises à jour (CMS + plugins + thèmes) — voir `blueprints/29-admin-features.md`
5. Registry API (`registry.artisancms.io`)

---

## Intégration des fonctionnalités blueprints 28-29 dans les phases

Les fonctionnalités identifiées dans les blueprints 28 (comparaison CMS majeurs) et 29 (admin avancé) sont intégrées dans les phases existantes :

### Phase 1 — Ajouts (fondations)
- Health check endpoint `/health` (bp29 #15)
- Error boundary global React (bp29 #18)
- Lazy loading routes admin (bp29 #13)
- Aide contextuelle : tooltips sur les champs (bp29 #17)
- Dark mode admin : CSS variables + toggle (bp28 #25)
- Robots.txt dynamique (bp28 #35b)
- Manifest.json PWA-ready (bp28 #35c)
- 2FA via pragmarx/google2fa-laravel (bp28 #27)
- Social login via Laravel Socialite (bp28 #26)
- Rôles custom + matrice de permissions UI (bp29 #4)

### Phase 2 — Ajouts (contenu)
- Dashboard admin complet avec widgets (bp29 #2)
- Onboarding post-install : checklist + tour guidé (bp29 #5)
- Commentaires : système threaded + anti-spam + modération (bp28 #1)
- SEO core : meta, OG, Twitter Cards, JSON-LD, score, snippet preview (bp28 #2)
- Sitemap XML automatique (bp28 #3)
- Redirections 301/302 + auto-redirect au changement de slug (bp28 #4)
- RSS Feeds : posts, catégories, tags (bp28 #5)
- Open Graph / Twitter Cards complets (bp28 #13)
- Breadcrumbs automatiques + JSON-LD BreadcrumbList (bp28 #21)
- Sticky / Featured posts (bp28 #30)
- Duplicate page/post en un clic (bp28 #29)
- Corbeille média (soft deletes) (bp28 #28)
- Gravatar / avatar utilisateur (bp28 #31)
- Gestion médias avancée : dossiers, remplacement, orphelins, Unsplash/Pexels, crop (bp29 #3)
- Export/Import contenu JSON/CSV/ZIP (bp28 #19)
- Pages d'erreur 404 custom avec recherche + suggestions (bp28 #20)
- Mode maintenance (bp28 #18)
- Notifications in-app : cloche + polling (bp28 #33)
- Favoris admin / bookmarks (bp28 #32)
- Log viewer admin (bp29 #14)

### Phase 3 — Ajouts (builder)
- Galeries avancées : 6 layouts + lightbox (bp28 #22)
- Shortcodes / Embeds : inline TipTap + oEmbed (bp28 #17)
- Éditeur CSS/JS custom dans le customizer (bp28 #16)
- Accessibilité WCAG 2.1 : checklist + audit dans le builder (bp28 #15)
- Popup/Modal builder (bp29 #6)
- Sticky elements dans le builder (bp29 #16)
- Bloc Table of Contents auto-généré (bp29 #8)

### Phase 4 — Ajouts (thèmes & plugins)
- Custom Post Types + Custom Fields avancés (25+ types) (bp28 #7, #8)
- Widgets / Zones dynamiques avec visibilité conditionnelle (bp28 #11)
- Import WordPress : WXR XML + conversion Gutenberg (bp28 #12)
- Mega menus : colonnes, images, HTML, widgets (bp29 #7)
- Newsletter : abonnés, campagnes, double opt-in (bp28 #14)
- Scheduler UI : visualisation tâches planifiées (bp29 #9)
- Queue/Jobs UI : monitoring, réessayer, purger (bp29 #10)
- Performance monitoring panel (bp29 #11)
- Migration de données entre versions (bp29 #12)

### Phase 5 — Ajouts (e-commerce + avancé)
- Membership / contenu restreint + intégration Stripe (bp28 #10)
- GraphQL API via Lighthouse (bp28 #9)
- Contenu multilingue : table translations préparée, UI activée (bp28 #6)
- A/B Testing basique (bp28 #24)
- Preview temporelle / content staging (bp28 #23)
- Preview avancée : lien partageable, preview visiteur (bp29 #19)

### Phase 7 — Ajouts (CLI & Marketplace)
- Système de mises à jour CMS + plugins + thèmes (bp29 #1)

---

## Intégration des fonctionnalités blueprint 31 dans les phases

Les 22 fonctionnalités identifiées dans le blueprint 31 (audit final vs top 10 CMS) sont intégrées dans les phases existantes :

### Phase 1 — Ajouts (bp31)
- Error Recovery Mode / Safe Mode pour plugins et thèmes défaillants (bp31 #4)
- User Session Management : table sessions, force logout, device tracking (bp31 #12)

### Phase 2 — Ajouts (bp31)
- Search Autocomplete / Suggestions frontend avec résultats groupés (bp31 #3)
- Command Palette (Ctrl+K) : recherche rapide dans tout l'admin (bp31 #6)
- Editorial Calendar : vue calendrier mensuelle/hebdo du contenu (bp31 #8)
- Pre-Publish Checklist : vérifications auto avant publication (bp31 #10)
- Media Usage Tracking : table usages, empêcher suppression si en usage (bp31 #14)
- Announcement Bar / Bannière site-wide : table, planification, dismiss (bp31 #21)

### Phase 3 — Ajouts (bp31)
- Dynamic Content / Data Binding dans le page builder (bp31 #2)
- Block Patterns / Saved Sections (synced/unsynced) (bp31 #5)
- Block Transforms : convertir un type de bloc en un autre (bp31 #7)
- Motion Effects / Animations : entrée, hover, scroll, prefers-reduced-motion (bp31 #9)
- Paste from Word/Google Docs : conversion HTML → blocs CMS (bp31 #11)
- oEmbed Auto-Discovery : résolution auto des URLs, bloc embed enrichi (bp31 #16)
- Gallery Drag-and-Drop Reorder : dnd-kit dans les settings galerie (bp31 #17)
- Shape Dividers / Séparateurs SVG entre sections (bp31 #18)
- Copy/Paste Styles entre blocs (Ctrl+Alt+C/V) (bp31 #19)
- Fullscreen / Distraction-Free Editing + Spotlight Mode (bp31 #22)

### Phase 4 — Ajouts (bp31)
- Global Styles / Design Tokens / Style Book (bp31 #1)
- Scheduled Tasks API pour Plugins : enregistrer cron jobs via Service Provider (bp31 #13)
- Config Export/Import entre environnements : sync settings, rôles, menus, thème (bp31 #15)

### Phase 7 — Ajouts (bp31)
- Import contenu multi-CMS : Ghost, Joomla, Medium, Substack, Blogger, Markdown (bp31 #20)
