# Blueprint 31 - UX Builder avancée & Fonctionnalités manquantes (Audit final)

Ce document couvre les 22 dernières fonctionnalités identifiées comme manquantes après un audit croisé exhaustif du code existant, des blueprints 01-29, et des 10 CMS majeurs (WordPress, Joomla, Drupal, PrestaShop, Magento, Shopify, Wix, Squarespace, Ghost, Strapi).

---

## Priorités

| Priorité | Fonctionnalités |
|----------|----------------|
| **HAUTE** | 1-6 (global styles, dynamic content binding, search autocomplete, error recovery, block patterns, command palette) |
| **MOYENNE** | 7-17 (block transforms, editorial calendar, animations, pre-publish checklist, paste from Word, session management, cron plugins, media usage, config sync, oEmbed, gallery reorder) |
| **BASSE** | 18-22 (shape dividers, copy/paste styles, import multi-CMS, announcement bar, fullscreen editing) |

---

## 1. Global Styles / Design Tokens / Style Book

**Référence** : WordPress (Global Styles + Style Book), Elementor (Global Colors/Fonts), Shopify (color schemes), Wix, Squarespace
**Présent dans** : 5/10 CMS

> Va au-delà des CSS variables du thème (blueprint 03). C'est un système de styles nommés réutilisables que l'utilisateur final peut gérer via l'UI.

### Table : design_tokens

```php
Schema::create('cms_design_tokens', function (Blueprint $table) {
    $table->id();
    $table->string('name');                         // "Primary Button", "Heading H1", "Body Text"
    $table->string('slug')->unique();               // "primary-button", "heading-h1"
    $table->enum('category', ['color', 'typography', 'button', 'spacing', 'shadow', 'border']);
    $table->json('value');                          // Token value (structure dépend de la catégorie)
    $table->integer('order')->default(0);
    $table->foreignId('site_id')->nullable()->constrained()->cascadeOnDelete();
    $table->timestamps();

    $table->index(['category', 'site_id']);
});
```

### Structure JSON par catégorie

```jsonc
// color
{ "hex": "#3B82F6", "rgb": "59,130,246", "label": "Bleu primaire" }

// typography
{
    "fontFamily": "Inter, sans-serif",
    "fontSize": "2.25rem",
    "fontWeight": "700",
    "lineHeight": "1.2",
    "letterSpacing": "-0.025em",
    "textTransform": "none"
}

// button
{
    "backgroundColor": "$primary",          // Référence un token couleur
    "textColor": "#FFFFFF",
    "borderRadius": "0.5rem",
    "paddingX": "1.5rem",
    "paddingY": "0.75rem",
    "fontSize": "1rem",
    "fontWeight": "600",
    "hoverBackgroundColor": "$primary-dark",
    "shadow": "$shadow-sm"
}

// spacing
{ "value": "1.5rem", "label": "Moyen" }

// shadow
{ "value": "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)" }

// border
{ "width": "1px", "style": "solid", "color": "$gray-300", "radius": "0.5rem" }
```

### DesignTokenService

```php
class DesignTokenService
{
    // Récupérer tous les tokens par catégorie (avec cache)
    public function getAllByCategory(?string $category = null): Collection;

    // CRUD
    public function create(array $data): DesignToken;
    public function update(DesignToken $token, array $data): DesignToken;
    public function delete(DesignToken $token): void;

    // Réordonner les tokens
    public function reorder(array $orderedIds): void;

    // Générer les CSS variables à partir des tokens
    public function generateCssVariables(): string;

    // Résoudre les références ($primary → valeur réelle)
    public function resolveTokenReferences(array $value): array;

    // Tokens par défaut (installés au setup)
    public function seedDefaults(): void;

    // Export/import tokens
    public function export(): array;
    public function import(array $data): void;
}
```

### Style Book (composant React)

```tsx
// Pages/Admin/StyleBook/Index.tsx
// Affiche une preview visuelle de tous les tokens groupés par catégorie :
// - Palette de couleurs (swatches)
// - Échelle typographique (H1-H6, body, small, caption)
// - Styles de boutons (primary, secondary, outline, ghost, destructive)
// - Échelle de spacing (xs, sm, md, lg, xl, 2xl)
// - Ombres (sm, md, lg, xl)
// - Bordures (rayon, style)
//
// Chaque token est éditable en cliquant dessus (inline editing)
// Preview live : les changements se reflètent immédiatement
```

### Intégration avec le Page Builder

```tsx
// Dans les BlockSettings, au lieu de pickers bruts, proposer les tokens :
// Ex: Couleur → dropdown avec les tokens couleur + option "Personnalisé"
// Ex: Typographie → dropdown avec les presets typo
// Le bloc stocke la référence au token : { "color": "$primary" }
// Le renderer résout la variable CSS : var(--token-primary)
```

### API

```
GET    /api/admin/design-tokens                    → Liste tous les tokens
GET    /api/admin/design-tokens/{category}         → Tokens par catégorie
POST   /api/admin/design-tokens                    → Créer un token
PUT    /api/admin/design-tokens/{id}               → Modifier
DELETE /api/admin/design-tokens/{id}               → Supprimer
POST   /api/admin/design-tokens/reorder            → Réordonner
GET    /api/admin/design-tokens/css                → Générer CSS
POST   /api/admin/design-tokens/export             → Export JSON
POST   /api/admin/design-tokens/import             → Import JSON
```

### Hooks / Filters

```php
CMS::filter('design_tokens.css_output', $css);             // Modifier le CSS généré
CMS::hook('design_tokens.updated', fn($token) => ...);     // Invalidation cache
CMS::filter('design_tokens.defaults', $defaults);          // Ajouter des tokens par défaut
```

---

## 2. Dynamic Content / Data Binding dans le Page Builder

**Référence** : WordPress (Block Bindings API), Elementor (Dynamic Tags), Drupal Views, Wix (Datasets), Strapi (Dynamic Zones)
**Présent dans** : 5/10 CMS

> Permet de connecter les propriétés des blocs à des sources de données dynamiques au lieu de contenu statique.

### Architecture

```
┌─────────────────────────────────────┐
│  BlockNode.props                     │
│  { "text": { "$bind": {            │
│       "source": "post_field",       │
│       "field": "title"              │
│  }}}                                │
└───────────┬─────────────────────────┘
            │ Résolution
┌───────────▼─────────────────────────┐
│  DynamicContentResolver             │
│  - Détecte les props avec $bind     │
│  - Résout la source de données      │
│  - Remplace par la valeur réelle    │
└─────────────────────────────────────┘
```

### Sources de données supportées

```php
// Chaque source implémente cette interface
interface DynamicSource
{
    public function getSlug(): string;           // 'post_field', 'custom_field', 'site_setting', 'current_user', 'query'
    public function getLabel(): string;          // Nom affiché dans l'UI
    public function getAvailableFields(): array; // Champs disponibles
    public function resolve(array $binding, array $context): mixed;
}
```

```php
// Sources intégrées
class PostFieldSource implements DynamicSource       // title, excerpt, featured_image, author, date, etc.
class CustomFieldSource implements DynamicSource      // Champs custom de l'entité courante
class SiteSettingSource implements DynamicSource       // Settings CMS (nom du site, logo, etc.)
class CurrentUserSource implements DynamicSource       // Nom, avatar, rôle de l'utilisateur connecté
class TaxonomySource implements DynamicSource          // Termes associés à l'entité
class QuerySource implements DynamicSource             // Requête personnalisée (type, filtre, tri, limite)
class DateSource implements DynamicSource              // Date courante, formatée
class UrlParameterSource implements DynamicSource      // Paramètres GET de l'URL
```

### Structure JSON dans le bloc

```jsonc
{
    "type": "heading",
    "props": {
        // Propriété statique (comportement actuel)
        "level": 2,
        // Propriété dynamique (nouveau)
        "text": {
            "$bind": {
                "source": "post_field",
                "field": "title",
                "fallback": "Sans titre"        // Valeur si le champ est vide
            }
        }
    }
}
```

### DynamicContentService

```php
class DynamicContentService
{
    // Enregistrer une source de données
    public function registerSource(DynamicSource $source): void;

    // Résoudre toutes les bindings d'un arbre de blocs
    public function resolveTree(array $blockTree, array $context): array;

    // Résoudre une seule binding
    public function resolveBinding(array $binding, array $context): mixed;

    // Lister les sources disponibles (pour l'UI builder)
    public function getAvailableSources(): array;

    // Lister les champs d'une source (pour l'UI builder)
    public function getSourceFields(string $sourceSlug): array;
}
```

### Composant React (panneau de propriétés)

```tsx
// Components/builder/dynamic-binding-picker.tsx
// Quand l'utilisateur clique sur l'icône ⚡ à côté d'une propriété de bloc :
// 1. Affiche un dropdown des sources disponibles
// 2. Au choix de la source, affiche les champs disponibles
// 3. Champ "fallback" pour la valeur par défaut
// 4. Preview live de la valeur résolue
// L'icône passe de grise (statique) à bleue (dynamique) quand une binding est active
```

### API

```
GET /api/builder/dynamic-sources                          → Liste des sources
GET /api/builder/dynamic-sources/{slug}/fields             → Champs d'une source
POST /api/builder/dynamic-resolve                          → Résoudre une binding (preview)
```

### Hooks / Filters

```php
CMS::filter('dynamic_content.sources', $sources);           // Ajouter des sources custom (plugins)
CMS::filter('dynamic_content.resolve', $value, $binding);   // Modifier la résolution
CMS::hook('dynamic_content.source_registered', fn($source) => ...);
```

---

## 3. Search Autocomplete / Suggestions (Frontend)

**Référence** : Shopify (Predictive Search), WordPress (SearchWP/Ajax Search Pro), Joomla (Smart Search), Magento (autocomplete natif)
**Présent dans** : 8/10 CMS — le plus répandu des features manquants

### Architecture

```
┌──────────────────┐       ┌──────────────────────┐
│  SearchInput     │──────▶│  /api/search/suggest  │
│  (debounce 300ms)│       │  (SearchService)      │
│  min 2 chars     │       └──────────┬───────────┘
└──────────────────┘                  │
                           ┌──────────▼───────────┐
                           │  Résultats groupés    │
                           │  - Pages (3 max)      │
                           │  - Posts (3 max)      │
                           │  - Produits (3 max)   │
                           │  - Catégories (2 max) │
                           └──────────────────────┘
```

### Ajout à SearchService

```php
// Ajout de méthode dans app/Services/SearchService.php
class SearchService
{
    // ... méthodes existantes ...

    // Suggestions autocomplete (rapide, limité)
    public function suggest(string $query, int $limit = 10): array
    {
        // Retourne un tableau groupé par type :
        // [
        //   'pages'      => [{ id, title, slug, excerpt(80 chars), url }],
        //   'posts'      => [{ id, title, slug, excerpt, featured_image_thumb, url, date }],
        //   'products'   => [{ id, name, slug, price, image_thumb, url }],  // Si e-commerce actif
        //   'categories' => [{ id, name, slug, count, url }],
        // ]
    }

    // Résultats populaires (quand le champ est focus sans texte)
    public function popular(int $limit = 5): array;

    // Sauvegarder les termes de recherche (analytics)
    public function logSearchTerm(string $query, int $resultsCount): void;
}
```

### Table : search_logs

```php
Schema::create('cms_search_logs', function (Blueprint $table) {
    $table->id();
    $table->string('query');
    $table->integer('results_count')->default(0);
    $table->string('ip_address', 45)->nullable();
    $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
    $table->foreignId('site_id')->nullable()->constrained()->cascadeOnDelete();
    $table->timestamp('created_at');

    $table->index(['query', 'created_at']);
    $table->index('site_id');
});
```

### Route API

```php
// routes/api.php
Route::get('/search/suggest', [SearchController::class, 'suggest'])
    ->middleware('throttle:60,1');  // 60 requêtes/min
Route::get('/search/popular', [SearchController::class, 'popular']);
```

### Composant React

```tsx
// Components/front/search-autocomplete.tsx
interface SearchAutocompleteProps {
    placeholder?: string;
    minChars?: number;        // Défaut: 2
    debounceMs?: number;      // Défaut: 300
    maxResults?: number;      // Défaut: 10
    showPopular?: boolean;    // Afficher les populaires au focus
    showThumbnails?: boolean; // Afficher les miniatures
}

// Fonctionnalités :
// - Debounce de la frappe (300ms)
// - Dropdown avec résultats groupés par type
// - Highlight du texte recherché dans les résultats
// - Navigation au clavier (↑↓ pour sélectionner, Enter pour ouvrir, Escape pour fermer)
// - Thumbnail + excerpt tronqué pour chaque résultat
// - Lien "Voir tous les résultats" en bas
// - État vide : recherches populaires
// - Loading spinner pendant la requête
// - Cache client des résultats récents (Map)
```

### Hooks / Filters

```php
CMS::filter('search.suggest.results', $results, $query);     // Modifier les résultats
CMS::filter('search.suggest.limit', $limit);                  // Modifier la limite
CMS::filter('search.suggest.types', $types);                  // Types de contenu à inclure
CMS::hook('search.query_logged', fn($query, $count) => ...);  // Analytics
```

---

## 4. Error Recovery Mode / Safe Mode

**Référence** : WordPress (Recovery Mode), Drupal (maintenance + module disable), Joomla (extension disable on error)
**Présent dans** : 3/10 CMS — mais CRITIQUE pour la fiabilité

> Si un plugin ou thème cause une erreur fatale, le CMS doit rester accessible pour l'admin.

### Architecture

```
Request → ErrorRecoveryMiddleware → App
              │
              ├─ Erreur fatale détectée ?
              │   ├─ OUI → Log l'erreur + identifier le coupable
              │   │         ├─ Plugin ? → Désactiver le plugin
              │   │         ├─ Thème ? → Revenir au thème par défaut
              │   │         └─ Créer un fichier recovery token
              │   │            → Email à l'admin avec lien de recovery
              │   │            → Afficher une page d'erreur propre
              │   │
              │   └─ NON → Continuer normalement
              │
              └─ Mode recovery actif ? (token dans l'URL)
                  → Charger l'admin en safe mode (plugins désactivés)
                  → Afficher un bandeau "Mode recovery"
```

### Fichier sentinelle

```php
// storage/framework/recovery.json
{
    "active": true,
    "token": "abc123def456",                    // Token unique pour l'accès recovery
    "triggered_at": "2026-03-14T10:30:00Z",
    "error": {
        "message": "Class 'BrokenPlugin\\Service' not found",
        "file": "content/plugins/broken-plugin/src/BrokenServiceProvider.php",
        "line": 42
    },
    "disabled": {
        "type": "plugin",                       // "plugin" ou "theme"
        "slug": "broken-plugin"
    },
    "notified": true                            // Email envoyé
}
```

### ErrorRecoveryService

```php
class ErrorRecoveryService
{
    // Détecter et gérer une erreur fatale
    public function handleFatalError(\Throwable $e): void;

    // Identifier la source de l'erreur (plugin, thème, ou core)
    public function identifyFaultyExtension(\Throwable $e): ?array;

    // Désactiver un plugin défaillant
    public function disablePlugin(string $slug, string $reason): void;

    // Revenir au thème par défaut
    public function revertToDefaultTheme(string $reason): void;

    // Activer le mode recovery
    public function activateRecovery(\Throwable $e, array $faultyExtension): void;

    // Générer un token de recovery
    public function generateRecoveryToken(): string;

    // Vérifier si un token est valide
    public function validateToken(string $token): bool;

    // Envoyer un email de notification à l'admin
    public function notifyAdmin(array $errorInfo): void;

    // Sortir du mode recovery
    public function deactivateRecovery(): void;

    // Vérifier si on est en mode recovery
    public function isRecoveryActive(): bool;
}
```

### Middleware

```php
// app/Http/Middleware/ErrorRecoveryMiddleware.php
class ErrorRecoveryMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        // 1. Vérifier si mode recovery actif
        //    → Si token valide dans l'URL, charger en safe mode
        //    → Si admin authentifié + recovery actif, afficher bandeau

        // 2. Intercepter les erreurs fatales
        //    → register_shutdown_function() pour attraper les fatals
        //    → Identifier le coupable via le stack trace

        return $next($request);
    }
}
```

### Safe Mode (côté admin)

```tsx
// Quand recovery actif, l'admin voit :
// - Bandeau rouge en haut : "Mode recovery actif — Le plugin {slug} a été désactivé suite à une erreur."
// - Bouton "Réactiver le plugin" (tenter de le réactiver)
// - Bouton "Désinstaller le plugin"
// - Bouton "Quitter le mode recovery"
// - Les plugins sont chargés un par un avec try/catch pour identifier les problèmes
```

### Hooks

```php
CMS::hook('recovery.activated', fn($errorInfo) => ...);
CMS::hook('recovery.plugin_disabled', fn($slug, $reason) => ...);
CMS::hook('recovery.deactivated', fn() => ...);
```

---

## 5. Block Patterns / Saved Section Templates

**Référence** : WordPress (Synced Patterns / Reusable Blocks), Elementor (Global Widgets + Saved Sections), Wix, Squarespace, Shopify
**Présent dans** : 5/10 CMS

> Différent des GlobalSections existantes (headers/footers). Les patterns sont des groupes de blocs réutilisables dans le page builder, avec mode synchronisé optionnel.

### Table : block_patterns

```php
Schema::create('cms_block_patterns', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->string('slug')->unique();
    $table->text('description')->nullable();
    $table->string('category')->default('custom');  // 'hero', 'cta', 'testimonials', 'pricing', 'custom'
    $table->json('content');                         // Arbre de blocs (même structure que pages.content)
    $table->string('thumbnail')->nullable();         // Screenshot du pattern
    $table->boolean('is_synced')->default(false);    // true = modifier un modifie toutes les instances
    $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
    $table->foreignId('site_id')->nullable()->constrained()->cascadeOnDelete();
    $table->timestamps();

    $table->index(['category', 'site_id']);
    $table->index('is_synced');
});
```

### BlockPatternService

```php
class BlockPatternService
{
    // CRUD
    public function create(array $data): BlockPattern;
    public function update(BlockPattern $pattern, array $data): BlockPattern;
    public function delete(BlockPattern $pattern): void;

    // Lister par catégorie
    public function getByCategory(?string $category = null): Collection;

    // Insérer un pattern dans une page (copie ou référence)
    public function insertIntoPage(BlockPattern $pattern): array;
    // - Si non synchronisé : retourne une copie des blocs (ids régénérés)
    // - Si synchronisé : retourne un bloc spécial { type: "pattern-ref", props: { patternId: X } }

    // Mettre à jour un pattern synchronisé → mettre à jour toutes les pages qui l'utilisent
    public function updateSyncedInstances(BlockPattern $pattern): int;

    // Trouver les pages qui utilisent un pattern synchronisé
    public function findUsages(BlockPattern $pattern): Collection;

    // Sauvegarder une sélection de blocs comme nouveau pattern
    public function createFromSelection(array $blocks, string $name, bool $synced = false): BlockPattern;

    // Générer un thumbnail du pattern
    public function generateThumbnail(BlockPattern $pattern): string;

    // Catégories disponibles
    public function getCategories(): array;
}
```

### Intégration Page Builder

```tsx
// Dans la sidebar du builder, onglet "Patterns" :
// - Grille de patterns avec thumbnail + nom
// - Filtre par catégorie
// - Drag & drop d'un pattern dans le canvas
// - Clic droit sur une sélection de blocs → "Sauvegarder comme pattern"
// - Les patterns synchronisés ont un badge "Synced" et une bordure spéciale
// - Double-clic sur un pattern synced → popup "Modifier le pattern" (ouvre un mini-éditeur)
// - Les modifications d'un pattern synced sont reflétées partout après sauvegarde
```

### API

```
GET    /api/admin/block-patterns                    → Liste
GET    /api/admin/block-patterns/{id}               → Détail
POST   /api/admin/block-patterns                    → Créer
PUT    /api/admin/block-patterns/{id}               → Modifier
DELETE /api/admin/block-patterns/{id}               → Supprimer
POST   /api/admin/block-patterns/from-selection     → Créer depuis sélection
GET    /api/admin/block-patterns/{id}/usages        → Pages utilisant ce pattern
GET    /api/admin/block-patterns/categories         → Catégories
```

### Hooks

```php
CMS::hook('block_pattern.created', fn($pattern) => ...);
CMS::hook('block_pattern.synced_updated', fn($pattern, $affectedPages) => ...);
CMS::filter('block_pattern.categories', $categories);    // Plugins peuvent ajouter des catégories
```

---

## 6. Command Palette / Quick Actions (Ctrl+K)

**Référence** : WordPress (Command Palette, 6.3+), Shopify, Elementor (Finder), VS Code
**Présent dans** : 4/10 CMS

> Recherche rapide et navigation instantanée dans tout l'admin panel.

### Composant React

```tsx
// Components/admin/command-palette.tsx
interface CommandPaletteProps {
    // Raccourci : Ctrl+K (Cmd+K sur Mac) pour ouvrir/fermer
}

interface CommandItem {
    id: string;
    label: string;
    description?: string;
    icon?: React.ReactNode;
    category: 'navigation' | 'action' | 'content' | 'setting' | 'recent';
    action: () => void;
    keywords?: string[];          // Mots-clés additionnels pour la recherche
}

// Catégories de commandes :
// 1. Navigation : "Pages", "Posts", "Media", "Users", "Settings", "Plugins", "Themes"...
// 2. Actions : "Créer une page", "Ajouter un post", "Uploader un média"...
// 3. Contenu : Recherche dans les pages/posts existants (titre)
// 4. Settings : Liens directs vers les sections de settings
// 5. Récent : Pages/posts récemment édités

// Fonctionnalités :
// - Recherche fuzzy dans les labels + keywords + descriptions
// - Navigation clavier (↑↓ sélection, Enter exécuter, Escape fermer)
// - Affichage groupé par catégorie
// - Score de pertinence (match exact > début > contient > fuzzy)
// - Historique des commandes récentes (localStorage)
// - Extensible via plugins (CMS::filter)
```

### API (recherche contenu côté serveur)

```php
// routes/api.php
Route::get('/admin/command-search', [CommandSearchController::class, 'search'])
    ->middleware(['auth', 'throttle:120,1']);

// Retourne les résultats de recherche dans le contenu (pages, posts, media par titre)
// Les commandes statiques (navigation, actions) sont côté client
```

### CommandSearchController

```php
class CommandSearchController extends Controller
{
    public function search(Request $request): JsonResponse
    {
        $query = $request->input('q', '');

        // Recherche dans : pages (titre), posts (titre), media (original_filename, alt_text)
        // Limité à 5 résultats par type
        // Retourne : [{ type, id, title, url, icon }]
    }
}
```

### Intégration dans AdminLayout

```tsx
// Layouts/AdminLayout.tsx
// - Ajout du composant CommandPalette (rendu global)
// - Listener global keydown pour Ctrl+K / Cmd+K
// - Hint visuel dans la barre de recherche admin : "Ctrl+K"
```

### Extensibilité via plugins

```php
// Un plugin peut ajouter ses propres commandes :
CMS::filter('command_palette.commands', function ($commands) {
    $commands[] = [
        'id' => 'ecommerce-orders',
        'label' => 'Commandes',
        'category' => 'navigation',
        'url' => '/admin/ecommerce/orders',
        'icon' => 'shopping-cart',
        'keywords' => ['commande', 'order', 'vente'],
    ];
    return $commands;
});
```

---

## 7. Block Transforms / Conversions de blocs

**Référence** : WordPress Gutenberg (transforms entre 90+ blocs), Drupal XB
**Présent dans** : 2/10 CMS mais feature critique du builder

> Convertir un bloc en un autre sans perdre le contenu. Ex: Heading → Paragraph, List → separate Paragraphs, Image → Gallery.

### Architecture

```tsx
// stores/block-transforms.ts
interface BlockTransform {
    from: string;          // Type source
    to: string;            // Type destination
    transform: (block: BlockNode) => BlockNode;  // Fonction de transformation
    label?: string;        // Label affiché dans le menu
    priority?: number;     // Ordre dans le menu
}

// Registre global des transformations
const transformRegistry: Map<string, BlockTransform[]> = new Map();

function registerTransform(transform: BlockTransform): void;
function getTransformsFor(blockType: string): BlockTransform[];
function applyTransform(block: BlockNode, targetType: string): BlockNode;
```

### Transformations core

```tsx
// Transformations intégrées :
// heading ↔ paragraph          (conserve le texte, change le tag)
// paragraph → heading          (conserve le texte, ajoute level)
// paragraph → blockquote       (conserve le texte, enveloppe dans <blockquote>)
// paragraph → list-item        (chaque paragraphe devient un item)
// list → paragraphs            (chaque item devient un paragraphe)
// image → gallery              (crée une galerie avec une seule image)
// gallery → images             (éclate en blocs image séparés)
// button → cta                 (conserve texte + URL)
// video → embed                (conserve l'URL)
// code-block → paragraph       (conserve le texte, perd le highlighting)
// columns → group              (remplace la grille par un groupe simple)
```

### UI

```tsx
// Quand un bloc est sélectionné, le toolbar affiche un bouton "Transform" (icône ⇄)
// Au clic → dropdown des types compatibles
// L'undo/redo fonctionne pour les transformations
// Le raccourci est accessible via le menu contextuel (clic droit)
```

### Hooks (extensibilité plugins)

```php
CMS::filter('block_transforms.registry', $transforms);
// Les plugins peuvent ajouter leurs propres transformations
```

---

## 8. Editorial Calendar View

**Référence** : WordPress (PublishPress Calendar), Joomla, Wix, Shopify
**Présent dans** : 4/10 CMS

> Vue calendrier visuelle de tout le contenu planifié, publié, et en brouillon.

### Composant React

```tsx
// Pages/Admin/Calendar/Index.tsx
interface CalendarProps {
    // Vue mensuelle par défaut, commutable en semaine
}

// Fonctionnalités :
// - Vue mois : chaque jour affiche les posts/pages prévus (titre + badge statut)
// - Vue semaine : vue plus détaillée avec heures
// - Couleurs par statut : vert (publié), bleu (planifié), gris (brouillon), orange (en révision)
// - Couleurs par type : pages vs posts vs custom types
// - Drag & drop pour reprogrammer (changer la date de publication)
// - Clic pour ouvrir l'éditeur
// - Bouton "+ Nouveau" sur chaque jour pour créer du contenu à cette date
// - Filtres : par type (page/post), par auteur, par statut
// - Navigation mois par mois (< Février 2026 | Mars 2026 | Avril 2026 >)
```

### API

```
GET /api/admin/calendar?from=2026-03-01&to=2026-03-31&type=all&status=all
→ [{ id, type, title, status, published_at, author, url }]

PUT /api/admin/calendar/{type}/{id}/reschedule
Body: { published_at: "2026-03-20T14:00:00Z" }
```

### Route admin

```php
Route::get('/admin/calendar', [CalendarController::class, 'index'])->name('admin.calendar.index');
Route::put('/admin/calendar/{type}/{id}/reschedule', [CalendarController::class, 'reschedule']);
```

---

## 9. Motion Effects / Système d'animations

**Référence** : Elementor (Motion Effects), Wix (animations), Squarespace (block animations), Shopify
**Présent dans** : 4/10 CMS

> Animations configurables par bloc via le panneau de propriétés.

### Extension du BlockNode

```jsonc
{
    "type": "heading",
    "props": { "text": "Bienvenue" },
    "styles": { /* ... */ },
    "animation": {                              // NOUVEAU
        "entrance": {
            "type": "fade-in-up",               // fade-in, fade-in-up, fade-in-down, fade-in-left, fade-in-right, zoom-in, slide-in-left, slide-in-right, bounce, flip
            "duration": 600,                     // ms
            "delay": 0,                          // ms
            "easing": "ease-out",                // ease, ease-in, ease-out, ease-in-out, linear
            "once": true                         // Jouer une seule fois ou à chaque apparition
        },
        "hover": {
            "type": "scale",                     // scale, shadow, brightness, rotate, translate-y
            "value": 1.05,                       // Valeur de l'effet
            "duration": 300
        },
        "scroll": {
            "type": "parallax",                  // parallax, fade, rotate, scale
            "speed": 0.5,                        // Facteur de vitesse (0.1 à 2)
            "direction": "vertical"              // vertical, horizontal
        }
    }
}
```

### AnimationRenderer (frontend)

```tsx
// Components/front/animated-block.tsx
// Utilise IntersectionObserver pour détecter l'entrée dans le viewport
// Applique les animations CSS dynamiquement
// Génère les keyframes CSS nécessaires
// Respecte prefers-reduced-motion (accessibilité)
```

### BlockSettings panel

```tsx
// Components/builder/animation-settings.tsx
// Onglet "Animation" dans le panneau de propriétés de chaque bloc
// - Section "Entrée" : type, durée, délai, easing, once
// - Section "Hover" : type, valeur, durée
// - Section "Scroll" : type, vitesse, direction
// - Bouton "Preview" pour tester l'animation dans le canvas
// - Bouton "Reset" pour supprimer toutes les animations
```

### CSS généré

```css
/* Animations générées dynamiquement */
@keyframes artisan-fade-in-up {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

/* Respect de l'accessibilité */
@media (prefers-reduced-motion: reduce) {
    [data-animation] {
        animation: none !important;
        transition: none !important;
    }
}
```

---

## 10. Pre-Publish Checklist

**Référence** : WordPress (pre-publish panel), Yoast SEO (checklist), Squarespace, Wix
**Présent dans** : 4/10 CMS

> Vérifications automatiques avant la publication d'une page ou d'un post.

### Architecture

```php
class PrePublishChecker
{
    // Exécuter toutes les vérifications
    public function check(Page|Post $content): PrePublishReport;

    // Vérifications intégrées :
    // ✅ Titre défini (non vide)
    // ✅ Slug défini
    // ✅ Contenu non vide (au moins 1 bloc)
    // ⚠️ Image à la une définie
    // ⚠️ Meta description SEO renseignée (si plugin SEO actif)
    // ⚠️ Alt text sur toutes les images du contenu
    // ⚠️ Longueur du contenu (min 300 mots recommandé pour les posts)
    // ⚠️ Au moins une catégorie assignée (pour les posts)
    // ⚠️ Liens internes cassés détectés
    // ℹ️ Score SEO (si plugin SEO actif)
    // ℹ️ Score de lisibilité

    // Les plugins peuvent ajouter leurs propres vérifications
}
```

```php
class PrePublishReport
{
    public array $errors;       // Bloquants (empêchent la publication)
    public array $warnings;     // Recommandations (non bloquants)
    public array $info;         // Informations
    public bool $canPublish;    // true si aucune erreur
}
```

### Composant React

```tsx
// Components/admin/pre-publish-checklist.tsx
// Affiché dans un panel/modal AVANT la publication (entre le clic "Publier" et la confirmation)
// - Liste des vérifications avec icônes ✅ ⚠️ ❌ ℹ️
// - Les erreurs sont en rouge et bloquent (bouton Publier désactivé)
// - Les warnings sont en orange (bouton Publier actif, avec avertissement)
// - Bouton "Publier quand même" pour ignorer les warnings
// - Lien "Corriger" sur chaque item pour scroller vers le champ concerné
```

### Hooks

```php
CMS::filter('pre_publish.checks', $checks, $content);         // Ajouter des vérifications
CMS::filter('pre_publish.required_checks', $required);          // Marquer certains checks comme bloquants
CMS::hook('pre_publish.checked', fn($content, $report) => ...);
```

---

## 11. Copy-Paste from Word / Google Docs

**Référence** : WordPress Gutenberg, Joomla TinyMCE, Drupal CKEditor, Ghost, Wix
**Présent dans** : 5/10 CMS

> Coller du contenu riche depuis Word/Docs et le convertir automatiquement en blocs CMS.

### Architecture

```tsx
// hooks/use-paste-handler.ts
function usePasteHandler() {
    // Intercepter l'événement paste dans le canvas du builder
    // 1. Détecter le type de contenu collé (text/html, text/plain, text/rtf)
    // 2. Si HTML :
    //    a. Nettoyer le HTML Microsoft (mso-* styles, <o:p>, conditional comments)
    //    b. Nettoyer le HTML Google Docs (spans avec styles inline)
    //    c. Normaliser : <b> → <strong>, <i> → <em>, etc.
    //    d. Convertir en blocs CMS :
    //       - <h1-h6> → bloc heading
    //       - <p> → bloc paragraph
    //       - <ul>/<ol> → bloc list
    //       - <table> → bloc table
    //       - <img> → bloc image (upload l'image si externe)
    //       - <blockquote> → bloc blockquote
    //       - <pre><code> → bloc code
    //       - <a> → lien inline dans le bloc parent
    //    e. Insérer les blocs à la position du curseur
    // 3. Si texte brut :
    //    a. Séparer par doubles sauts de ligne → paragraphes
    //    b. Créer un bloc paragraph par section
}
```

### HtmlToBlocksConverter

```tsx
// lib/html-to-blocks.ts
class HtmlToBlocksConverter {
    // Nettoyer le HTML brut
    sanitize(html: string): string;

    // Convertir le HTML nettoyé en arbre de blocs
    convert(html: string): BlockNode[];

    // Patterns de nettoyage
    private cleanWordHtml(html: string): string;
    private cleanGoogleDocsHtml(html: string): string;
    private normalizeHtml(html: string): string;
}
```

---

## 12. User Session Management / Force Logout

**Référence** : WordPress, Joomla, Drupal, Shopify, Magento
**Présent dans** : 5/10 CMS

### Table : user_sessions

```php
Schema::create('cms_user_sessions', function (Blueprint $table) {
    $table->string('id')->primary();                // Session ID
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->string('ip_address', 45)->nullable();
    $table->string('user_agent')->nullable();
    $table->string('device_type')->nullable();       // desktop, mobile, tablet
    $table->string('browser')->nullable();           // Chrome, Firefox, Safari...
    $table->string('os')->nullable();                // Windows, macOS, Linux, iOS, Android
    $table->string('location')->nullable();          // Ville, Pays (optionnel, via IP)
    $table->boolean('is_current')->default(false);   // Session courante
    $table->timestamp('last_activity_at');
    $table->timestamp('created_at');

    $table->index(['user_id', 'last_activity_at']);
});
```

### SessionManagementService

```php
class SessionManagementService
{
    // Lister les sessions actives d'un utilisateur
    public function getActiveSessions(User $user): Collection;

    // Révoquer une session spécifique
    public function revokeSession(string $sessionId): void;

    // Révoquer toutes les sessions sauf la courante
    public function revokeOtherSessions(User $user, string $currentSessionId): int;

    // Révoquer toutes les sessions d'un utilisateur (admin action)
    public function revokeAllSessions(User $user): int;

    // Enregistrer/mettre à jour une session (appelé par middleware)
    public function touchSession(Request $request, User $user): void;

    // Parser le user agent
    public function parseUserAgent(string $userAgent): array;

    // Nettoyer les sessions expirées
    public function cleanExpired(int $lifetimeMinutes = 120): int;
}
```

### UI

```tsx
// Pages/Admin/Users/Sessions.tsx (admin voit les sessions de tous les users)
// Pages/Profile/Sessions.tsx (user voit ses propres sessions)
// - Liste : device, browser, OS, IP, dernière activité, "Session courante" badge
// - Bouton "Déconnecter" par session
// - Bouton "Déconnecter toutes les autres sessions"
// - Bouton "Déconnecter cet utilisateur" (admin uniquement)
```

---

## 13. Scheduled Tasks API pour Plugins

**Référence** : WordPress (WP-Cron API), Joomla (Task Scheduler), Drupal (Queue API + cron), Magento (Cron system), Strapi (cron config)
**Présent dans** : 5/10 CMS

> API permettant aux plugins d'enregistrer leurs propres tâches planifiées.

### ScheduledTaskRegistry

```php
class ScheduledTaskRegistry
{
    // Enregistrer une tâche planifiée (appelé dans le boot() du Service Provider du plugin)
    public function register(string $name, string $schedule, callable $callback, array $options = []): void;
    // $schedule : expression cron ('*/5 * * * *') ou shortcut ('hourly', 'daily', 'weekly')
    // $options : ['description' => '...', 'withoutOverlapping' => true, 'onOneServer' => false]

    // Désinscrire une tâche
    public function unregister(string $name): void;

    // Lister toutes les tâches enregistrées
    public function all(): array;

    // Exécuter manuellement une tâche (admin)
    public function runNow(string $name): TaskResult;

    // Vérifier le statut d'une tâche
    public function getStatus(string $name): array;
}
```

### Intégration dans le Kernel de Laravel

```php
// app/Console/Kernel.php
protected function schedule(Schedule $schedule): void
{
    // Charger les tâches enregistrées par les plugins
    $tasks = app(ScheduledTaskRegistry::class)->all();
    foreach ($tasks as $task) {
        $event = $schedule->call($task['callback'])
            ->cron($task['schedule'])
            ->name($task['name']);

        if ($task['options']['withoutOverlapping'] ?? false) {
            $event->withoutOverlapping();
        }
    }
}
```

### Exemple d'utilisation dans un plugin

```php
// content/plugins/newsletter/src/NewsletterServiceProvider.php
public function boot(): void
{
    app(ScheduledTaskRegistry::class)->register(
        name: 'newsletter.send_scheduled',
        schedule: 'daily',
        callback: fn() => app(NewsletterService::class)->sendScheduled(),
        options: [
            'description' => 'Envoyer les newsletters planifiées',
            'withoutOverlapping' => true,
        ]
    );
}
```

---

## 14. Media Usage Tracking

**Référence** : Drupal (natif), Strapi (natif), WordPress (plugins), Magento
**Présent dans** : 4/10 CMS

### Table : media_usages

```php
Schema::create('cms_media_usages', function (Blueprint $table) {
    $table->id();
    $table->foreignId('media_id')->constrained('media')->cascadeOnDelete();
    $table->morphs('usable');       // usable_type (Page, Post, Block, MenuItem, Setting) + usable_id
    $table->string('field');        // Nom du champ (featured_image, content, avatar, logo...)
    $table->timestamps();

    $table->unique(['media_id', 'usable_type', 'usable_id', 'field']);
    $table->index('media_id');
});
```

### MediaUsageService

```php
class MediaUsageService
{
    // Scanner le contenu d'une page/post pour trouver les médias référencés
    public function scanContent(Model $entity): array;

    // Mettre à jour les usages quand un contenu est sauvegardé
    public function syncUsages(Model $entity): void;

    // Trouver toutes les entités qui utilisent un média
    public function findUsages(Media $media): Collection;

    // Vérifier si un média est utilisé quelque part
    public function isUsed(Media $media): bool;

    // Trouver les médias orphelins (non utilisés nulle part)
    public function findOrphans(): Collection;

    // Supprimer les usages pour une entité (quand elle est supprimée)
    public function clearUsages(Model $entity): void;

    // Scanner tous les contenus pour reconstruire la table (commande artisan)
    public function rebuildAll(): int;
}
```

### Intégration

```php
// Dans PageObserver et PostObserver :
// Après chaque sauvegarde → $mediaUsageService->syncUsages($page);

// Dans MediaController@destroy :
// Avant suppression → vérifier si le média est utilisé
// Si utilisé → demander confirmation avec la liste des entités
```

### Commande Artisan

```bash
php artisan cms:media:scan-usages   # Reconstruire la table des usages
php artisan cms:media:orphans       # Lister les médias orphelins
```

---

## 15. Configuration Export/Import entre environnements

**Référence** : Drupal (Config Management), Strapi (config sync), Magento, WordPress (Customizer export)
**Présent dans** : 4/10 CMS

### ConfigSyncService

```php
class ConfigSyncService
{
    // Exporter la configuration complète
    public function export(): array;
    // Exporte : settings, roles+permissions, menu structures, theme config, plugin states,
    //           content type definitions, custom field groups, widget areas, redirects, design tokens

    // Exporter en fichier JSON
    public function exportToFile(): string;

    // Importer depuis un fichier JSON
    public function importFromFile(string $path, array $options = []): ImportResult;
    // Options : ['overwrite' => true, 'skip_existing' => false, 'sections' => ['settings', 'roles']]

    // Comparer la config actuelle avec un export
    public function diff(array $exportedConfig): array;
    // Retourne les différences : added, modified, removed

    // Export/import sélectif par section
    public function exportSection(string $section): array;
    public function importSection(string $section, array $data): void;

    // Sections disponibles
    public function getSections(): array;
    // ['settings', 'roles', 'menus', 'theme', 'plugins', 'content_types', 'custom_fields',
    //  'widget_areas', 'redirects', 'design_tokens', 'email_templates']
}
```

### Commandes Artisan

```bash
php artisan cms:config:export                      # Export complet → storage/config-export.json
php artisan cms:config:export --section=settings    # Export partiel
php artisan cms:config:import config-export.json    # Import
php artisan cms:config:diff config-export.json      # Comparer sans importer
```

### UI Admin

```tsx
// Pages/Admin/Settings/ConfigSync.tsx
// - Bouton "Exporter la configuration" → télécharge un JSON
// - Bouton "Importer" → upload un JSON + preview des changements (diff)
// - Checkboxes pour sélectionner les sections à exporter/importer
// - Preview avant import : liste des éléments ajoutés/modifiés/supprimés
// - Bouton "Appliquer" après review
```

---

## 16. oEmbed Auto-Discovery / Rich URL Previews

**Référence** : WordPress (30+ providers), Ghost (Bookmark Card), Drupal, Wix, Squarespace
**Présent dans** : 5/10 CMS

### OEmbedService

```php
class OEmbedService
{
    // Providers enregistrés (YouTube, Vimeo, Twitter/X, Instagram, Spotify, CodePen, etc.)
    private array $providers = [];

    // Résoudre une URL en données oEmbed
    public function resolve(string $url): ?OEmbedData;
    // Retourne : { type, title, description, thumbnail, html, provider_name, provider_url, author_name }
    // Cache le résultat (24h)

    // Vérifier si une URL est supportée
    public function supports(string $url): bool;

    // Enregistrer un provider custom
    public function registerProvider(string $pattern, string $endpoint): void;

    // Providers intégrés
    public function getProviders(): array;
}
```

### Bloc embed amélioré

```jsonc
{
    "type": "embed",
    "props": {
        "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "oembed": {                             // Données résolues automatiquement
            "type": "video",
            "title": "Rick Astley - Never Gonna Give You Up",
            "thumbnail": "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
            "html": "<iframe ...></iframe>",
            "provider_name": "YouTube"
        },
        "maxWidth": "100%",
        "aspectRatio": "16:9"
    }
}
```

### Dans le Page Builder

```tsx
// Quand un utilisateur colle une URL dans le canvas :
// 1. Détecter si c'est une URL oEmbed supportée
// 2. Si oui → créer automatiquement un bloc "embed" avec les données résolues
// 3. Afficher la preview (thumbnail + titre + provider)
// 4. Si non supporté → créer un bloc "bookmark" (titre + description + favicon)
//
// Le bloc "embed" affiche le contenu riche (iframe YouTube, tweet, etc.)
// Le bloc "bookmark" affiche un lien enrichi (comme Ghost Bookmark Card)
```

### API

```
POST /api/builder/oembed/resolve    Body: { url: "..." }
→ { type, title, description, thumbnail, html, provider_name }
```

### Hooks

```php
CMS::filter('oembed.providers', $providers);          // Ajouter des providers
CMS::filter('oembed.resolved', $data, $url);          // Modifier les données résolues
```

---

## 17. Drag-and-Drop Reordering dans les galeries

**Référence** : WordPress, Elementor, Wix, Squarespace, Shopify, Drupal
**Présent dans** : 6/10 CMS

### Amélioration du bloc gallery

```tsx
// Components/builder/blocks/gallery-settings.tsx
// Ajout de dnd-kit pour réordonner les images dans les settings du bloc gallery :
// - useSortable() sur chaque image dans la grille de settings
// - DragOverlay avec preview de l'image déplacée
// - Bouton "Ajouter des images" ouvre le media picker
// - Bouton ✕ sur chaque image pour la retirer
// - Champ alt text éditable sous chaque image
// - Indicateur de position (1/6, 2/6, etc.)
```

### Structure bloc améliorée

```jsonc
{
    "type": "gallery",
    "props": {
        "images": [
            { "mediaId": 42, "src": "/storage/...", "alt": "Photo 1", "caption": "Légende", "order": 0 },
            { "mediaId": 43, "src": "/storage/...", "alt": "Photo 2", "caption": "", "order": 1 }
        ],
        "layout": "grid",           // grid, masonry, carousel, lightbox
        "columns": 3,
        "gap": "1rem",
        "lightbox": true
    }
}
```

---

## 18. Shape Dividers / Séparateurs de sections (SVG)

**Référence** : Elementor (20+ formes), Wix, Squarespace, Shopify
**Présent dans** : 4/10 CMS

### Extension du bloc section

```jsonc
{
    "type": "section",
    "props": {
        "/* ... props existantes ... */": "",
        "dividerTop": {
            "shape": "wave",            // wave, tilt, triangle, zigzag, arrow, curve, mountains, clouds, drops, none
            "color": "$background",     // Token ou hex
            "height": 80,              // px
            "flip": false,             // Inverser horizontalement
            "invert": false            // Inverser verticalement
        },
        "dividerBottom": {
            "shape": "curve",
            "color": "#F3F4F6",
            "height": 60,
            "flip": false,
            "invert": false
        }
    }
}
```

### Composant SVG

```tsx
// Components/front/shape-divider.tsx
// - 10 formes SVG embarquées (pas de dépendance externe)
// - Rendu en position absolute top/bottom de la section
// - Couleur dynamique via fill
// - Responsive (viewBox 100%)
// - Les SVGs sont définis en inline (pas d'appel réseau)
```

### Settings panel

```tsx
// Components/builder/blocks/section-divider-settings.tsx
// - Preview visuelle de chaque forme (grille de sélection)
// - Color picker (avec tokens)
// - Slider hauteur (20px - 200px)
// - Toggles flip / invert
// - Séparateur haut et bas indépendants
```

---

## 19. Copy/Paste Styles entre éléments

**Référence** : Elementor, Wix, Squarespace
**Présent dans** : 3/10 CMS

### Implémentation dans le Builder Store

```tsx
// stores/builder-store.ts — ajout au store existant
interface BuilderState {
    // ... état existant ...
    copiedStyles: Record<string, any> | null;   // Styles copiés en mémoire
}

// Actions
copyStyles(blockId: string): void;              // Ctrl+Alt+C
pasteStyles(blockId: string): void;             // Ctrl+Alt+V

// La copie ne prend que les propriétés visuelles :
// backgroundColor, textColor, fontSize, fontFamily, fontWeight,
// padding, margin, borderRadius, border, shadow, opacity, etc.
// PAS le contenu (text, src, url, etc.)
```

### UI

```tsx
// Menu contextuel (clic droit sur un bloc) :
// - "Copier les styles" (Ctrl+Alt+C)
// - "Coller les styles" (Ctrl+Alt+V) — grisé si aucun style copié
// Feedback visuel : toast "Styles copiés" / "Styles appliqués"
```

---

## 20. Content Import depuis autres CMS (au-delà de WordPress)

**Référence** : WordPress (10+ importers), Ghost (5+ importers), Drupal (modules migration), Strapi
**Présent dans** : 4/10 CMS

> Blueprint 28 couvre l'import WordPress. Ici on ajoute les autres plateformes.

### ImporterRegistry

```php
class ImporterRegistry
{
    // Enregistrer un importer
    public function register(string $platform, ContentImporter $importer): void;

    // Importers disponibles
    public function getAvailable(): array;

    // Exécuter un import
    public function import(string $platform, UploadedFile $file, array $options = []): ImportResult;
}
```

### Importers additionnels

```php
// Chaque importer implémente ContentImporter :
interface ContentImporter
{
    public function getLabel(): string;          // "Ghost", "Joomla", etc.
    public function getSupportedFormats(): array; // ['json'], ['xml'], ['csv']
    public function validate(UploadedFile $file): bool;
    public function import(UploadedFile $file, array $options = []): ImportResult;
    public function getFieldMapping(): array;    // Mapping champs source → ArtisanCMS
}

// Importers :
class GhostImporter implements ContentImporter     // Ghost JSON export
class JoomlaImporter implements ContentImporter     // Joomla XML export (com_content)
class MediumImporter implements ContentImporter     // Medium HTML export (zip)
class SubstackImporter implements ContentImporter   // Substack CSV export
class BloggerImporter implements ContentImporter    // Blogger XML (Atom)
class MarkdownImporter implements ContentImporter   // Dossier de fichiers Markdown (Hugo, Jekyll, 11ty)
```

### UI

```tsx
// Pages/Admin/ImportExport/Import.tsx
// - Dropdown : sélection de la plateforme source
// - Zone d'upload du fichier d'export
// - Preview : nombre de posts, pages, médias, catégories détectés
// - Mapping des champs (optionnel, pré-rempli)
// - Options : importer les médias, importer les catégories, statut par défaut (draft/published)
// - Progress bar pendant l'import
// - Rapport final : X importés, Y ignorés, Z erreurs
```

---

## 21. Announcement Bar / Bannière site-wide

**Référence** : Ghost (announcement bar), Shopify (themes), Wix, Squarespace
**Présent dans** : 4/10 CMS

> Différent du Popup Builder (blueprint 29 item 6) qui gère les modals overlay. L'announcement bar est une barre persistante top/bottom.

### Table : announcement_bars

```php
Schema::create('cms_announcement_bars', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->text('content');                          // HTML simple (texte + lien)
    $table->string('background_color')->default('#3B82F6');
    $table->string('text_color')->default('#FFFFFF');
    $table->string('link_url')->nullable();
    $table->string('link_text')->nullable();
    $table->enum('position', ['top', 'bottom'])->default('top');
    $table->boolean('dismissible')->default(true);     // L'utilisateur peut fermer
    $table->enum('visibility', ['all', 'logged_in', 'logged_out'])->default('all');
    $table->boolean('is_active')->default(false);
    $table->timestamp('starts_at')->nullable();        // Planification
    $table->timestamp('ends_at')->nullable();
    $table->foreignId('site_id')->nullable()->constrained()->cascadeOnDelete();
    $table->timestamps();

    $table->index(['is_active', 'site_id']);
});
```

### AnnouncementBarService

```php
class AnnouncementBarService
{
    // Récupérer la barre active (avec cache)
    public function getActive(): ?AnnouncementBar;

    // CRUD
    public function create(array $data): AnnouncementBar;
    public function update(AnnouncementBar $bar, array $data): AnnouncementBar;
    public function delete(AnnouncementBar $bar): void;

    // Activer/désactiver (un seul actif à la fois)
    public function activate(AnnouncementBar $bar): void;
    public function deactivate(AnnouncementBar $bar): void;
}
```

### Composant Frontend

```tsx
// Components/front/announcement-bar.tsx
// - Barre fixe en haut/bas du site
// - Texte + lien optionnel
// - Bouton ✕ pour fermer (si dismissible)
// - Cookie pour mémoriser le dismiss (24h)
// - Animation slide-in à l'apparition
// - Responsive (texte tronqué sur mobile si trop long)
```

---

## 22. Fullscreen / Distraction-Free Editing Mode

**Référence** : WordPress Gutenberg (fullscreen + spotlight), Ghost (focus mode), Wix, Squarespace
**Présent dans** : 4/10 CMS

### Implémentation dans le Builder

```tsx
// Dans le Builder Store :
interface BuilderState {
    // ... état existant ...
    isFullscreen: boolean;
    isSpotlightMode: boolean;     // Dimmer les blocs non sélectionnés
}

// Actions
toggleFullscreen(): void;          // F11 ou bouton
toggleSpotlightMode(): void;       // Ctrl+Shift+F

// Mode fullscreen :
// - Masque la sidebar admin (navigation)
// - Masque le header admin
// - Le builder prend 100% de l'écran
// - Toolbar builder flottante en haut
// - Sidebar propriétés en overlay (slide-in depuis la droite)
// - Bouton "Quitter le plein écran" ou Escape

// Mode spotlight :
// - Les blocs non sélectionnés sont à 30% d'opacité
// - Le bloc sélectionné est à 100%
// - Aide à se concentrer sur un bloc spécifique
```

### Boutons toolbar

```tsx
// Dans builder-toolbar.tsx, ajouter :
// - Icône plein écran (Maximize2 de lucide-react)
// - Icône spotlight (Focus de lucide-react)
// - Raccourcis clavier affichés au hover
```

---

## Intégration dans les phases d'implémentation

| Feature | Phase recommandée |
|---------|------------------|
| 1. Global Styles / Design Tokens | Phase 4 (Thèmes) |
| 2. Dynamic Content Binding | Phase 3 (Builder) |
| 3. Search Autocomplete | Phase 2 (Contenu) |
| 4. Error Recovery Mode | Phase 1 (Fondations) |
| 5. Block Patterns | Phase 3 (Builder) |
| 6. Command Palette | Phase 2 (Contenu) |
| 7. Block Transforms | Phase 3 (Builder) |
| 8. Editorial Calendar | Phase 2 (Contenu) |
| 9. Animations | Phase 3 (Builder) |
| 10. Pre-Publish Checklist | Phase 2 (Contenu) |
| 11. Paste from Word/Docs | Phase 3 (Builder) |
| 12. Session Management | Phase 1 (Fondations) |
| 13. Scheduled Tasks API | Phase 4 (Plugins) |
| 14. Media Usage Tracking | Phase 2 (Contenu) |
| 15. Config Export/Import | Phase 4 (Thèmes & Plugins) |
| 16. oEmbed | Phase 3 (Builder) |
| 17. Gallery Reorder | Phase 3 (Builder) |
| 18. Shape Dividers | Phase 3 (Builder) |
| 19. Copy/Paste Styles | Phase 3 (Builder) |
| 20. Import Multi-CMS | Phase 7 (CLI & Marketplace) |
| 21. Announcement Bar | Phase 2 (Contenu) |
| 22. Fullscreen Editing | Phase 3 (Builder) |

---

## Récapitulatif par phase

### Phase 1 (Fondations)
- #4 Error Recovery Mode
- #12 Session Management

### Phase 2 (Contenu)
- #3 Search Autocomplete
- #6 Command Palette
- #8 Editorial Calendar
- #10 Pre-Publish Checklist
- #14 Media Usage Tracking
- #21 Announcement Bar

### Phase 3 (Builder)
- #2 Dynamic Content Binding
- #5 Block Patterns
- #7 Block Transforms
- #9 Animations
- #11 Paste from Word/Docs
- #16 oEmbed
- #17 Gallery Reorder
- #18 Shape Dividers
- #19 Copy/Paste Styles
- #22 Fullscreen Editing

### Phase 4 (Thèmes & Plugins)
- #1 Global Styles / Design Tokens
- #13 Scheduled Tasks API
- #15 Config Export/Import

### Phase 7 (CLI & Marketplace)
- #20 Import Multi-CMS
