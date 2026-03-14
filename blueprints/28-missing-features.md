# Blueprint 28 - Fonctionnalités manquantes (Comparaison CMS majeurs)

Ce document recense les 35 fonctionnalités identifiées comme manquantes par rapport aux 10 CMS les plus populaires (WordPress, Joomla, Drupal, PrestaShop, Magento, Shopify, Wix, Squarespace, Ghost, Strapi). Chaque fonctionnalité est documentée avec son architecture technique pour ArtisanCMS.

---

## Priorités

| Priorité | Fonctionnalités |
|----------|----------------|
| **CRITIQUE** | 1-6 (commentaires, SEO core, sitemap, redirections, RSS, multilingue contenu) |
| **HAUTE** | 7-13 (CPT, custom fields, GraphQL, membership, widgets, import WP, OG/Twitter) |
| **MOYENNE** | 14-23 (newsletter, a11y, shortcodes, maintenance, export, 404, breadcrumbs auto, galeries, CSS editor) |
| **BASSE** | 24-35 (preview temporelle, A/B, dark mode, social login, 2FA, corbeille media, duplicate, sticky, threaded comments, gravatar, favoris admin, notifications in-app) |

---

## 1. Système de commentaires

**Référence** : WordPress (natif), Drupal (natif), Ghost (natif depuis 5.8)

### Table : comments

```php
Schema::create('comments', function (Blueprint $table) {
    $table->id();
    $table->morphs('commentable');                 // commentable_id + commentable_type (Post, Page)
    $table->foreignId('parent_id')->nullable()->constrained('comments')->cascadeOnDelete();
    $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
    $table->string('author_name')->nullable();     // Pour les visiteurs non connectés
    $table->string('author_email')->nullable();
    $table->string('author_url')->nullable();
    $table->text('content');
    $table->enum('status', ['pending', 'approved', 'spam', 'trash'])->default('pending');
    $table->string('ip_address', 45)->nullable();
    $table->string('user_agent')->nullable();
    $table->timestamps();
    $table->softDeletes();

    $table->index(['commentable_type', 'commentable_id', 'status']);
    $table->index(['status', 'created_at']);
    $table->index('parent_id');
    $table->index('user_id');
});
```

### CommentService

```php
class CommentService
{
    // Créer un commentaire (visiteur ou user connecté)
    public function create(array $data, ?User $user = null): Comment;

    // Approuver / rejeter / marquer spam
    public function moderate(Comment $comment, string $status): Comment;

    // Modération en masse
    public function bulkModerate(array $ids, string $status): int;

    // Récupérer commentaires arborescents (threaded)
    public function getThreaded(Model $commentable, int $perPage = 20): LengthAwarePaginator;

    // Compter les commentaires approuvés
    public function countApproved(Model $commentable): int;

    // Anti-spam : honeypot + time check + blacklist
    public function checkSpam(array $data): bool;

    // Notifications email lors d'un nouveau commentaire
    public function notifyModerators(Comment $comment): void;
    public function notifyParentAuthor(Comment $comment): void;
}
```

### Settings commentaires (groupe `comments`)

```php
'comments.enabled'              => true,           // Activer/désactiver globalement
'comments.require_approval'     => true,           // Modération avant affichage
'comments.allow_guests'         => true,            // Autoriser les visiteurs non connectés
'comments.require_email'        => true,            // Email obligatoire pour les visiteurs
'comments.nested_depth'         => 3,               // Profondeur max (threaded)
'comments.order'                => 'newest',        // newest | oldest
'comments.per_page'             => 20,
'comments.notify_admin'         => true,            // Email à l'admin
'comments.notify_parent_author' => true,            // Email à l'auteur du commentaire parent
'comments.close_after_days'     => 0,               // 0 = jamais fermer, N = fermer après N jours
'comments.blacklist_words'      => '',              // Mots interdits (1 par ligne)
'comments.blacklist_ips'        => '',              // IPs bannies
```

### Anti-spam intégré

```php
class CommentSpamChecker
{
    // 1. Honeypot : champ caché "website_url" qui doit rester vide
    // 2. Time check : le formulaire doit être soumis > 3 secondes après affichage
    // 3. Blacklist : mots interdits dans le contenu
    // 4. Blacklist IP : IPs bannies
    // 5. Rate limiting : max 5 commentaires / minute / IP
    // 6. Lien externe max : max 3 liens dans un commentaire (sinon spam)
    public function isSpam(array $data, string $ip): bool;
}
```

### API Endpoints

```
GET    /api/comments/{type}/{id}           → Liste paginée (threaded)
POST   /api/comments/{type}/{id}           → Créer un commentaire
PUT    /api/admin/comments/{id}/moderate    → Modérer (approve/spam/trash)
POST   /api/admin/comments/bulk            → Modération en masse
DELETE /api/admin/comments/{id}            → Supprimer définitivement
```

### Composant React

```tsx
// components/Comments/CommentList.tsx — Liste des commentaires threaded
// components/Comments/CommentForm.tsx — Formulaire de commentaire
// components/Comments/CommentItem.tsx — Commentaire individuel + réponses imbriquées
// components/Comments/CommentModeration.tsx — Interface admin de modération
```

### Relations Eloquent

```php
// Post model
public function comments(): MorphMany
{
    return $this->morphMany(Comment::class, 'commentable');
}

// Comment model
public function replies(): HasMany
{
    return $this->hasMany(Comment::class, 'parent_id');
}

public function parent(): BelongsTo
{
    return $this->belongsTo(Comment::class, 'parent_id');
}
```

---

## 2. SEO Core (intégré, pas plugin)

**Référence** : Ghost (natif), Wix (natif), Squarespace (natif), Joomla (natif)

> Les champs `meta_title`, `meta_description`, `og_image` existent déjà sur les pages. Ce qui manque : le rendu automatique des balises, les settings SEO globales, la validation, les aperçus.

### Settings SEO (groupe `seo`)

```php
'seo.site_title'                 => '',             // Titre du site (fallback)
'seo.site_description'           => '',             // Description du site
'seo.title_separator'            => ' | ',          // Séparateur titre page | site
'seo.title_format'               => ':page :sep :site',  // Format du title
'seo.default_og_image'           => '',             // Image OG par défaut
'seo.robots_txt'                 => '',             // Contenu robots.txt custom
'seo.google_verification'        => '',             // Google Search Console
'seo.bing_verification'          => '',             // Bing Webmaster
'seo.noindex_archives'           => false,          // noindex sur les archives
'seo.noindex_taxonomies'         => false,          // noindex sur les taxonomies
'seo.schema_org_type'            => 'WebSite',      // Type schema.org par défaut
'seo.schema_org_organization'    => '{}',           // JSON-LD Organization
```

### SeoService

```php
class SeoService
{
    // Générer les meta tags pour une page/post
    public function generateMeta(Model $entity): array;

    // Générer les tags Open Graph
    public function generateOpenGraph(Model $entity): array;

    // Générer les Twitter Cards
    public function generateTwitterCard(Model $entity): array;

    // Générer le JSON-LD (schema.org)
    public function generateJsonLd(Model $entity): array;

    // Générer le titre formaté
    public function formatTitle(string $pageTitle): string;

    // Score SEO basique (longueur title, description, etc.)
    public function analyzeSeo(Model $entity): array;

    // Générer robots.txt
    public function generateRobotsTxt(): string;
}
```

### Rendu automatique dans le layout

```php
// Composant React SeoHead (injecté dans tous les layouts)
<SeoHead
    title={page.meta_title || page.title}
    description={page.meta_description}
    ogImage={page.og_image}
    ogType="article"
    canonical={url}
    jsonLd={jsonLd}
/>
```

```tsx
// components/SeoHead.tsx
function SeoHead({ title, description, ogImage, ogType, canonical, jsonLd, noindex }: SeoHeadProps) {
    return (
        <Head>
            <title>{formatTitle(title)}</title>
            <meta name="description" content={description} />
            {noindex && <meta name="robots" content="noindex, nofollow" />}
            <link rel="canonical" href={canonical} />

            {/* Open Graph */}
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={ogImage || defaultOgImage} />
            <meta property="og:type" content={ogType} />
            <meta property="og:url" content={canonical} />
            <meta property="og:site_name" content={siteName} />

            {/* Twitter Card */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={ogImage || defaultOgImage} />

            {/* JSON-LD */}
            <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
        </Head>
    );
}
```

### SEO Panel dans l'éditeur de page/post

```tsx
// Panneau latéral dans l'éditeur avec :
// - Aperçu Google (snippet preview)
// - Aperçu Facebook (OG preview)
// - Aperçu Twitter (Card preview)
// - Champs : meta_title, meta_description, meta_keywords, og_image
// - Score SEO temps réel (titre trop court, description manquante, etc.)
// - Toggle noindex/nofollow par page
```

### Score SEO

```php
// Checks automatiques :
// - Title : 30-60 caractères ✓/✗
// - Description : 120-160 caractères ✓/✗
// - OG Image présente ✓/✗
// - Heading H1 unique ✓/✗
// - Alt text sur les images ✓/✗
// - Slug lisible (pas de chiffres aléatoires) ✓/✗
// - Contenu minimum (>300 mots) ✓/✗
```

---

## 3. Sitemap XML automatique

**Référence** : WordPress (natif depuis 5.5), Ghost (natif), Shopify (natif)

### Route

```php
// Route publique (pas de middleware auth)
Route::get('/sitemap.xml', [SitemapController::class, 'index']);
Route::get('/sitemap-pages.xml', [SitemapController::class, 'pages']);
Route::get('/sitemap-posts.xml', [SitemapController::class, 'posts']);
Route::get('/sitemap-taxonomies.xml', [SitemapController::class, 'taxonomies']);
```

### SitemapService

```php
class SitemapService
{
    // Générer le sitemap index
    public function generateIndex(): string;

    // Générer le sitemap des pages
    public function generatePages(): string;

    // Générer le sitemap des posts
    public function generatePosts(): string;

    // Générer le sitemap des taxonomies
    public function generateTaxonomies(): string;

    // Cache : 1 heure, invalidé par PageObserver/PostObserver
    // Format : XML standard sitemap protocol
}
```

### Format XML

```xml
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <sitemap>
        <loc>https://example.com/sitemap-pages.xml</loc>
        <lastmod>2026-03-14T10:00:00+00:00</lastmod>
    </sitemap>
    <sitemap>
        <loc>https://example.com/sitemap-posts.xml</loc>
        <lastmod>2026-03-14T10:00:00+00:00</lastmod>
    </sitemap>
</sitemapindex>
```

### Champs additionnels (ajout sur pages et posts)

```php
// Ajouter à la migration pages et posts
$table->boolean('exclude_from_sitemap')->default(false);
$table->enum('sitemap_priority', ['0.1','0.2','0.3','0.4','0.5','0.6','0.7','0.8','0.9','1.0'])->default('0.5');
$table->enum('sitemap_changefreq', ['always','hourly','daily','weekly','monthly','yearly','never'])->default('weekly');
```

---

## 4. Redirections 301/302

**Référence** : WordPress (Yoast/Redirection), Joomla (natif), Drupal (Redirect module)

### Table : redirects

```php
Schema::create('redirects', function (Blueprint $table) {
    $table->id();
    $table->string('source_url');                   // /ancien-slug
    $table->string('target_url');                   // /nouveau-slug ou URL externe
    $table->enum('status_code', [301, 302, 307, 410])->default(301);
    $table->boolean('is_regex')->default(false);    // Source est un regex
    $table->boolean('enabled')->default(true);
    $table->unsignedInteger('hit_count')->default(0); // Nombre de fois utilisée
    $table->timestamp('last_hit_at')->nullable();
    $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
    $table->timestamps();

    $table->index('source_url');
    $table->index('enabled');
});
```

### RedirectService

```php
class RedirectService
{
    // Vérifier si une URL a une redirection
    public function match(string $url): ?Redirect;

    // Créer une redirection (auto quand un slug change)
    public function create(string $from, string $to, int $code = 301): Redirect;

    // Auto-redirect : quand un slug de page/post change
    public function handleSlugChange(Model $model, string $oldSlug): void;

    // Importer des redirections (CSV)
    public function import(UploadedFile $file): int;

    // Exporter les redirections
    public function export(): StreamedResponse;

    // Nettoyer les redirections cassées (target 404)
    public function cleanBroken(): int;

    // Log 404 (pour suggestions de redirections)
    public function log404(string $url, string $ip): void;
}
```

### Middleware RedirectHandler

```php
class RedirectHandler
{
    public function handle(Request $request, Closure $next): Response
    {
        $redirect = app(RedirectService::class)->match($request->path());

        if ($redirect) {
            $redirect->increment('hit_count');
            $redirect->update(['last_hit_at' => now()]);

            if ($redirect->status_code === 410) {
                abort(410);
            }

            return redirect($redirect->target_url, $redirect->status_code);
        }

        return $next($request);
    }
}
```

### Auto-redirect au changement de slug

```php
// Dans PageObserver et PostObserver
public function updating(Page $page): void
{
    if ($page->isDirty('slug') && $page->status === 'published') {
        app(RedirectService::class)->handleSlugChange(
            $page,
            $page->getOriginal('slug')
        );
    }
}
```

### Table : redirect_404_log (optionnelle)

```php
Schema::create('redirect_404_log', function (Blueprint $table) {
    $table->id();
    $table->string('url');
    $table->string('referrer')->nullable();
    $table->string('ip_address', 45)->nullable();
    $table->unsignedInteger('hit_count')->default(1);
    $table->timestamp('last_hit_at');
    $table->timestamps();

    $table->unique('url');
    $table->index('hit_count');
});
```

---

## 5. RSS Feeds

**Référence** : WordPress (natif), Drupal (natif via Views), Ghost (natif)

### Routes

```php
Route::get('/feed', [RssFeedController::class, 'posts']);            // Feed principal (posts)
Route::get('/feed/posts', [RssFeedController::class, 'posts']);
Route::get('/feed/pages', [RssFeedController::class, 'pages']);
Route::get('/feed/category/{slug}', [RssFeedController::class, 'category']);
Route::get('/feed/tag/{slug}', [RssFeedController::class, 'tag']);
Route::get('/feed/comments', [RssFeedController::class, 'comments']);
```

### RssFeedService

```php
class RssFeedService
{
    // Générer le feed RSS 2.0 pour les posts
    public function posts(int $limit = 20): string;

    // Feed par catégorie
    public function byCategory(string $slug, int $limit = 20): string;

    // Feed par tag
    public function byTag(string $slug, int $limit = 20): string;

    // Feed des commentaires récents
    public function comments(int $limit = 20): string;

    // Feed des pages
    public function pages(int $limit = 20): string;

    // Cache : 30 min, invalidé par PostObserver
}
```

### Format RSS 2.0

```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
    <channel>
        <title>Mon Site</title>
        <link>https://example.com</link>
        <description>Description du site</description>
        <language>fr</language>
        <lastBuildDate>Sat, 14 Mar 2026 10:00:00 +0000</lastBuildDate>
        <atom:link href="https://example.com/feed" rel="self" type="application/rss+xml"/>
        <item>
            <title>Titre de l'article</title>
            <link>https://example.com/blog/mon-article</link>
            <description><![CDATA[Excerpt ou contenu tronqué]]></description>
            <dc:creator>Auteur</dc:creator>
            <pubDate>Fri, 13 Mar 2026 15:00:00 +0000</pubDate>
            <guid isPermaLink="true">https://example.com/blog/mon-article</guid>
            <category>Catégorie</category>
        </item>
    </channel>
</rss>
```

### Auto-discovery dans le `<head>`

```html
<link rel="alternate" type="application/rss+xml" title="Mon Site - Feed" href="/feed" />
```

### Settings RSS (groupe `rss`)

```php
'rss.enabled'          => true,
'rss.items_count'      => 20,
'rss.content_type'     => 'excerpt',   // excerpt | full
'rss.include_pages'    => false,
'rss.include_comments' => false,
```

---

## 6. Contenu multilingue (avancement V1)

**Référence** : Drupal (natif, le meilleur), Joomla (natif), Strapi (natif)

> Prévu en V2, mais on prépare la DB et l'architecture en V1 pour ne pas tout casser plus tard.

### Table : translations (préparation V1)

```php
Schema::create('translations', function (Blueprint $table) {
    $table->id();
    $table->morphs('translatable');               // translatable_id + translatable_type
    $table->string('locale', 10);                 // fr, en, es, de, etc.
    $table->string('field');                       // title, content, excerpt, meta_title, etc.
    $table->longText('value')->nullable();
    $table->timestamps();

    $table->unique(['translatable_type', 'translatable_id', 'locale', 'field']);
    $table->index('locale');
});
```

### Trait HasTranslations (préparation V1)

```php
trait HasTranslations
{
    // Récupérer la traduction d'un champ
    public function getTranslation(string $field, string $locale): ?string;

    // Définir la traduction d'un champ
    public function setTranslation(string $field, string $locale, ?string $value): void;

    // Récupérer toutes les traductions d'une locale
    public function getTranslationsForLocale(string $locale): array;

    // Vérifier si une traduction existe
    public function hasTranslation(string $field, string $locale): bool;

    // Champs traduisibles (défini par le model)
    abstract public function getTranslatableFields(): array;
}
```

### Models concernés

```php
class Page extends Model
{
    use HasTranslations;

    public function getTranslatableFields(): array
    {
        return ['title', 'content', 'excerpt', 'meta_title', 'meta_description'];
    }
}
```

### Settings i18n (ajout au groupe `i18n`)

```php
'i18n.content_translation'  => false,      // false en V1, true en V2
'i18n.available_locales'    => ['fr'],      // Locales activées
'i18n.default_locale'       => 'fr',
'i18n.fallback_locale'      => 'fr',
'i18n.show_language_switcher' => false,     // Front-end switcher
```

> **V1** : la table et le trait existent mais `content_translation` est `false`. L'UI de traduction n'est pas exposée. Cela permet de migrer vers V2 sans refaire la DB.

---

## 7. Custom Post Types (Content Types)

**Référence** : WordPress (register_post_type), Drupal (Content Types natif), Strapi (Content Type Builder)

### Table : content_types

```php
Schema::create('content_types', function (Blueprint $table) {
    $table->id();
    $table->string('name');                        // "Projet", "Témoignage", "Membre équipe"
    $table->string('slug')->unique();              // "project", "testimonial", "team-member"
    $table->string('singular_name');               // "Projet"
    $table->string('plural_name');                 // "Projets"
    $table->string('icon')->default('file-text');  // Icône Lucide pour le menu admin
    $table->json('fields');                        // Définition des champs custom (voir Custom Fields)
    $table->json('supports')->nullable();          // ["title", "editor", "excerpt", "thumbnail", "comments", "revisions"]
    $table->boolean('has_archive')->default(true); // Page d'archive publique
    $table->boolean('public')->default(true);      // Visible côté front
    $table->boolean('show_in_menu')->default(true);// Affiché dans le menu admin
    $table->boolean('hierarchical')->default(false);// Support parent/enfant
    $table->string('menu_position')->default('after_posts'); // Position dans le menu admin
    $table->json('taxonomies')->nullable();         // ["category", "tag", "custom-taxonomy"]
    $table->string('rewrite_slug')->nullable();     // Slug dans l'URL (/projets/mon-projet)
    $table->boolean('is_system')->default(false);   // true = pages, posts (non supprimable)
    $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
    $table->timestamps();
});
```

### Table : content_entries

```php
Schema::create('content_entries', function (Blueprint $table) {
    $table->id();
    $table->foreignId('content_type_id')->constrained()->cascadeOnDelete();
    $table->string('title');
    $table->string('slug');
    $table->json('content')->nullable();           // Arbre JSON blocs (page builder)
    $table->text('excerpt')->nullable();
    $table->json('fields_data')->nullable();       // Données des custom fields
    $table->enum('status', ['draft', 'published', 'scheduled', 'trash'])->default('draft');
    $table->string('featured_image')->nullable();
    $table->foreignId('parent_id')->nullable()->constrained('content_entries')->nullOnDelete();
    $table->integer('order')->default(0);
    $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
    $table->timestamp('published_at')->nullable();
    $table->boolean('allow_comments')->default(false);
    $table->timestamps();
    $table->softDeletes();

    $table->unique(['content_type_id', 'slug']);
    $table->index(['content_type_id', 'status', 'published_at']);
});
```

### ContentTypeService

```php
class ContentTypeService
{
    // CRUD content types
    public function create(array $data): ContentType;
    public function update(ContentType $type, array $data): ContentType;
    public function delete(ContentType $type): void;

    // Lister les types (pour le menu admin)
    public function getAll(): Collection;
    public function getPublic(): Collection;

    // Générer les routes dynamiques pour un content type
    public function registerRoutes(ContentType $type): void;

    // Générer le formulaire admin dynamique
    public function getFormSchema(ContentType $type): array;
}
```

### Routes dynamiques

```php
// Générées automatiquement pour chaque content type public
// Ex: pour "project" avec rewrite_slug = "projets"
Route::get('/projets', [ContentEntryController::class, 'archive'])->name('content.project.archive');
Route::get('/projets/{slug}', [ContentEntryController::class, 'show'])->name('content.project.show');

// Admin
Route::prefix('admin')->group(function () {
    Route::resource('content/{type}', ContentEntryController::class)->names('admin.content');
});
```

### Blocs Page Builder pour CPT

```tsx
// Bloc "content-list" paramétrable
{
    type: "content-list",
    props: {
        content_type: "testimonial",
        count: 6,
        layout: "grid",           // grid | list | carousel
        columns: 3,
        show_image: true,
        show_excerpt: true,
        category: null,           // Filtrer par taxonomie
        order_by: "published_at", // published_at | title | order
        order: "desc"
    }
}
```

---

## 8. Custom Fields avancés

**Référence** : WordPress (ACF/Pods), Drupal (Fields natif), Strapi (Content Type Builder)

### Définition dans content_types.fields (JSON)

```json
{
    "fields": [
        {
            "name": "price",
            "label": "Prix",
            "type": "number",
            "required": true,
            "validation": { "min": 0, "max": 999999 },
            "placeholder": "0.00",
            "suffix": "EUR",
            "admin_width": "half"
        },
        {
            "name": "client_name",
            "label": "Nom du client",
            "type": "text",
            "required": true,
            "max_length": 100
        },
        {
            "name": "project_url",
            "label": "URL du projet",
            "type": "url",
            "required": false
        },
        {
            "name": "gallery",
            "label": "Galerie",
            "type": "gallery",
            "max_items": 20
        },
        {
            "name": "technologies",
            "label": "Technologies utilisées",
            "type": "repeater",
            "fields": [
                { "name": "name", "type": "text", "label": "Nom" },
                { "name": "icon", "type": "image", "label": "Icône" }
            ]
        }
    ]
}
```

### Types de champs supportés

| Type | Description | Options |
|------|-------------|---------|
| `text` | Champ texte | max_length, placeholder |
| `textarea` | Texte long | rows, max_length |
| `richtext` | Éditeur TipTap | toolbar (basic/full) |
| `number` | Nombre | min, max, step, prefix, suffix |
| `email` | Email | - |
| `url` | URL | - |
| `phone` | Téléphone | format |
| `date` | Date | min_date, max_date |
| `datetime` | Date et heure | min_date, max_date |
| `time` | Heure | - |
| `select` | Liste déroulante | options[], multiple |
| `radio` | Boutons radio | options[] |
| `checkbox` | Cases à cocher | options[] |
| `toggle` | Switch on/off | default |
| `color` | Sélecteur couleur | - |
| `image` | Image (sélecteur média) | - |
| `file` | Fichier (sélecteur média) | allowed_types |
| `gallery` | Galerie d'images | max_items |
| `video` | URL vidéo (YouTube/Vimeo/mp4) | - |
| `relation` | Relation vers autre content type | target_type, multiple |
| `repeater` | Sous-champs répétables | fields[], max_items |
| `group` | Groupe de champs (pas répétable) | fields[] |
| `wysiwyg` | HTML WYSIWYG | - |
| `code` | Éditeur de code | language |
| `map` | Coordonnées GPS | - |
| `oEmbed` | Embed URL (auto-detect) | - |

### Rendu dans le formulaire admin

```tsx
// components/CustomFields/FieldRenderer.tsx
// Switch sur field.type → rendu du composant approprié
// Utilise shadcn/ui pour tous les inputs
// Validation côté client (Zod) + côté serveur (Form Request)
```

### Accès aux données

```php
// Dans les templates/blocs
$entry->getField('price');                    // Accès simple
$entry->getField('technologies');             // Retourne array (repeater)
$entry->getField('gallery');                  // Retourne array de media IDs
```

---

## 9. GraphQL API

**Référence** : Shopify (natif), Strapi (natif), WordPress (WPGraphQL)

### Package

```bash
composer require rebing/graphql-laravel
# ou
composer require nuwave/lighthouse
```

### Architecture (Lighthouse recommandé)

```graphql
# graphql/schema.graphql

type Query {
    page(slug: String!): Page
    pages(status: PageStatus, first: Int, page: Int): PagePaginator! @paginate
    post(slug: String!): Post
    posts(status: PostStatus, first: Int, page: Int, category: String): PostPaginator! @paginate
    menu(location: String!): Menu
    media(id: ID!): Media
    settings(group: String): [Setting!]!
    contentEntries(type: String!, first: Int, page: Int): ContentEntryPaginator! @paginate
    search(query: String!, type: String): [SearchResult!]!
}

type Mutation {
    # Builder API
    updatePageContent(id: ID!, content: JSON!): Page! @guard
    createPage(input: CreatePageInput!): Page! @guard
    updatePage(id: ID!, input: UpdatePageInput!): Page! @guard
    deletePage(id: ID!): Boolean! @guard

    # Media
    uploadMedia(file: Upload!): Media! @guard

    # Comments
    createComment(input: CreateCommentInput!): Comment!
}

type Page {
    id: ID!
    title: String!
    slug: String!
    content: JSON
    status: PageStatus!
    template: String!
    metaTitle: String
    metaDescription: String
    ogImage: String
    parent: Page
    children: [Page!]!
    author: User!
    publishedAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
}

type Post {
    id: ID!
    title: String!
    slug: String!
    content: JSON
    excerpt: String
    status: PostStatus!
    featuredImage: String
    author: User!
    comments(first: Int, page: Int): CommentPaginator! @paginate
    terms: [TaxonomyTerm!]!
    publishedAt: DateTime
    createdAt: DateTime!
}

type Menu {
    id: ID!
    name: String!
    location: String
    items: [MenuItem!]!
}

type MenuItem {
    id: ID!
    label: String!
    url: String
    target: String!
    children: [MenuItem!]!
}

enum PageStatus {
    DRAFT
    PUBLISHED
    SCHEDULED
    TRASH
}
```

### Settings GraphQL

```php
'graphql.enabled'        => true,
'graphql.endpoint'       => '/graphql',
'graphql.playground'     => true,       // GraphQL Playground en dev
'graphql.max_depth'      => 10,         // Profondeur max des queries
'graphql.rate_limit'     => 120,        // Requêtes/minute
```

---

## 10. Membership / Contenu restreint

**Référence** : Ghost (natif, son coeur), Squarespace (natif), Wix (natif)

### Table : membership_plans

```php
Schema::create('membership_plans', function (Blueprint $table) {
    $table->id();
    $table->string('name');                        // "Gratuit", "Premium", "VIP"
    $table->string('slug')->unique();
    $table->text('description')->nullable();
    $table->decimal('price', 10, 2)->default(0);   // 0 = gratuit
    $table->enum('billing_period', ['monthly', 'yearly', 'lifetime', 'free'])->default('free');
    $table->json('features')->nullable();           // ["Accès articles premium", "Newsletter exclusive"]
    $table->json('access_rules')->nullable();       // Quels content types / taxonomies sont accessibles
    $table->boolean('is_default')->default(false);  // Plan par défaut (inscription)
    $table->boolean('enabled')->default(true);
    $table->integer('order')->default(0);
    $table->timestamps();
});
```

### Table : user_memberships

```php
Schema::create('user_memberships', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->foreignId('plan_id')->constrained('membership_plans')->cascadeOnDelete();
    $table->enum('status', ['active', 'cancelled', 'expired', 'past_due'])->default('active');
    $table->timestamp('starts_at');
    $table->timestamp('expires_at')->nullable();     // null = lifetime
    $table->string('stripe_subscription_id')->nullable();
    $table->timestamps();

    $table->index(['user_id', 'status']);
});
```

### Champs additionnels sur pages/posts

```php
// Ajout à la migration pages et posts
$table->enum('visibility', ['public', 'members', 'paid', 'password'])->default('public');
$table->string('password_hash')->nullable();        // Pour visibility = password
$table->json('required_plans')->nullable();          // Plan IDs requis (pour visibility = paid)
```

### MembershipService

```php
class MembershipService
{
    // Vérifier si un user peut accéder à un contenu
    public function canAccess(User $user, Model $content): bool;

    // Souscrire à un plan
    public function subscribe(User $user, MembershipPlan $plan): UserMembership;

    // Annuler un abonnement
    public function cancel(UserMembership $membership): void;

    // Vérifier si l'abonnement est actif
    public function isActive(User $user, ?int $planId = null): bool;

    // Middleware pour protéger les routes
    // Usage : Route::middleware('membership:premium')
}
```

### Middleware MembershipAccess

```php
class MembershipAccess
{
    public function handle(Request $request, Closure $next, ?string $plan = null): Response
    {
        $content = $request->route()->parameter('page') ?? $request->route()->parameter('post');

        if ($content && $content->visibility !== 'public') {
            if (!auth()->check()) {
                return redirect()->route('login');
            }

            if (!app(MembershipService::class)->canAccess(auth()->user(), $content)) {
                return Inertia::render('Front/MembershipRequired', [
                    'plans' => MembershipPlan::enabled()->orderBy('price')->get(),
                ]);
            }
        }

        return $next($request);
    }
}
```

### Intégration Stripe (optionnel)

```php
// Via Laravel Cashier ou intégration directe
// Webhooks Stripe → mettre à jour user_memberships
// Checkout Session → page de paiement
// Customer Portal → gestion abonnement
```

---

## 11. Système de widgets / zones dynamiques

**Référence** : WordPress (natif), Joomla (modules/positions)

### Table : widget_areas

```php
Schema::create('widget_areas', function (Blueprint $table) {
    $table->id();
    $table->string('name');                        // "Sidebar droite", "Footer colonne 1"
    $table->string('slug')->unique();              // "sidebar-right", "footer-col-1"
    $table->string('location');                    // sidebar, footer, header, custom
    $table->text('description')->nullable();
    $table->boolean('is_system')->default(false);  // Défini par le thème
    $table->timestamps();
});
```

### Table : widgets

```php
Schema::create('widgets', function (Blueprint $table) {
    $table->id();
    $table->foreignId('widget_area_id')->constrained()->cascadeOnDelete();
    $table->string('type');                        // recent-posts, categories, search, html, menu, etc.
    $table->string('title')->nullable();
    $table->json('settings')->nullable();          // Configuration du widget
    $table->json('visibility_rules')->nullable();  // Conditions d'affichage
    $table->integer('order')->default(0);
    $table->boolean('enabled')->default(true);
    $table->timestamps();

    $table->index(['widget_area_id', 'order']);
});
```

### Types de widgets core

| Type | Description | Settings |
|------|-------------|----------|
| `recent-posts` | Derniers articles | count, category, show_date, show_image |
| `categories` | Liste des catégories | taxonomy, show_count, hierarchical |
| `tags` | Nuage de tags | taxonomy, max_tags |
| `search` | Barre de recherche | placeholder |
| `html` | Contenu HTML libre | content |
| `menu` | Menu navigation | menu_id |
| `text` | Texte simple | content |
| `image` | Image avec lien | media_id, url, alt |
| `social-links` | Liens réseaux sociaux | links[] |
| `newsletter` | Formulaire inscription | - |

### Visibilité conditionnelle

```json
{
    "visibility_rules": {
        "show_on": "specific",
        "pages": [1, 5, 10],
        "post_types": ["post"],
        "taxonomies": { "category": ["news"] },
        "user_logged_in": null,
        "devices": ["desktop", "tablet"]
    }
}
```

### Rendu dans les thèmes

```tsx
// Dans le layout du thème
<WidgetArea slug="sidebar-right" />
<WidgetArea slug="footer-col-1" />

// Le composant WidgetArea charge les widgets de la zone
// et les rend dans l'ordre
```

---

## 12. Import depuis WordPress

**Référence** : Drupal (Migrate API), Ghost (import natif), Joomla (extensions)

### ImportService (WordPress)

```php
class WordPressImportService
{
    // Importer depuis un export WXR (WordPress XML)
    public function import(UploadedFile $wxrFile, array $options = []): ImportResult;

    // Options
    // - import_posts: bool
    // - import_pages: bool
    // - import_media: bool (télécharger les images)
    // - import_menus: bool
    // - import_categories: bool
    // - import_tags: bool
    // - import_comments: bool
    // - import_users: bool (crée des auteurs)
    // - default_author_id: int (si import_users = false)
    // - status_mapping: array (published → published, draft → draft)

    // Parser le WXR
    private function parseWxr(string $xmlContent): array;

    // Convertir le contenu Gutenberg/Classic en blocs ArtisanCMS
    private function convertContent(string $wpContent): array;

    // Télécharger et importer les médias
    private function importMedia(array $attachments): array;

    // Mapper les URLs internes (ancien → nouveau slug)
    private function remapUrls(string $content, array $urlMap): string;
}
```

### ImportResult

```php
class ImportResult
{
    public int $pagesImported = 0;
    public int $postsImported = 0;
    public int $mediaImported = 0;
    public int $commentsImported = 0;
    public int $menusImported = 0;
    public int $categoriesImported = 0;
    public int $tagsImported = 0;
    public int $usersImported = 0;
    public array $errors = [];
    public array $warnings = [];
    public array $urlMap = [];          // ancien_url → nouveau_url
}
```

### Conversion de contenu WordPress → blocs ArtisanCMS

```php
class WpContentConverter
{
    // Convertit le HTML WordPress classique en arbre de blocs
    public function fromClassicEditor(string $html): array;

    // Convertit les blocs Gutenberg en blocs ArtisanCMS
    public function fromGutenberg(string $gutenbergHtml): array;

    // Mapping des blocs Gutenberg → ArtisanCMS
    private array $blockMapping = [
        'core/paragraph'   => 'text',
        'core/heading'     => 'heading',
        'core/image'       => 'image',
        'core/gallery'     => 'gallery',
        'core/list'        => 'text',        // Convertit en HTML
        'core/quote'       => 'text',        // Avec style blockquote
        'core/code'        => 'html',
        'core/columns'     => 'grid',
        'core/column'      => 'column',
        'core/group'       => 'section',
        'core/separator'   => 'divider',
        'core/spacer'      => 'spacer',
        'core/buttons'     => 'button',
        'core/video'       => 'video',
        'core/embed'       => 'video',       // YouTube/Vimeo
    ];
}
```

### Admin UI : page d'import

```
/admin/tools/import
├── Source : WordPress (WXR XML)
├── Upload du fichier
├── Options (checkboxes)
├── Preview (nombre d'éléments détectés)
├── Bouton "Importer"
├── Progression (barre de progression)
└── Résultat (rapport détaillé)
```

### Commande CLI

```bash
php artisan cms:import:wordpress /path/to/export.xml --posts --pages --media --comments
```

---

## 13. Open Graph / Twitter Cards complets

**Référence** : Tous les CMS modernes

> Les champs existent partiellement (og_image sur pages). Il faut compléter le rendu et ajouter les champs manquants.

### Champs additionnels sur pages et posts

```php
// Ajout migration
$table->string('og_title')->nullable();
$table->string('og_description')->nullable();
$table->enum('og_type', ['website', 'article', 'product', 'profile'])->default('article');
$table->string('twitter_card')->nullable();        // summary | summary_large_image
```

### Settings Social (groupe `social`)

```php
'social.og_default_image'      => '',
'social.twitter_handle'        => '',              // @monsite
'social.facebook_app_id'       => '',
'social.facebook_url'          => '',
'social.twitter_url'           => '',
'social.instagram_url'         => '',
'social.linkedin_url'          => '',
'social.youtube_url'           => '',
'social.tiktok_url'            => '',
'social.pinterest_url'         => '',
'social.github_url'            => '',
```

### Rendu complet dans SeoHead

```html
<!-- Open Graph -->
<meta property="og:title" content="Titre" />
<meta property="og:description" content="Description" />
<meta property="og:image" content="https://example.com/image.jpg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:type" content="article" />
<meta property="og:url" content="https://example.com/page" />
<meta property="og:site_name" content="Mon Site" />
<meta property="og:locale" content="fr_FR" />
<meta property="article:published_time" content="2026-03-14T10:00:00+00:00" />
<meta property="article:modified_time" content="2026-03-14T12:00:00+00:00" />
<meta property="article:author" content="Auteur" />
<meta property="article:section" content="Catégorie" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:site" content="@monsite" />
<meta name="twitter:creator" content="@auteur" />
<meta name="twitter:title" content="Titre" />
<meta name="twitter:description" content="Description" />
<meta name="twitter:image" content="https://example.com/image.jpg" />
```

---

## 14. Newsletter / Email Marketing

**Référence** : Ghost (natif, son coeur), Shopify Email, Wix, Squarespace

### Tables

```php
Schema::create('newsletter_subscribers', function (Blueprint $table) {
    $table->id();
    $table->string('email')->unique();
    $table->string('name')->nullable();
    $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
    $table->enum('status', ['subscribed', 'unsubscribed', 'bounced'])->default('subscribed');
    $table->string('source')->default('form');      // form, import, api, registration
    $table->json('tags')->nullable();               // Tags pour segmentation
    $table->string('confirmation_token')->nullable();
    $table->timestamp('confirmed_at')->nullable();
    $table->timestamp('unsubscribed_at')->nullable();
    $table->timestamps();

    $table->index('status');
});

Schema::create('newsletter_campaigns', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->string('subject');
    $table->text('preview_text')->nullable();
    $table->longText('content_html');
    $table->longText('content_text')->nullable();
    $table->enum('status', ['draft', 'scheduled', 'sending', 'sent'])->default('draft');
    $table->json('segment')->nullable();            // Filtre de destinataires (tags, etc.)
    $table->timestamp('scheduled_at')->nullable();
    $table->timestamp('sent_at')->nullable();
    $table->unsignedInteger('recipients_count')->default(0);
    $table->unsignedInteger('opens_count')->default(0);
    $table->unsignedInteger('clicks_count')->default(0);
    $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
    $table->timestamps();
});
```

### NewsletterService

```php
class NewsletterService
{
    // Abonner un email (avec double opt-in)
    public function subscribe(string $email, ?string $name = null, array $tags = []): NewsletterSubscriber;

    // Désabonner
    public function unsubscribe(string $email): void;

    // Confirmer (double opt-in)
    public function confirm(string $token): NewsletterSubscriber;

    // Envoyer une campagne
    public function sendCampaign(NewsletterCampaign $campaign): void;

    // Planifier l'envoi
    public function scheduleCampaign(NewsletterCampaign $campaign, Carbon $at): void;

    // Importer des abonnés (CSV)
    public function import(UploadedFile $file): int;

    // Exporter les abonnés (CSV)
    public function export(array $filters = []): StreamedResponse;

    // Segmenter par tags
    public function getByTags(array $tags): Collection;
}
```

### Double Opt-in

```
1. Visiteur entre son email → table newsletter_subscribers (status=subscribed, confirmed_at=null)
2. Email de confirmation envoyé avec token
3. Clic sur le lien → confirmed_at = now()
4. Si pas de confirmation sous 48h → suppression automatique
```

### Settings Newsletter (groupe `newsletter`)

```php
'newsletter.enabled'         => true,
'newsletter.double_optin'    => true,
'newsletter.from_name'       => '',            // Fallback sur site name
'newsletter.from_email'      => '',            // Fallback sur mail.from
'newsletter.reply_to'        => '',
'newsletter.unsubscribe_url' => '/newsletter/unsubscribe',
```

### Bloc page builder

```tsx
// Bloc "newsletter-form" pour le page builder
{
    type: "newsletter-form",
    props: {
        title: "Inscrivez-vous à notre newsletter",
        description: "Recevez nos derniers articles directement dans votre boîte mail.",
        button_text: "S'inscrire",
        show_name_field: false,
        success_message: "Merci ! Vérifiez votre boîte mail pour confirmer.",
        tags: ["blog"]
    }
}
```

---

## 15. Accessibilité (WCAG 2.1 AA)

**Référence** : Drupal (leader), WordPress (effort continu)

### Checklist WCAG pour ArtisanCMS

#### Admin Panel
- [ ] Navigation clavier complète (tous les éléments interactifs focusables)
- [ ] Focus visible sur tous les éléments (outline)
- [ ] Skip-to-content link
- [ ] ARIA labels sur tous les boutons iconiques
- [ ] ARIA landmarks (main, nav, aside, header, footer)
- [ ] Rôles ARIA sur les composants custom (dialog, tabpanel, tree, etc.)
- [ ] Annonces live regions pour les toasts/notifications (`aria-live="polite"`)
- [ ] Contraste couleurs minimum 4.5:1 (texte) et 3:1 (grands textes)
- [ ] Textes alternatifs sur toutes les images
- [ ] Labels sur tous les inputs de formulaire
- [ ] Messages d'erreur associés aux champs (`aria-describedby`)
- [ ] Pas de couleur seule pour transmettre une information
- [ ] Animations respectant `prefers-reduced-motion`

#### Page Builder
- [ ] Drag & drop accessible au clavier (dnd-kit le supporte nativement)
- [ ] Annonces ARIA lors des déplacements de blocs
- [ ] Alternatives clavier pour toutes les actions (move up/down, delete, duplicate)
- [ ] Panel de propriétés navigable au clavier

#### Front-end (thèmes)
- [ ] HTML sémantique (header, nav, main, article, aside, footer)
- [ ] Heading hierarchy correcte (pas de saut de niveau)
- [ ] Alt text obligatoire sur les images (warning dans le builder si manquant)
- [ ] Liens avec texte descriptif (pas de "cliquez ici")
- [ ] Formulaires avec labels et descriptions
- [ ] Contraste des couleurs du thème vérifié
- [ ] Responsive et zoomable (jusqu'à 200%)

### AccessibilityChecker (outil admin)

```php
class AccessibilityChecker
{
    // Vérifier une page pour les problèmes d'accessibilité
    public function checkPage(Page $page): array;

    // Checks :
    // - Images sans alt text
    // - Headings non hiérarchiques
    // - Liens sans texte
    // - Contrastes insuffisants (basé sur les couleurs du thème)
    // - Formulaires sans labels
    // Retourne : array de warnings/errors avec bloc concerné
}
```

### Composant React AccessibilityReport

```tsx
// Panel dans l'éditeur de page montrant les problèmes d'accessibilité
// Icône dans la toolbar : bouclier avec compteur de warnings
// Clic → liste des problèmes avec lien vers le bloc concerné
```

---

## 16. Éditeur CSS/JS custom dans le theme customizer

**Référence** : WordPress (Additional CSS), Wix (Velo)

### Settings (groupe `advanced`)

```php
'advanced.custom_css'        => '',    // CSS global injecté dans toutes les pages
'advanced.custom_js_head'    => '',    // JS injecté dans <head> (avant </head>)
'advanced.custom_js_body'    => '',    // JS injecté avant </body>
```

### UI dans le customizer de thème

```tsx
// Onglet "Code Custom" dans /admin/themes/customize
// - Éditeur CodeMirror/Monaco pour CSS
// - Éditeur CodeMirror/Monaco pour JS (head)
// - Éditeur CodeMirror/Monaco pour JS (body)
// - Syntax highlighting
// - Auto-complétion basique
// - Preview live dans iframe
// - Warning : "Le JS custom peut affecter la sécurité"
```

### Injection

```php
// Middleware ou Inertia shared data
// CSS : injecté dans <style id="cms-custom-css">
// JS head : injecté dans <script id="cms-custom-js-head">
// JS body : injecté dans <script id="cms-custom-js-body">
```

---

## 17. Shortcodes / Embeds dynamiques

**Référence** : WordPress (shortcodes natif), Ghost (Cards)

> Dans ArtisanCMS, les shortcodes sont remplacés par un système d'**inline blocks** dans l'éditeur TipTap des blocs texte.

### Inline Blocks TipTap

```tsx
// Extensions TipTap pour insérer du contenu dynamique dans un bloc texte
const inlineBlockTypes = [
    'embed',          // Embed URL (YouTube, Vimeo, Twitter, etc.) via oEmbed
    'dynamic-value',  // Valeur dynamique : {{site.name}}, {{current_year}}, {{page.title}}
    'button-inline',  // Bouton CTA inline
    'icon-inline',    // Icône Lucide inline
    'badge',          // Badge/tag inline
];
```

### oEmbed Service

```php
class OEmbedService
{
    // Résoudre une URL en HTML embed
    public function resolve(string $url): ?OEmbedResult;

    // Providers supportés : YouTube, Vimeo, Twitter/X, Instagram, Spotify,
    // SoundCloud, CodePen, GitHub Gist, Google Maps
    // Utilise le protocole oEmbed standard

    // Cache : 24h par URL
}
```

### Dynamic Values (variables de template)

```php
// Variables disponibles dans les blocs texte
$dynamicValues = [
    'site.name'        => fn() => setting('general.site_name'),
    'site.url'         => fn() => config('app.url'),
    'current_year'     => fn() => now()->year,
    'current_date'     => fn() => now()->format('d/m/Y'),
    'page.title'       => fn() => $page->title,
    'page.author'      => fn() => $page->author->name,
    'page.published_at'=> fn() => $page->published_at?->format('d/m/Y'),
    'user.name'        => fn() => auth()->user()?->name ?? 'Visiteur',
];

// Les plugins peuvent enregistrer des variables :
CMS::filter('dynamic_values', function ($values) {
    $values['shop.cart_count'] = fn() => Cart::count();
    return $values;
});
```

---

## 18. Mode maintenance

**Référence** : WordPress (natif), Joomla (natif), Laravel (natif via artisan down)

### Settings (groupe `maintenance`)

```php
'maintenance.enabled'         => false,
'maintenance.message'         => 'Site en maintenance. Nous serons bientôt de retour.',
'maintenance.allowed_ips'     => '',          // IPs qui peuvent accéder (1 par ligne)
'maintenance.secret'          => '',          // URL secrète pour bypass : /maintenance-bypass/{secret}
'maintenance.show_countdown'  => false,
'maintenance.end_time'        => null,        // DateTime de fin prévue
'maintenance.custom_page'     => null,        // Page ID custom à afficher
'maintenance.allow_admin'     => true,        // Les admins connectés peuvent accéder
```

### Middleware MaintenanceMode

```php
class MaintenanceMode
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!setting('maintenance.enabled')) {
            return $next($request);
        }

        // Bypass : admin connecté
        if (setting('maintenance.allow_admin') && auth()->check() && auth()->user()->isAdmin()) {
            return $next($request);
        }

        // Bypass : IP autorisée
        if (in_array($request->ip(), $this->getAllowedIps())) {
            return $next($request);
        }

        // Bypass : secret URL
        if ($request->is("maintenance-bypass/*")) {
            // Stocker le bypass en session
        }

        // Bypass : routes admin et login
        if ($request->is('admin/*') || $request->is('login')) {
            return $next($request);
        }

        return Inertia::render('Front/Maintenance', [
            'message'   => setting('maintenance.message'),
            'endTime'   => setting('maintenance.end_time'),
            'countdown' => setting('maintenance.show_countdown'),
        ])->toResponse($request)->setStatusCode(503);
    }
}
```

### Commande CLI

```bash
php artisan cms:maintenance:on --message="Mise à jour en cours" --allow-ip=127.0.0.1
php artisan cms:maintenance:off
```

---

## 19. Export/Import de contenu (JSON/CSV)

**Référence** : WordPress (WXR), Drupal (Migrate API), Strapi (strapi transfer)

### ExportService

```php
class ExportService
{
    // Export complet du site (JSON)
    public function exportAll(): array;

    // Export sélectif
    public function exportPages(array $filters = []): array;
    public function exportPosts(array $filters = []): array;
    public function exportMedia(): array;
    public function exportMenus(): array;
    public function exportTaxonomies(): array;
    public function exportSettings(): array;
    public function exportComments(): array;

    // Export CSV (pour les listes)
    public function exportToCsv(string $type, array $filters = []): StreamedResponse;

    // Télécharger le package complet (ZIP)
    public function exportPackage(): string;  // Retourne le path du ZIP
}
```

### ImportService (générique)

```php
class ImportService
{
    // Import depuis un package ArtisanCMS (JSON)
    public function importFromPackage(UploadedFile $file, array $options): ImportResult;

    // Import CSV
    public function importFromCsv(UploadedFile $file, string $type, array $mapping): ImportResult;

    // Options : overwrite, skip_existing, default_author, import_media, etc.
}
```

### Format d'export ArtisanCMS (JSON)

```json
{
    "version": "1.0.0",
    "exported_at": "2026-03-14T10:00:00+00:00",
    "site": {
        "name": "Mon Site",
        "url": "https://example.com"
    },
    "data": {
        "pages": [...],
        "posts": [...],
        "media": [...],
        "menus": [...],
        "taxonomies": [...],
        "comments": [...],
        "settings": [...]
    }
}
```

### Routes admin

```
GET  /admin/tools/export           → Page d'export (checkboxes par type)
POST /admin/tools/export/download  → Télécharger le package
GET  /admin/tools/import           → Page d'import
POST /admin/tools/import/upload    → Upload et traitement
```

---

## 20. Pages d'erreur custom (404, 500, 503)

**Référence** : WordPress (thème), Joomla (natif)

### Settings (groupe `errors`)

```php
'errors.404_page_id'          => null,         // Page custom pour 404 (null = défaut)
'errors.500_page_id'          => null,
'errors.503_page_id'          => null,
'errors.show_search_on_404'   => true,         // Afficher un champ de recherche sur la 404
'errors.show_suggestions_404' => true,          // Suggestions de pages similaires
```

### Handler personnalisé

```php
// app/Exceptions/Handler.php
public function render($request, Throwable $exception): Response
{
    if ($exception instanceof NotFoundHttpException) {
        $customPage = setting('errors.404_page_id')
            ? Page::find(setting('errors.404_page_id'))
            : null;

        // Logger la 404 pour les suggestions de redirections
        app(RedirectService::class)->log404($request->path(), $request->ip());

        return Inertia::render('Front/Error404', [
            'customPage'  => $customPage,
            'showSearch'  => setting('errors.show_search_on_404'),
            'suggestions' => setting('errors.show_suggestions_404')
                ? $this->getSimilarPages($request->path())
                : [],
        ])->toResponse($request)->setStatusCode(404);
    }

    // ... 500, 503
}

private function getSimilarPages(string $path): Collection
{
    $slug = basename($path);
    return Page::published()
        ->where('slug', 'LIKE', "%{$slug}%")
        ->limit(5)
        ->get(['title', 'slug']);
}
```

---

## 21. Breadcrumbs automatiques

**Référence** : WordPress (Yoast), Joomla (natif)

> Le bloc `breadcrumb` existe déjà. On ajoute un service de génération automatique.

### BreadcrumbService

```php
class BreadcrumbService
{
    // Générer le fil d'Ariane automatiquement
    public function generate(Model $entity): array;

    // Pour une page (basé sur la hiérarchie parent_id)
    public function forPage(Page $page): array;

    // Pour un post (Accueil > Blog > Catégorie > Article)
    public function forPost(Post $post): array;

    // Pour un content type custom
    public function forContentEntry(ContentEntry $entry): array;

    // Pour une archive taxonomie
    public function forTaxonomy(TaxonomyTerm $term): array;

    // Format retourné
    // [
    //     ['label' => 'Accueil', 'url' => '/'],
    //     ['label' => 'Blog', 'url' => '/blog'],
    //     ['label' => 'Catégorie', 'url' => '/blog/category/news'],
    //     ['label' => 'Mon article', 'url' => null],  // Dernier = pas de lien
    // ]
}
```

### Rendu automatique dans les layouts du thème

```tsx
// Le thème peut choisir d'afficher les breadcrumbs automatiquement
<AutoBreadcrumbs entity={page} schema={true} />

// schema={true} → génère aussi le JSON-LD BreadcrumbList
```

### JSON-LD BreadcrumbList

```json
{
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Accueil", "item": "https://example.com" },
        { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://example.com/blog" },
        { "@type": "ListItem", "position": 3, "name": "Mon article" }
    ]
}
```

---

## 22. Galeries photos avancées

**Référence** : WordPress (plugins), Squarespace (natif)

> Le bloc `gallery` existe. On l'enrichit avec plus de layouts et un lightbox.

### Props étendues du bloc gallery

```json
{
    "type": "gallery",
    "props": {
        "images": [],
        "layout": "grid",
        "columns": { "desktop": 4, "tablet": 3, "mobile": 2 },
        "gap": 8,
        "aspect_ratio": "auto",
        "lightbox": true,
        "lightbox_captions": true,
        "lightbox_counter": true,
        "lightbox_thumbnails": true,
        "hover_effect": "zoom",
        "lazy_load": true,
        "image_size": "medium",
        "show_captions": false,
        "caption_position": "below",
        "link_to": "lightbox",
        "border_radius": 8,
        "masonry": false,
        "max_height": null
    }
}
```

### Layouts disponibles

| Layout | Description |
|--------|-------------|
| `grid` | Grille uniforme (colonnes × rangées) |
| `masonry` | Masonry Pinterest-style (hauteurs variables) |
| `slider` | Carousel horizontal (swipe/flèches) |
| `justified` | Images justifiées (hauteur uniforme, largeur variable) |
| `collage` | Layout artistique (1 grande + petites) |
| `filmstrip` | Bande de film (thumbnails horizontaux + grande image) |

### Hover effects

| Effect | Description |
|--------|-------------|
| `none` | Pas d'effet |
| `zoom` | Zoom léger |
| `fade` | Overlay sombre avec icône |
| `slide-up` | Caption slide up |
| `blur` | Léger flou |

### Lightbox React

```tsx
// Utiliser une lib légère : yet-another-react-lightbox ou glightbox
// Features : navigation clavier, swipe mobile, zoom, thumbnails, captions
// Pas de dépendance jQuery
```

---

## 23. Preview temporelle (Content Staging)

**Référence** : Magento (Content Staging), WordPress (PublishPress)

### Fonctionnalité

Prévisualiser le site tel qu'il sera à une date future (pour le contenu scheduled).

### Implementation

```php
class ContentPreviewService
{
    // Générer une URL de preview pour une date future
    public function generateTimePreviewUrl(Carbon $targetDate): string;

    // Le token contient la date cible chiffrée
    // Ex: /preview/time/{encrypted_token}

    // Middleware TimePreview
    // Si le token est valide, modifie temporairement now()
    // Les pages scheduled avec published_at <= targetDate sont affichées comme published
}
```

### Middleware TimePreview

```php
class TimePreview
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->has('preview_time')) {
            $targetDate = decrypt($request->get('preview_time'));
            Carbon::setTestNow($targetDate);
            // Les requêtes Eloquent verront les pages scheduled comme published
        }

        return $next($request);
    }
}
```

---

## 24. A/B Testing (basique)

**Référence** : Magento (natif)

### Table : ab_tests

```php
Schema::create('ab_tests', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->foreignId('page_id')->constrained()->cascadeOnDelete();
    $table->json('variant_a');                     // Content JSON de la variante A (original)
    $table->json('variant_b');                     // Content JSON de la variante B
    $table->unsignedInteger('views_a')->default(0);
    $table->unsignedInteger('views_b')->default(0);
    $table->unsignedInteger('conversions_a')->default(0);
    $table->unsignedInteger('conversions_b')->default(0);
    $table->string('conversion_goal');             // button_click, form_submit, page_visit
    $table->string('conversion_target')->nullable();// Selector CSS ou page slug
    $table->enum('status', ['draft', 'running', 'completed'])->default('draft');
    $table->decimal('traffic_split', 3, 2)->default(0.50); // 50/50
    $table->timestamp('started_at')->nullable();
    $table->timestamp('ended_at')->nullable();
    $table->string('winner')->nullable();          // a | b | null
    $table->timestamps();
});
```

### AbTestService

```php
class AbTestService
{
    // Déterminer quelle variante afficher (cookie-based)
    public function getVariant(AbTest $test, Request $request): string;  // 'a' | 'b'

    // Enregistrer une conversion
    public function recordConversion(AbTest $test, string $variant): void;

    // Calculer la significativité statistique
    public function calculateSignificance(AbTest $test): float;

    // Terminer le test et déclarer un gagnant
    public function conclude(AbTest $test): void;
}
```

---

## 25. Dark Mode Admin

**Référence** : Joomla 5.3 (natif)

### Implementation

```tsx
// Utilise le système de Tailwind CSS v4 dark mode
// Toggle dans le header admin (soleil/lune)
// Sauvegardé dans user.preferences.theme = 'light' | 'dark' | 'system'

// Rendu : <html class="dark"> ou media query prefers-color-scheme
```

### Settings utilisateur

```php
// Dans users.preferences JSON
'theme' => 'system',  // light | dark | system
```

### CSS

```css
/* Toutes les couleurs admin utilisent des CSS variables */
:root {
    --admin-bg: #ffffff;
    --admin-text: #1a1a1a;
    --admin-sidebar: #f8f9fa;
    --admin-border: #e5e7eb;
    --admin-card: #ffffff;
    /* ... */
}

.dark {
    --admin-bg: #0f172a;
    --admin-text: #e2e8f0;
    --admin-sidebar: #1e293b;
    --admin-border: #334155;
    --admin-card: #1e293b;
}
```

---

## 26. Social Login

**Référence** : WordPress (plugins), Wix (natif)

### Package

```bash
composer require laravel/socialite
```

### Providers supportés

| Provider | Config |
|----------|--------|
| Google | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| Facebook | `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET` |
| GitHub | `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` |
| Twitter/X | `TWITTER_CLIENT_ID`, `TWITTER_CLIENT_SECRET` |

### Table : social_accounts

```php
Schema::create('social_accounts', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->string('provider');                    // google, facebook, github, twitter
    $table->string('provider_id');
    $table->string('avatar_url')->nullable();
    $table->string('token')->nullable();
    $table->string('refresh_token')->nullable();
    $table->timestamp('token_expires_at')->nullable();
    $table->timestamps();

    $table->unique(['provider', 'provider_id']);
    $table->index('user_id');
});
```

### Settings (groupe `social_login`)

```php
'social_login.enabled'              => false,
'social_login.google_enabled'       => false,
'social_login.facebook_enabled'     => false,
'social_login.github_enabled'       => false,
'social_login.twitter_enabled'      => false,
'social_login.auto_register'        => true,       // Créer un compte si n'existe pas
'social_login.default_role'         => 'subscriber',
```

### Routes

```php
Route::get('/auth/{provider}/redirect', [SocialLoginController::class, 'redirect']);
Route::get('/auth/{provider}/callback', [SocialLoginController::class, 'callback']);
```

---

## 27. Two-Factor Authentication (2FA)

**Référence** : Joomla (natif), Magento (natif)

### Package

```bash
composer require pragmarx/google2fa-laravel
composer require bacon/bacon-qr-code
```

### Champs additionnels sur users

```php
$table->boolean('two_factor_enabled')->default(false);
$table->string('two_factor_secret')->nullable();       // Chiffré
$table->json('two_factor_recovery_codes')->nullable();  // Chiffré, 8 codes
$table->timestamp('two_factor_confirmed_at')->nullable();
```

### TwoFactorService

```php
class TwoFactorService
{
    // Activer 2FA (générer secret + QR code)
    public function enable(User $user): array;  // ['secret', 'qr_code_url', 'recovery_codes']

    // Confirmer l'activation (vérifier le premier code)
    public function confirm(User $user, string $code): bool;

    // Désactiver 2FA
    public function disable(User $user, string $password): bool;

    // Vérifier un code TOTP
    public function verify(User $user, string $code): bool;

    // Vérifier un code de récupération
    public function verifyRecoveryCode(User $user, string $code): bool;

    // Régénérer les codes de récupération
    public function regenerateRecoveryCodes(User $user): array;
}
```

### Settings (groupe `security`)

```php
'security.2fa_required_roles'   => [],             // Rôles qui doivent activer 2FA (ex: ['admin'])
'security.2fa_enabled'          => true,           // Fonctionnalité disponible
```

### Flow de login avec 2FA

```
1. User entre email + password → validation OK
2. Si 2FA activé → redirect vers page de vérification 2FA
3. User entre le code TOTP (ou code de récupération)
4. Vérification OK → login complet
5. Si code invalide → retry (max 5 tentatives, puis lockout 15 min)
```

---

## 28. Corbeille média

**Référence** : WordPress (natif)

### Modification de la table media

```php
// Ajouter soft deletes à la table media
$table->softDeletes();
```

### MediaService (ajout)

```php
// Soft delete : déplace en corbeille
public function trash(Media $media): void;

// Restaurer depuis la corbeille
public function restore(Media $media): void;

// Supprimer définitivement (fichiers + DB)
public function forceDelete(Media $media): void;

// Vider la corbeille (tous les soft deleted)
public function emptyTrash(): int;

// Auto-purge : supprimer les médias en corbeille depuis > 30 jours
// Via commande scheduled : php artisan cms:media:cleanup-trash
```

---

## 29. Duplicate page/post en un clic

**Référence** : WordPress (Yoast Duplicate Post)

> L'endpoint API existe déjà (`POST /api/admin/pages/{page}/duplicate`). Il faut s'assurer que :

### Comportement de la duplication

```php
class PageService
{
    public function duplicate(Page $page): Page
    {
        $clone = $page->replicate(['slug', 'status', 'published_at']);
        $clone->title = $page->title . ' (copie)';
        $clone->slug = Str::slug($page->title . '-copie-' . Str::random(4));
        $clone->status = 'draft';
        $clone->published_at = null;
        $clone->created_by = auth()->id();
        $clone->save();

        // Dupliquer les relations (taxonomies)
        $clone->terms()->sync($page->terms->pluck('id'));

        return $clone;
    }
}
```

### UI

```tsx
// Bouton "Dupliquer" dans :
// 1. Le menu contextuel (3 dots) de chaque page/post dans la liste
// 2. La barre d'action de l'éditeur de page
// Ouvre directement l'éditeur avec la copie
```

---

## 30. Sticky / Articles en vedette

**Référence** : WordPress (natif), Joomla (natif)

### Champs additionnels

```php
// Ajout sur la table posts
$table->boolean('is_sticky')->default(false);       // Épinglé en haut
$table->boolean('is_featured')->default(false);     // Mis en avant
$table->integer('featured_order')->default(0);      // Ordre dans les featured
```

### Requêtes

```php
// Les posts sticky apparaissent toujours en premier dans les listes
Post::published()
    ->orderByDesc('is_sticky')
    ->orderByDesc('published_at')
    ->paginate(10);

// Posts featured (pour slider, homepage, etc.)
Post::published()
    ->where('is_featured', true)
    ->orderBy('featured_order')
    ->limit(5)
    ->get();
```

### Bloc page builder

```json
{
    "type": "featured-posts",
    "props": {
        "count": 3,
        "layout": "carousel",
        "show_excerpt": true,
        "show_category": true,
        "show_author": true,
        "show_date": true
    }
}
```

---

## 31. Gravatar / Avatar utilisateur

**Référence** : WordPress (Gravatar natif)

### GravatarService

```php
class GravatarService
{
    // Générer l'URL Gravatar depuis un email
    public function url(string $email, int $size = 80, string $default = 'mp'): string
    {
        $hash = md5(strtolower(trim($email)));
        return "https://www.gravatar.com/avatar/{$hash}?s={$size}&d={$default}&r=g";
    }
}
```

### Logique avatar (User model)

```php
public function getAvatarUrlAttribute(): string
{
    if ($this->avatar) {
        return Storage::url($this->avatar);  // Avatar uploadé
    }

    if (setting('users.use_gravatar', true)) {
        return app(GravatarService::class)->url($this->email);
    }

    return '/images/default-avatar.png';     // Avatar par défaut
}
```

### Settings

```php
'users.use_gravatar'           => true,
'users.default_avatar'         => 'mp',      // mp | identicon | monsterid | wavatar | retro
'users.allow_avatar_upload'    => true,
```

---

## 32. Favoris admin / Bookmarks

### Table : admin_bookmarks

```php
Schema::create('admin_bookmarks', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->string('label');
    $table->string('url');                         // URL admin relative (/admin/pages/5/edit)
    $table->string('icon')->nullable();            // Icône Lucide
    $table->integer('order')->default(0);
    $table->timestamps();

    $table->index(['user_id', 'order']);
});
```

### UI

```tsx
// Icône étoile dans le header admin → dropdown des favoris
// Bouton "Ajouter aux favoris" sur chaque page admin
// Drag & drop pour réordonner
// Max 20 favoris par utilisateur
```

---

## 33. Notifications in-app

**Référence** : Joomla (natif), Laravel (Notifications)

### Utilise la table notifications de Laravel

```php
// Table notifications (native Laravel)
Schema::create('notifications', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->string('type');
    $table->morphs('notifiable');
    $table->text('data');
    $table->timestamp('read_at')->nullable();
    $table->timestamps();
});
```

### Types de notifications in-app

| Type | Quand | Pour |
|------|-------|------|
| `NewComment` | Nouveau commentaire sur un post | Auteur du post |
| `CommentReply` | Réponse à un commentaire | Auteur du commentaire parent |
| `ContentPublished` | Page/post publié par un éditeur | Admin |
| `FormSubmission` | Nouvelle soumission de formulaire | Admin |
| `PluginUpdate` | Mise à jour de plugin disponible | Admin |
| `BackupCompleted` | Sauvegarde terminée | Admin |
| `BackupFailed` | Sauvegarde échouée | Admin |
| `NewUser` | Nouvel utilisateur inscrit | Admin |
| `MembershipExpiring` | Abonnement expire bientôt | Utilisateur |

### Composant React NotificationBell

```tsx
// Icône cloche dans le header admin
// Badge avec le nombre de notifications non lues
// Dropdown avec la liste des notifications récentes
// Clic → marque comme lu + navigue vers la page concernée
// "Tout marquer comme lu"
// Lien "Voir toutes les notifications"
```

### API Endpoints

```
GET    /api/admin/notifications              → Liste paginée
POST   /api/admin/notifications/mark-read    → Marquer comme lu
POST   /api/admin/notifications/mark-all-read → Tout marquer
DELETE /api/admin/notifications/{id}         → Supprimer
GET    /api/admin/notifications/unread-count → Compteur (polling 30s)
```

### Polling ou WebSockets

```php
// V1 : Polling toutes les 30 secondes (simple, pas de dépendance)
// V2 : Laravel Echo + Pusher/Soketi pour temps réel
```

---

## 34. Contenu dupliqué / Articles en vedette — UI

> Voir points 29 et 30 ci-dessus pour l'implémentation technique.

### UI dans la liste des posts

```tsx
// Colonne "Épinglé" avec icône pin (toggle)
// Colonne "En vedette" avec icône étoile (toggle)
// Filtre rapide : "Épinglés" | "En vedette" | "Tous"
// Drag & drop pour réordonner les featured
```

---

## 35. Fonctionnalités additionnelles mineures

### 35a. Header `<link>` auto-discovery

```html
<!-- Ajouté automatiquement dans le <head> -->
<link rel="alternate" type="application/rss+xml" title="Feed RSS" href="/feed" />
<link rel="sitemap" type="application/xml" title="Sitemap" href="/sitemap.xml" />
<link rel="canonical" href="https://example.com/current-page" />
<link rel="shortlink" href="https://example.com/?p=123" />
<link rel="manifest" href="/manifest.json" />
<link rel="icon" href="/favicon.ico" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
```

### 35b. Robots.txt dynamique

```php
// Route : GET /robots.txt
Route::get('/robots.txt', function () {
    $content = setting('seo.robots_txt') ?: $this->defaultRobotsTxt();
    return response($content, 200, ['Content-Type' => 'text/plain']);
});

// Défaut :
// User-agent: *
// Allow: /
// Disallow: /admin/
// Disallow: /install/
// Disallow: /api/
// Sitemap: https://example.com/sitemap.xml
```

### 35c. Manifest.json (PWA-ready)

```php
// Route : GET /manifest.json
// Généré dynamiquement depuis les settings branding
{
    "name": "Mon Site",
    "short_name": "MonSite",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#ffffff",
    "theme_color": "#3b82f6",
    "icons": [
        { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
        { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
    ]
}
```

### 35d. Page de login personnalisable

> Déjà partiellement couvert par le white-labeling (blueprint 19). On ajoute :

```php
'login.layout'                 => 'split',     // split | centered | fullscreen
'login.show_social_login'      => true,
'login.show_register_link'     => true,
'login.show_remember_me'       => true,
'login.custom_css'             => '',
```

---

## Résumé des migrations à créer

| Table | Fonctionnalité |
|-------|---------------|
| `comments` | Système de commentaires |
| `redirects` | Redirections 301/302 |
| `redirect_404_log` | Log des 404 |
| `translations` | Contenu multilingue (préparation V1) |
| `content_types` | Custom Post Types |
| `content_entries` | Entrées de contenu custom |
| `widget_areas` | Zones de widgets |
| `widgets` | Widgets |
| `newsletter_subscribers` | Abonnés newsletter |
| `newsletter_campaigns` | Campagnes newsletter |
| `membership_plans` | Plans d'abonnement |
| `user_memberships` | Abonnements utilisateur |
| `ab_tests` | A/B testing |
| `social_accounts` | Login social |
| `admin_bookmarks` | Favoris admin |

### Modifications de tables existantes

| Table | Ajouts |
|-------|--------|
| `pages` | `exclude_from_sitemap`, `sitemap_priority`, `sitemap_changefreq`, `og_title`, `og_description`, `og_type`, `twitter_card`, `visibility`, `password_hash`, `required_plans` |
| `posts` | idem pages + `is_sticky`, `is_featured`, `featured_order` |
| `users` | `two_factor_enabled`, `two_factor_secret`, `two_factor_recovery_codes`, `two_factor_confirmed_at` |
| `media` | `deleted_at` (soft deletes) |

### Nouveaux Services

| Service | Fonctionnalité |
|---------|---------------|
| `CommentService` | Commentaires |
| `CommentSpamChecker` | Anti-spam commentaires |
| `SeoService` | SEO core |
| `SitemapService` | Sitemap XML |
| `RedirectService` | Redirections |
| `RssFeedService` | RSS feeds |
| `ContentTypeService` | Custom Post Types |
| `OEmbedService` | Embeds / shortcodes |
| `WordPressImportService` | Import WordPress |
| `WpContentConverter` | Conversion contenu WP |
| `ExportService` | Export de contenu |
| `ImportService` | Import de contenu |
| `NewsletterService` | Newsletter |
| `MembershipService` | Membership |
| `BreadcrumbService` | Breadcrumbs automatiques |
| `AccessibilityChecker` | Audit accessibilité |
| `TwoFactorService` | 2FA |
| `GravatarService` | Gravatar |
| `AbTestService` | A/B testing |
| `ContentPreviewService` | Preview temporelle |

---

## Hooks et filtres associés

```php
// Commentaires
CMS::hook('comment.created', fn(Comment $c) => ...);
CMS::hook('comment.approved', fn(Comment $c) => ...);
CMS::filter('comment_content', fn(string $content) => ...);

// SEO
CMS::filter('seo_meta', fn(array $meta, Model $entity) => ...);
CMS::filter('seo_jsonld', fn(array $jsonLd, Model $entity) => ...);

// RSS
CMS::filter('rss_items', fn(Collection $items) => ...);
CMS::filter('rss_item', fn(array $item, Model $entity) => ...);

// Content Types
CMS::hook('content_entry.created', fn(ContentEntry $e) => ...);
CMS::filter('content_type_fields', fn(array $fields, ContentType $type) => ...);

// Membership
CMS::hook('membership.subscribed', fn(User $u, MembershipPlan $p) => ...);
CMS::hook('membership.cancelled', fn(User $u, UserMembership $m) => ...);
CMS::filter('content_access', fn(bool $canAccess, User $u, Model $content) => ...);

// Newsletter
CMS::hook('newsletter.subscribed', fn(NewsletterSubscriber $s) => ...);
CMS::hook('newsletter.campaign_sent', fn(NewsletterCampaign $c) => ...);

// Widgets
CMS::filter('widget_output', fn(string $html, Widget $widget) => ...);
CMS::filter('widget_areas', fn(Collection $areas) => ...);
```

---

## Priorité d'implémentation recommandée

### Phase 1 (avec les fondations)
- SEO Core (#2, #3, #13, #21)
- RSS Feeds (#5)
- Redirections (#4)
- Pages d'erreur 404 (#20)
- Mode maintenance (#18)
- Robots.txt dynamique (#35b)
- Manifest.json (#35c)
- Dark Mode Admin (#25)

### Phase 2 (avec le contenu)
- Commentaires (#1)
- Sticky/Featured posts (#30)
- Duplicate page/post (#29)
- Corbeille média (#28)
- Gravatar (#31)
- Export/Import contenu (#19)
- Breadcrumbs auto (#21)

### Phase 3 (avec le builder)
- Galeries avancées (#22)
- Shortcodes/Embeds (#17)
- Éditeur CSS/JS custom (#16)
- Accessibilité (#15)

### Phase 4 (avec les thèmes & plugins)
- Custom Post Types + Custom Fields (#7, #8)
- Widgets/Zones dynamiques (#11)
- Import WordPress (#12)
- Newsletter (#14)
- Notifications in-app (#33)
- Favoris admin (#32)

### Phase 5+ (fonctionnalités avancées)
- Membership (#10)
- Social Login (#26)
- 2FA (#27)
- GraphQL API (#9)
- Contenu multilingue (#6)
- A/B Testing (#24)
- Preview temporelle (#23)
- Page de login personnalisable (#35d)
