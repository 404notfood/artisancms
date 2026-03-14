# Blueprint 29 - Fonctionnalités Admin & Builder avancées

Ce document couvre 19 fonctionnalités identifiées comme manquantes pour l'expérience admin, la gestion avancée des médias, le système de mises à jour, et les outils développeur intégrés.

---

## Priorités

| Priorité | Fonctionnalités |
|----------|----------------|
| **CRITIQUE** | 1 (système de mises à jour) |
| **HAUTE** | 2-5 (dashboard admin, médias avancés, rôles custom UI, onboarding) |
| **MOYENNE** | 6-13 (popup builder, mega menus, TOC, scheduler UI, queue UI, perf monitoring, migration données, lazy loading admin) |
| **BASSE** | 14-19 (log viewer, health check, sticky elements, aide contextuelle, error boundary global, preview avancée) |

---

## 1. Système de mises à jour (CMS, plugins, thèmes)

**Référence** : WordPress (natif), Joomla (natif), Drupal (natif)

> C'est LE point critique. Sans système de mises à jour, chaque site déployé reste figé sur sa version.

### Architecture

```
                    ┌─────────────────────┐
                    │  ArtisanCMS Registry │
                    │  (registry.artisan  │
                    │   cms.io/api)       │
                    └─────────┬───────────┘
                              │ HTTPS
                    ┌─────────▼───────────┐
                    │  UpdateService       │
                    │  (check + download)  │
                    └─────────┬───────────┘
                              │
            ┌─────────────────┼─────────────────┐
            │                 │                 │
    ┌───────▼──────┐  ┌──────▼───────┐  ┌──────▼───────┐
    │ CMS Core     │  │ Plugins      │  │ Themes       │
    │ update       │  │ updates      │  │ updates      │
    └──────────────┘  └──────────────┘  └──────────────┘
```

### Table : update_log

```php
Schema::create('update_log', function (Blueprint $table) {
    $table->id();
    $table->enum('type', ['cms', 'plugin', 'theme']);
    $table->string('slug');                         // 'core', 'seo-plugin', 'starter-theme'
    $table->string('from_version');
    $table->string('to_version');
    $table->enum('status', ['pending', 'downloading', 'installing', 'completed', 'failed', 'rolled_back']);
    $table->text('error_message')->nullable();
    $table->string('backup_path')->nullable();      // Chemin du backup pre-update
    $table->foreignId('initiated_by')->nullable()->constrained('users')->nullOnDelete();
    $table->timestamps();
});
```

### UpdateService

```php
class UpdateService
{
    // === Vérification ===

    // Vérifier les mises à jour disponibles (cache 12h)
    public function checkForUpdates(): UpdateCheckResult;

    // Vérifier le CMS core
    public function checkCoreUpdate(): ?VersionInfo;

    // Vérifier les plugins
    public function checkPluginUpdates(): Collection;  // [{slug, current, latest, changelog}]

    // Vérifier les thèmes
    public function checkThemeUpdates(): Collection;

    // === Installation ===

    // Mettre à jour le CMS core
    public function updateCore(): UpdateResult;

    // Mettre à jour un plugin
    public function updatePlugin(string $slug): UpdateResult;

    // Mettre à jour un thème
    public function updateTheme(string $slug): UpdateResult;

    // Tout mettre à jour
    public function updateAll(): array;  // [UpdateResult, ...]

    // === Sécurité ===

    // Backup automatique avant update
    private function backupBeforeUpdate(string $type, string $slug): string;

    // Rollback en cas d'erreur
    public function rollback(int $updateLogId): bool;

    // Vérifier l'intégrité du package (checksum SHA-256)
    private function verifyPackage(string $path, string $expectedHash): bool;

    // === Registry ===

    // Ping le registry pour les versions
    private function fetchFromRegistry(string $endpoint): array;

    // URL du registry (configurable, default: registry.artisancms.io)
    private function getRegistryUrl(): string;
}
```

### UpdateCheckResult

```php
class UpdateCheckResult
{
    public ?VersionInfo $core;           // null si à jour
    public Collection $plugins;          // Plugins avec mise à jour dispo
    public Collection $themes;           // Thèmes avec mise à jour dispo
    public int $totalUpdates;            // Nombre total de mises à jour
    public Carbon $checkedAt;
}

class VersionInfo
{
    public string $currentVersion;
    public string $latestVersion;
    public string $changelog;            // Markdown
    public string $downloadUrl;
    public string $checksum;             // SHA-256
    public string $minPhpVersion;
    public string $minLaravelVersion;
    public Carbon $releasedAt;
    public bool $isSecurityUpdate;
}
```

### Flow de mise à jour

```
1. Vérification des prérequis (PHP version, espace disque, permissions)
2. Backup automatique (DB + fichiers concernés)
3. Téléchargement du package (ZIP)
4. Vérification checksum (SHA-256)
5. Mode maintenance activé automatiquement
6. Extraction et remplacement des fichiers
7. Exécution des migrations (si CMS core ou plugin)
8. Nettoyage des caches
9. Vérification de santé post-update
10. Mode maintenance désactivé
11. Log de la mise à jour
12. Notification admin (succès ou échec)
```

### Rollback automatique

```php
// Si l'étape 9 (health check) échoue :
// 1. Restaurer les fichiers depuis le backup
// 2. Rollback des migrations
// 3. Restaurer le cache
// 4. Désactiver le mode maintenance
// 5. Notifier l'admin de l'échec + raison
```

### Settings (groupe `updates`)

```php
'updates.auto_check'           => true,            // Vérifier automatiquement
'updates.check_interval'       => 43200,           // Toutes les 12h (secondes)
'updates.auto_update_minor'    => false,            // Auto-update patches/mineurs
'updates.auto_backup'          => true,             // Backup avant chaque update
'updates.registry_url'         => 'https://registry.artisancms.io/api',
'updates.notify_admin'         => true,             // Email quand update dispo
'updates.channel'              => 'stable',         // stable | beta
```

### UI Admin

```
/admin/updates
├── Badge dans le menu latéral : "3 mises à jour"
├── Section CMS Core (version actuelle, version dispo, changelog, bouton "Mettre à jour")
├── Section Plugins (liste avec version actuelle/dispo, checkbox multi-select, "Tout mettre à jour")
├── Section Thèmes (idem)
├── Historique des mises à jour (log)
└── Bouton "Vérifier maintenant"
```

### Commandes CLI

```bash
php artisan cms:update:check                    # Vérifier les mises à jour
php artisan cms:update:core                     # Mettre à jour le CMS
php artisan cms:update:plugin {slug}            # Mettre à jour un plugin
php artisan cms:update:theme {slug}             # Mettre à jour un thème
php artisan cms:update:all                      # Tout mettre à jour
php artisan cms:update:rollback {log_id}        # Rollback une mise à jour
```

### Notifications

```php
// Notification in-app + email quand :
// - Mise à jour de sécurité disponible (priorité haute)
// - Nouvelle version majeure disponible
// - Mise à jour réussie / échouée
```

### Mode hors-ligne (sans registry)

```php
// Pour les installations sans accès internet :
// - Upload manuel d'un fichier ZIP via l'admin
// - Commande CLI : php artisan cms:update:install /path/to/package.zip
// - Vérification checksum si fourni
```

---

## 2. Dashboard Admin complet

**Référence** : WordPress (natif), Joomla (natif), tous les CMS

### Layout du dashboard

```
┌──────────────────────────────────────────────────────────────┐
│  Bienvenue, Laurent !                    [Personnaliser]     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─── En un coup d'oeil ──┐  ┌─── Activité récente ───────┐ │
│  │ 12 Pages               │  │ • Laurent a publié "Accueil"│ │
│  │ 28 Articles             │  │   il y a 5 min              │ │
│  │ 156 Médias              │  │ • Marie a créé "Contact"    │ │
│  │ 3 Commentaires en att.  │  │   il y a 1h                 │ │
│  │ 2 Formulaires soumis    │  │ • Nouveau commentaire sur   │ │
│  │ 1 Mise à jour dispo.    │  │   "Mon article"             │ │
│  └─────────────────────────┘  └─────────────────────────────┘ │
│                                                              │
│  ┌─── Trafic (7 derniers jours) ───────────────────────────┐ │
│  │  📈 Graphique recharts (area chart)                      │ │
│  │  Vues: 1,234  |  Visiteurs: 456  |  Pages/session: 2.7  │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌─── Brouillons ──────────┐  ┌─── Actions rapides ────────┐ │
│  │ ✏️ Ma page en cours      │  │ [+ Nouvelle page]          │ │
│  │ ✏️ Article brouillon     │  │ [+ Nouvel article]         │ │
│  │ ✏️ Landing page test     │  │ [📁 Ajouter un média]      │ │
│  └─────────────────────────┘  │ [⚙️ Paramètres]             │ │
│                               └─────────────────────────────┘ │
│                                                              │
│  ┌─── Pages populaires ────┐  ┌─── Alertes système ────────┐ │
│  │ 1. /accueil (523 vues)  │  │ ⚠️ 1 mise à jour dispo.    │ │
│  │ 2. /contact (234 vues)  │  │ ⚠️ Backup > 7 jours        │ │
│  │ 3. /blog (189 vues)     │  │ ✅ PHP 8.3 OK              │ │
│  └─────────────────────────┘  └─────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### Widgets disponibles

| Widget | Données | Rôles |
|--------|---------|-------|
| `at-a-glance` | Compteurs pages, posts, médias, commentaires, formulaires, mises à jour | Tous |
| `recent-activity` | Dernières actions (activity_log) | Admin, Editor |
| `traffic-chart` | Graphique vues/visiteurs (recharts AreaChart) | Admin |
| `my-drafts` | Brouillons de l'utilisateur connecté | Tous |
| `quick-actions` | Boutons raccourcis (créer page, article, média) | Tous |
| `popular-pages` | Top pages par vues (analytics) | Admin |
| `system-alerts` | Mises à jour, backup, santé système | Admin |
| `recent-comments` | Derniers commentaires en attente | Admin, Editor |
| `recent-form-submissions` | Dernières soumissions de formulaires | Admin |

### Personnalisation du dashboard

```php
// Sauvegardé dans users.preferences JSON
'dashboard' => [
    'layout' => [
        ['at-a-glance', 'recent-activity'],        // Ligne 1 (2 colonnes)
        ['traffic-chart'],                          // Ligne 2 (pleine largeur)
        ['my-drafts', 'quick-actions'],             // Ligne 3
        ['popular-pages', 'system-alerts'],         // Ligne 4
    ],
    'collapsed' => ['system-alerts'],              // Widgets repliés
    'hidden' => [],                                 // Widgets masqués
]
```

### DashboardService

```php
class DashboardService
{
    // Récupérer les données de tous les widgets pour un utilisateur
    public function getWidgetsData(User $user): array;

    // Widget "En un coup d'oeil"
    public function getAtAGlance(): array;

    // Widget "Activité récente"
    public function getRecentActivity(int $limit = 10): Collection;

    // Widget "Trafic"
    public function getTrafficStats(int $days = 7): array;

    // Widget "Mes brouillons"
    public function getMyDrafts(User $user, int $limit = 5): Collection;

    // Widget "Alertes système"
    public function getSystemAlerts(): array;

    // Sauvegarder la disposition
    public function saveLayout(User $user, array $layout): void;
}
```

### Hooks pour les plugins

```php
// Les plugins peuvent ajouter des widgets au dashboard
CMS::filter('dashboard_widgets', function (array $widgets) {
    $widgets[] = [
        'id' => 'ecommerce-revenue',
        'title' => 'Revenus',
        'component' => 'EcommerceRevenueWidget',
        'roles' => ['admin'],
        'position' => 'after:traffic-chart',
    ];
    return $widgets;
});
```

---

## 3. Gestion des médias avancée

**Référence** : WordPress (Media Library), Wix (Media Manager)

### 3a. Gestion des dossiers

```php
// Dossiers virtuels (pas de dossiers physiques sur le disque)
// Colonne `folder` sur la table media (déjà existante)

class MediaFolderService
{
    // Lister les dossiers (arborescence)
    public function getFolderTree(): array;

    // Créer un dossier
    public function createFolder(string $path): void;

    // Renommer un dossier (met à jour tous les médias dedans)
    public function renameFolder(string $oldPath, string $newPath): int;

    // Supprimer un dossier (déplace les médias vers /)
    public function deleteFolder(string $path): int;

    // Déplacer des médias vers un dossier
    public function moveToFolder(array $mediaIds, string $folder): int;

    // Compter les médias par dossier
    public function countByFolder(): array;
}
```

### 3b. Remplacement de fichier

```php
class MediaService
{
    // Remplacer un fichier existant (garde le même ID et les mêmes références)
    public function replace(Media $media, UploadedFile $newFile): Media
    {
        // 1. Supprimer l'ancien fichier + thumbnails
        // 2. Stocker le nouveau fichier au même emplacement
        // 3. Régénérer les thumbnails
        // 4. Mettre à jour metadata (dimensions, taille, mime)
        // 5. Invalider le cache des pages qui utilisent ce média
        // 6. Logger l'action (activity log)
    }
}
```

### 3c. Détection de médias orphelins

```php
class OrphanMediaDetector
{
    // Scanner les pages, posts, settings pour trouver les médias non référencés
    public function findOrphans(): Collection;

    // Sources à scanner :
    // - pages.content JSON (chercher les IDs média dans les blocs image/gallery/video)
    // - posts.content JSON (idem)
    // - posts.featured_image
    // - settings (logo, favicon, og_image par défaut)
    // - pages.og_image
    // - users.avatar
    // - themes.customizations (background images)

    // Rapport : liste des médias non utilisés avec taille totale
    public function getOrphanReport(): array;

    // Nettoyage : supprimer les orphelins
    public function cleanOrphans(bool $dryRun = true): int;
}
```

### 3d. Intégration Unsplash/Pexels

```php
class StockPhotoService
{
    // Rechercher des photos sur Unsplash
    public function searchUnsplash(string $query, int $page = 1, int $perPage = 20): array;

    // Rechercher sur Pexels
    public function searchPexels(string $query, int $page = 1, int $perPage = 20): array;

    // Télécharger et importer dans la bibliothèque
    public function importFromUrl(string $url, string $attribution, string $folder = '/'): Media;
}
```

### Settings (groupe `media`)

```php
'media.unsplash_api_key'       => '',
'media.pexels_api_key'         => '',
'media.max_folder_depth'       => 5,
'media.orphan_cleanup_days'    => 30,              // Auto-cleanup après N jours
```

### 3e. Édition d'images in-admin

```tsx
// Éditeur d'images léger dans l'admin (pas juste à l'upload)
// Fonctions :
// - Crop (libre + ratios prédéfinis : 1:1, 16:9, 4:3, 3:2)
// - Rotation (90° gauche/droite)
// - Flip (horizontal/vertical)
// - Redimensionnement
// - Pas de filtres (hors scope)

// Utilise : react-image-crop (léger, pas de dépendance lourde)
// Le crop/rotate se fait côté front, le résultat est envoyé au backend
// Backend applique la transformation via Intervention Image
```

### API Endpoints (ajouts)

```
POST   /api/admin/media/folders              → Créer un dossier
PUT    /api/admin/media/folders              → Renommer un dossier
DELETE /api/admin/media/folders              → Supprimer un dossier
POST   /api/admin/media/move                 → Déplacer des médias
POST   /api/admin/media/{id}/replace         → Remplacer un fichier
POST   /api/admin/media/{id}/edit            → Appliquer crop/rotate
GET    /api/admin/media/orphans              → Lister les orphelins
DELETE /api/admin/media/orphans              → Nettoyer les orphelins
GET    /api/admin/media/stock/search         → Rechercher Unsplash/Pexels
POST   /api/admin/media/stock/import         → Importer depuis stock
```

---

## 4. Rôles custom et permissions via UI

**Référence** : WordPress (User Role Editor), Joomla (ACL natif avancé)

### UI : Page de gestion des rôles

```
/admin/settings/roles
├── Liste des rôles (Admin ⭐, Editor, Author, Subscriber, + rôles custom)
├── Bouton "Créer un rôle"
├── Pour chaque rôle :
│   ├── Nom, slug, description
│   ├── Badge "Système" (non supprimable) pour les 4 rôles par défaut
│   ├── Boutons : Modifier, Dupliquer, Supprimer
│   └── Compteur : "12 utilisateurs"
└── Clic sur un rôle → Matrice de permissions
```

### Matrice de permissions

```
┌──────────────────────────────────────────────────────────────┐
│  Rôle : Content Manager                                      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Pages                    ☑ Voir  ☑ Créer  ☑ Modifier  ☐ Supprimer  ☐ Publier │
│  Articles                 ☑ Voir  ☑ Créer  ☑ Modifier  ☑ Supprimer  ☑ Publier │
│  Médias                   ☑ Voir  ☑ Upload  ☐ Supprimer                      │
│  Menus                    ☑ Voir  ☐ Modifier                                 │
│  Taxonomies               ☑ Voir  ☑ Créer  ☑ Modifier  ☐ Supprimer          │
│  Commentaires             ☑ Voir  ☑ Modérer  ☐ Supprimer                    │
│  Formulaires              ☑ Voir soumissions  ☐ Modifier formulaires        │
│  Paramètres               ☐ Voir  ☐ Modifier                                │
│  Utilisateurs             ☐ Voir  ☐ Créer  ☐ Modifier                       │
│  Plugins                  ☐ Voir  ☐ Gérer                                   │
│  Thèmes                   ☐ Voir  ☐ Gérer                                   │
│  ──────────────────────────────────────────────────                           │
│  Options avancées :                                                          │
│  ☑ Modifier uniquement son propre contenu                                    │
│  ☐ Accéder au page builder                                                   │
│  ☐ Voir le dashboard analytics                                               │
│                                                              │
│                    [Sauvegarder]  [Annuler]                   │
└──────────────────────────────────────────────────────────────┘
```

### Permissions disponibles

```php
$allPermissions = [
    // Pages
    'pages.view', 'pages.create', 'pages.edit', 'pages.edit_own',
    'pages.delete', 'pages.publish', 'pages.builder',

    // Posts
    'posts.view', 'posts.create', 'posts.edit', 'posts.edit_own',
    'posts.delete', 'posts.publish',

    // Media
    'media.view', 'media.upload', 'media.edit', 'media.delete',

    // Menus
    'menus.view', 'menus.edit',

    // Taxonomies
    'taxonomies.view', 'taxonomies.create', 'taxonomies.edit', 'taxonomies.delete',

    // Comments
    'comments.view', 'comments.moderate', 'comments.delete',

    // Forms
    'forms.view', 'forms.edit', 'forms.view_submissions', 'forms.delete_submissions',

    // Settings
    'settings.view', 'settings.edit',

    // Users
    'users.view', 'users.create', 'users.edit', 'users.delete', 'users.assign_roles',

    // Plugins
    'plugins.view', 'plugins.manage',

    // Themes
    'themes.view', 'themes.manage', 'themes.customize',

    // Content Types (Custom Post Types)
    'content_types.view', 'content_types.create', 'content_types.edit', 'content_types.delete',

    // Dashboard
    'dashboard.view', 'dashboard.analytics',

    // Tools
    'tools.import', 'tools.export', 'tools.logs', 'tools.updates',
];
```

### RoleService

```php
class RoleService
{
    // Créer un rôle custom
    public function create(array $data): Role;

    // Dupliquer un rôle
    public function duplicate(Role $role, string $newName): Role;

    // Modifier les permissions
    public function updatePermissions(Role $role, array $permissions): Role;

    // Supprimer (uniquement les non-système)
    public function delete(Role $role): void;

    // Vérifier une permission
    public function hasPermission(User $user, string $permission): bool;

    // Lister toutes les permissions disponibles (groupées)
    public function getAvailablePermissions(): array;
}
```

---

## 5. Onboarding post-installation

**Référence** : Wix (tour guidé), Shopify (setup guide)

### Checklist de démarrage

```
┌──────────────────────────────────────────────────────────────┐
│  🚀 Bienvenue sur ArtisanCMS ! Configurez votre site.       │
│                                                              │
│  Progression : ████████░░░░░░░░ 45% (4/9)                   │
│                                                              │
│  ✅ Installer ArtisanCMS                                     │
│  ✅ Créer votre compte admin                                 │
│  ✅ Configurer les infos du site                             │
│  ✅ Choisir un thème                                         │
│  ☐ Créer votre première page (avec le page builder)          │
│  ☐ Configurer le menu principal                              │
│  ☐ Ajouter votre logo et favicon                             │
│  ☐ Configurer les paramètres SEO                             │
│  ☐ Publier votre site (désactiver le mode maintenance)       │
│                                                              │
│  [Masquer cette checklist]     [Ne plus afficher]             │
└──────────────────────────────────────────────────────────────┘
```

### Stockage

```php
// Dans users.preferences JSON
'onboarding' => [
    'completed' => false,
    'dismissed' => false,
    'steps_done' => ['install', 'admin', 'site_info', 'theme'],
]
```

### OnboardingService

```php
class OnboardingService
{
    // Récupérer l'état de l'onboarding pour un utilisateur
    public function getStatus(User $user): array;

    // Marquer une étape comme terminée
    public function completeStep(User $user, string $step): void;

    // Masquer l'onboarding
    public function dismiss(User $user): void;

    // Vérifier automatiquement les étapes
    public function autoCheckSteps(User $user): array;
    // Vérifie : une page publiée existe ? un menu existe ? logo configuré ? etc.
}
```

### Tour guidé (optionnel)

```tsx
// Utiliser react-joyride pour un tour guidé interactif
// Étapes :
// 1. "Voici le menu latéral, vous y trouverez toutes les sections"
// 2. "Cliquez ici pour créer votre première page"
// 3. "Le page builder vous permet de construire visuellement"
// 4. "Ici vous pouvez prévisualiser votre page"
// 5. "N'oubliez pas de publier quand vous êtes prêt !"

// Déclenché au premier login après installation
// Bouton "Passer" pour skip
// Sauvegardé dans preferences
```

---

## 6. Popup / Modal Builder

**Référence** : WordPress (Elementor Popups), Wix (Lightbox)

### Table : popups

```php
Schema::create('popups', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->json('content');                       // Arbre JSON de blocs (comme une page)
    $table->json('trigger');                        // Configuration du déclencheur
    $table->json('display_rules');                  // Conditions d'affichage
    $table->json('styles');                         // Dimensions, position, animation
    $table->boolean('enabled')->default(false);
    $table->timestamp('starts_at')->nullable();     // Planification début
    $table->timestamp('ends_at')->nullable();       // Planification fin
    $table->unsignedInteger('views_count')->default(0);
    $table->unsignedInteger('closes_count')->default(0);
    $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
    $table->timestamps();
});
```

### Triggers

```json
{
    "trigger": {
        "type": "delay",
        "config": {
            "delay_seconds": 5
        }
    }
}
```

| Type | Config | Description |
|------|--------|-------------|
| `delay` | `delay_seconds` | Apparaît après N secondes |
| `scroll` | `scroll_percent` | Apparaît après N% de scroll |
| `exit_intent` | - | Détection de sortie (souris vers le haut) |
| `click` | `selector` | Clic sur un élément CSS |
| `page_load` | - | Au chargement de la page |
| `inactivity` | `seconds` | Après N secondes d'inactivité |

### Display rules

```json
{
    "display_rules": {
        "pages": ["*"],
        "exclude_pages": ["/checkout"],
        "show_once": true,
        "show_once_per": "session",
        "max_displays": 3,
        "devices": ["desktop", "tablet"],
        "logged_in": null,
        "cookie_name": "popup_seen_1"
    }
}
```

### Styles

```json
{
    "styles": {
        "width": "500px",
        "max_width": "90vw",
        "position": "center",
        "overlay": true,
        "overlay_color": "rgba(0,0,0,0.5)",
        "animation": "fade-in",
        "border_radius": "12px",
        "close_button": true,
        "close_on_overlay": true
    }
}
```

### Animations

| Animation | Description |
|-----------|-------------|
| `fade-in` | Apparition en fondu |
| `slide-up` | Glisse depuis le bas |
| `slide-down` | Glisse depuis le haut |
| `zoom-in` | Zoom depuis le centre |
| `bounce` | Rebond |

### PopupService

```php
class PopupService
{
    // Récupérer les popups actifs pour une page donnée
    public function getActiveForPage(string $pageSlug, Request $request): Collection;

    // Incrémenter les vues
    public function recordView(Popup $popup): void;

    // Incrémenter les fermetures
    public function recordClose(Popup $popup): void;

    // Taux de conversion (1 - closes/views)
    public function getConversionRate(Popup $popup): float;
}
```

### Rendu React

```tsx
// components/Popup/PopupRenderer.tsx
// - Écoute les triggers (delay, scroll, exit intent)
// - Vérifie les display rules (cookie, session)
// - Rend le contenu (blocs JSON) dans un Dialog/Modal shadcn
// - Gère les animations CSS
// - Enregistre la vue/fermeture via API
```

---

## 7. Mega Menus

**Référence** : WordPress (Max Mega Menu), Joomla (natif avec modules)

### Extension de menu_items

```php
// Ajout sur la table menu_items
$table->boolean('is_mega')->default(false);         // Active le mode mega menu
$table->json('mega_content')->nullable();           // Contenu du mega menu (blocs JSON)
$table->integer('mega_columns')->default(3);        // Nombre de colonnes
$table->string('mega_width')->default('full');       // full | auto | 600px
$table->string('mega_background')->nullable();      // Image ou couleur de fond
```

### Structure mega menu

```json
{
    "is_mega": true,
    "mega_columns": 4,
    "mega_width": "full",
    "mega_content": {
        "columns": [
            {
                "title": "Nos Services",
                "items": [
                    { "label": "Web Design", "url": "/services/web-design", "icon": "palette", "description": "Sites sur mesure" },
                    { "label": "SEO", "url": "/services/seo", "icon": "search", "description": "Référencement naturel" }
                ]
            },
            {
                "title": "Ressources",
                "items": [
                    { "label": "Blog", "url": "/blog" },
                    { "label": "FAQ", "url": "/faq" }
                ]
            },
            {
                "title": "À propos",
                "content_type": "html",
                "html": "<img src='/team.jpg' /><p>Notre équipe</p>"
            },
            {
                "title": "Contact",
                "content_type": "widget",
                "widget_type": "newsletter-form"
            }
        ]
    }
}
```

### Rendu React

```tsx
// components/MegaMenu/MegaMenuDropdown.tsx
// - Hover sur un item parent avec is_mega=true
// - Affiche un dropdown pleine largeur (ou largeur custom)
// - Colonnes avec titres, liens, icônes, descriptions
// - Support HTML custom et widgets
// - Animation : slide-down + fade
// - Mobile : collapse en accordéon
```

---

## 8. Bloc Table of Contents (auto-généré)

### Bloc page builder

```json
{
    "type": "table-of-contents",
    "props": {
        "title": "Sommaire",
        "levels": [2, 3],
        "style": "numbered",
        "sticky": false,
        "smooth_scroll": true,
        "highlight_active": true,
        "collapsible": false,
        "max_depth": 3
    }
}
```

### Styles

| Style | Description |
|-------|-------------|
| `numbered` | 1. Titre / 1.1 Sous-titre |
| `bulleted` | • Titre / • Sous-titre |
| `plain` | Titre / Sous-titre (sans marqueur) |
| `bordered` | Encadré avec bordure gauche |

### Rendu React

```tsx
// Le composant scanne les headings (h2, h3, h4) de la page
// Génère des ancres automatiques (id slugifié)
// Construit l'arborescence
// Smooth scroll au clic
// Highlight du heading actif (IntersectionObserver)
```

---

## 9. Scheduler / Cron UI

### Page admin

```
/admin/tools/scheduler
├── Tâches planifiées (liste)
│   ├── Publier les contenus schedulés — Toutes les minutes — Dernière: il y a 30s ✅
│   ├── Agréger les analytics — Tous les jours à 2h — Dernière: il y a 8h ✅
│   ├── Nettoyer les révisions — Tous les dimanches — Dernière: il y a 3j ✅
│   ├── Vérifier les mises à jour — Toutes les 12h — Dernière: il y a 6h ✅
│   ├── Nettoyer les logs d'activité — Tous les mois — Dernière: il y a 15j ✅
│   └── Envoyer les newsletters planifiées — Toutes les 5 min — Dernière: il y a 2min ✅
├── Historique des exécutions
│   ├── Filtres : tâche, statut, date
│   └── Log : heure, tâche, durée, statut (succès/échec), message erreur
└── Bouton "Exécuter maintenant" par tâche
```

### SchedulerService

```php
class SchedulerService
{
    // Lister les tâches planifiées
    public function getScheduledTasks(): array;

    // Récupérer l'historique d'exécution
    public function getHistory(int $limit = 50): Collection;

    // Exécuter une tâche manuellement
    public function runNow(string $taskName): void;
}
```

### Table : scheduled_task_log

```php
Schema::create('scheduled_task_log', function (Blueprint $table) {
    $table->id();
    $table->string('task_name');
    $table->enum('status', ['running', 'completed', 'failed']);
    $table->unsignedInteger('duration_ms')->nullable();
    $table->text('output')->nullable();
    $table->text('error')->nullable();
    $table->timestamps();

    $table->index(['task_name', 'created_at']);
});
```

---

## 10. Queue / Jobs UI

### Page admin

```
/admin/tools/queue
├── Résumé
│   ├── En attente : 12
│   ├── En cours : 2
│   ├── Terminés (24h) : 156
│   └── Échoués : 3
├── Jobs en attente (tableau paginé)
│   ├── Type, Payload (résumé), Créé, Tentatives
│   └── Actions : Annuler
├── Jobs échoués (tableau paginé)
│   ├── Type, Erreur, Échoué à, Tentatives
│   └── Actions : Réessayer, Supprimer
└── Boutons : "Réessayer tous les échoués", "Purger les échoués"
```

### QueueMonitorService

```php
class QueueMonitorService
{
    // Statistiques de la queue
    public function getStats(): array;

    // Jobs en attente
    public function getPending(int $perPage = 20): LengthAwarePaginator;

    // Jobs échoués
    public function getFailed(int $perPage = 20): LengthAwarePaginator;

    // Réessayer un job échoué
    public function retry(int $failedJobId): void;

    // Réessayer tous les échoués
    public function retryAll(): int;

    // Purger les échoués
    public function purgeFailed(): int;
}
```

---

## 11. Performance Monitoring

### Page admin

```
/admin/tools/performance
├── Temps de réponse moyen (dernière heure, jour, semaine)
│   └── Graphique recharts (LineChart)
├── Requêtes DB par page (top 10 plus gourmandes)
│   └── Tableau : route, queries moy., temps moy., appels
├── Cache
│   ├── Hit rate : 87%
│   ├── Taille cache : 12 MB
│   └── Clés en cache : 234
├── Espace disque
│   ├── Médias : 1.2 GB / 10 GB
│   ├── Backups : 500 MB
│   └── Logs : 50 MB
└── PHP Info (version, extensions, memory_limit, etc.)
```

### PerformanceService

```php
class PerformanceService
{
    // Temps de réponse moyen
    public function getAverageResponseTime(string $period = 'hour'): float;

    // Top routes les plus lentes
    public function getSlowestRoutes(int $limit = 10): array;

    // Statistiques cache
    public function getCacheStats(): array;

    // Espace disque
    public function getDiskUsage(): array;

    // Info PHP
    public function getPhpInfo(): array;
}
```

### Middleware PerformanceLogger (optionnel, activable)

```php
class PerformanceLogger
{
    public function handle(Request $request, Closure $next): Response
    {
        $start = microtime(true);
        DB::enableQueryLog();

        $response = $next($request);

        $duration = (microtime(true) - $start) * 1000;
        $queryCount = count(DB::getQueryLog());

        // Stocker en cache (ring buffer, max 1000 entrées)
        Cache::push('perf_log', [
            'route' => $request->route()?->getName(),
            'method' => $request->method(),
            'duration_ms' => round($duration, 2),
            'queries' => $queryCount,
            'timestamp' => now()->timestamp,
        ]);

        return $response;
    }
}
```

---

## 12. Migration / Upgrade de données (entre versions)

### Architecture

```php
// Chaque version du CMS peut définir des data transformers
// pour migrer les données structurées (JSON des blocs, settings, etc.)

// database/data-migrations/
// ├── 1.0.0_to_1.1.0.php
// ├── 1.1.0_to_1.2.0.php
// └── 1.2.0_to_2.0.0.php
```

### DataMigration interface

```php
interface DataMigration
{
    public function getFromVersion(): string;
    public function getToVersion(): string;
    public function up(): void;
    public function down(): void;
    public function description(): string;
}
```

### Exemple : migration de schema de blocs

```php
class Migration_1_0_0_to_1_1_0 implements DataMigration
{
    public function up(): void
    {
        // Renommer le bloc "text-block" en "text"
        Page::chunk(100, function ($pages) {
            foreach ($pages as $page) {
                $content = $page->content;
                $content = $this->transformBlocks($content, function ($block) {
                    if ($block['type'] === 'text-block') {
                        $block['type'] = 'text';
                    }
                    return $block;
                });
                $page->update(['content' => $content]);
            }
        });
    }
}
```

### DataMigrationService

```php
class DataMigrationService
{
    // Lister les migrations à exécuter
    public function getPending(): array;

    // Exécuter les migrations de données
    public function migrate(): array;

    // Rollback
    public function rollback(string $version): void;

    // Vérifier la compatibilité des données
    public function validateData(): array;  // Retourne les problèmes trouvés
}
```

### Commande CLI

```bash
php artisan cms:data:migrate              # Exécuter les migrations de données
php artisan cms:data:validate             # Vérifier la compatibilité
php artisan cms:data:rollback 1.1.0       # Rollback à une version
```

---

## 13. Lazy Loading routes admin

### Implémentation

```tsx
// resources/js/pages/Admin/ — chaque page est lazy-loaded

// routes.tsx ou app.tsx
const AdminPages = {
    'Admin/Dashboard':      lazy(() => import('@/pages/Admin/Dashboard')),
    'Admin/Pages/Index':    lazy(() => import('@/pages/Admin/Pages/Index')),
    'Admin/Pages/Edit':     lazy(() => import('@/pages/Admin/Pages/Edit')),
    'Admin/Posts/Index':     lazy(() => import('@/pages/Admin/Posts/Index')),
    'Admin/Posts/Edit':      lazy(() => import('@/pages/Admin/Posts/Edit')),
    'Admin/Media/Index':    lazy(() => import('@/pages/Admin/Media/Index')),
    'Admin/Settings':       lazy(() => import('@/pages/Admin/Settings')),
    'Admin/Plugins':        lazy(() => import('@/pages/Admin/Plugins')),
    'Admin/Themes':         lazy(() => import('@/pages/Admin/Themes')),
    'Admin/Users':          lazy(() => import('@/pages/Admin/Users')),
    'Admin/Comments':       lazy(() => import('@/pages/Admin/Comments')),
    'Admin/Tools/Import':   lazy(() => import('@/pages/Admin/Tools/Import')),
    // ... etc.

    // Pages lourdes (priorité lazy)
    'Builder/Edit':         lazy(() => import('@/pages/Builder/Edit')),
    'Admin/Analytics':      lazy(() => import('@/pages/Admin/Analytics')),
    'Admin/Updates':        lazy(() => import('@/pages/Admin/Updates')),
};
```

### Inertia + Lazy loading

```tsx
// Avec Inertia 2, utiliser resolveComponent async
// https://inertiajs.com/client-side-setup

import { createInertiaApp } from '@inertiajs/react';

createInertiaApp({
    resolve: (name) => {
        const pages = import.meta.glob('./pages/**/*.tsx');
        return pages[`./pages/${name}.tsx`]();
    },
    // ...
});
```

### Vite config (manualChunks)

```typescript
// vite.config.ts
export default defineConfig({
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    'vendor-react': ['react', 'react-dom', 'react/jsx-runtime'],
                    'vendor-inertia': ['@inertiajs/react'],
                    'vendor-dnd': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
                    'vendor-tiptap': ['@tiptap/react', '@tiptap/starter-kit', '@tiptap/extension-link'],
                    'vendor-charts': ['recharts'],
                    'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
                },
            },
        },
    },
});
```

### Loading Spinner

```tsx
// Composant Suspense wrapper pour toutes les pages lazy
<Suspense fallback={<PageLoadingSpinner />}>
    <Component {...pageProps} />
</Suspense>

// PageLoadingSpinner : skeleton ou spinner centré
```

---

## 14. Log Viewer Admin

### Page admin

```
/admin/tools/logs
├── Filtres : niveau (error, warning, info, debug), date (aujourd'hui, 7j, 30j), recherche texte
├── Tableau paginé
│   ├── Date/Heure | Niveau | Message | Contexte (expandable)
│   └── Coloration : rouge=error, orange=warning, bleu=info, gris=debug
├── Boutons : Télécharger, Vider les logs
└── Info : Taille totale des logs, rotation configurée
```

### LogViewerService

```php
class LogViewerService
{
    // Lire les logs Laravel (storage/logs/)
    public function getLogs(array $filters = [], int $perPage = 50): LengthAwarePaginator;

    // Fichiers de logs disponibles
    public function getLogFiles(): array;

    // Télécharger un fichier de log
    public function download(string $filename): StreamedResponse;

    // Vider les logs
    public function clear(string $filename): void;

    // Statistiques (erreurs/jour, warnings/jour)
    public function getStats(): array;
}
```

---

## 15. Health Check / Status Endpoint

### Route

```php
Route::get('/health', [HealthCheckController::class, 'check']);
```

### HealthCheckService

```php
class HealthCheckService
{
    public function check(): HealthCheckResult
    {
        return new HealthCheckResult([
            'database'    => $this->checkDatabase(),
            'cache'       => $this->checkCache(),
            'storage'     => $this->checkStorage(),
            'queue'       => $this->checkQueue(),
            'disk_space'  => $this->checkDiskSpace(),
            'php'         => $this->checkPhp(),
            'extensions'  => $this->checkExtensions(),
        ]);
    }

    private function checkDatabase(): HealthItem;    // SELECT 1
    private function checkCache(): HealthItem;       // Cache::put/get
    private function checkStorage(): HealthItem;     // is_writable(storage_path())
    private function checkQueue(): HealthItem;       // Queue connection alive
    private function checkDiskSpace(): HealthItem;   // disk_free_space() > 100MB
    private function checkPhp(): HealthItem;         // Version >= 8.2
    private function checkExtensions(): HealthItem;  // Extensions requises
}
```

### Réponse JSON

```json
{
    "status": "healthy",
    "checks": {
        "database": { "status": "ok", "message": "Connected", "response_time_ms": 2 },
        "cache": { "status": "ok", "message": "Redis connected" },
        "storage": { "status": "ok", "message": "Writable" },
        "queue": { "status": "ok", "message": "Connected" },
        "disk_space": { "status": "warning", "message": "2.1 GB free (< 5 GB threshold)" },
        "php": { "status": "ok", "message": "8.3.4" },
        "extensions": { "status": "ok", "message": "All required extensions loaded" }
    },
    "timestamp": "2026-03-14T10:00:00+00:00",
    "version": "1.0.0"
}
```

### Page admin

```
/admin/tools/health
├── Status global : 🟢 Healthy (ou 🟡 Warning / 🔴 Critical)
├── Checklist de santé (chaque check avec indicateur)
├── Bouton "Relancer les vérifications"
└── Dernière vérification : il y a 5 min
```

---

## 16. Sticky Elements dans le Builder

### Propriété de style sur tous les blocs

```json
{
    "styles": {
        "desktop": {
            "position": "sticky",
            "top": "0px",
            "zIndex": 100
        }
    }
}
```

### UI dans le panel de propriétés

```
Position
├── ○ Statique (défaut)
├── ○ Relative
├── ○ Sticky
│   ├── Position : [Top ▼] [0] px
│   └── Z-index : [100]
└── ○ Fixe
    ├── Position : [Top ▼] [0] px
    └── Z-index : [100]
```

### Implémentation

```tsx
// Dans le renderer de bloc, appliquer les styles CSS natifs
// position: sticky est supporté par tous les navigateurs modernes
// Le builder ajoute un indicateur visuel sur les blocs sticky
```

---

## 17. Aide contextuelle

### Implémentation

```tsx
// Composant HelpTooltip réutilisable
<HelpTooltip content="Le meta title s'affiche dans les résultats Google. Idéalement entre 30 et 60 caractères." />

// Rendu : icône (?) qui affiche un tooltip au hover/clic
// Utilise shadcn/ui Tooltip
```

### Liens vers la documentation

```tsx
// Composant HelpLink réutilisable
<HelpLink href="/docs/guides/seo" label="En savoir plus sur le SEO" />

// Rendu : icône livre/lien externe avec texte
// Ouvre la doc dans un nouvel onglet
```

### Contenu d'aide par section

```php
// Stocké dans les fichiers de traduction
// lang/fr/help.php
return [
    'pages.title' => 'Le titre de la page, affiché en haut et dans la navigation.',
    'pages.slug' => 'L\'URL de la page. Généré automatiquement à partir du titre.',
    'pages.meta_title' => 'Le titre SEO affiché dans Google. 30-60 caractères recommandés.',
    'pages.meta_description' => 'La description SEO affichée dans Google. 120-160 caractères recommandés.',
    'pages.template' => 'Le layout du thème à utiliser pour cette page.',
    'pages.status' => 'Brouillon : visible uniquement par les éditeurs. Publié : visible par tous.',
    'builder.blocks' => 'Glissez-déposez les blocs depuis la bibliothèque vers le canvas.',
    'builder.responsive' => 'Basculez entre desktop, tablette et mobile pour ajuster le design.',
    // ...
];
```

---

## 18. Error Boundary Global

### Implémentation React

```tsx
// components/ErrorBoundary/GlobalErrorBoundary.tsx
class GlobalErrorBoundary extends React.Component<Props, State> {
    state = { hasError: false, error: null };

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Reporter l'erreur au backend
        fetch('/api/admin/errors/report', {
            method: 'POST',
            body: JSON.stringify({
                message: error.message,
                stack: error.stack,
                componentStack: errorInfo.componentStack,
                url: window.location.href,
                timestamp: new Date().toISOString(),
            }),
        }).catch(() => {});
    }

    render() {
        if (this.state.hasError) {
            return <ErrorFallback error={this.state.error} onReset={() => this.setState({ hasError: false })} />;
        }
        return this.props.children;
    }
}
```

### ErrorFallback

```tsx
function ErrorFallback({ error, onReset }: { error: Error | null; onReset: () => void }) {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="max-w-md text-center">
                <h1 className="text-2xl font-bold">Une erreur est survenue</h1>
                <p className="mt-2 text-muted-foreground">
                    L'application a rencontré un problème inattendu.
                </p>
                {import.meta.env.DEV && error && (
                    <pre className="mt-4 rounded bg-muted p-4 text-left text-xs overflow-auto">
                        {error.message}
                    </pre>
                )}
                <div className="mt-6 flex gap-4 justify-center">
                    <Button onClick={onReset}>Réessayer</Button>
                    <Button variant="outline" onClick={() => window.location.href = '/admin'}>
                        Retour au dashboard
                    </Button>
                </div>
            </div>
        </div>
    );
}
```

### Wrapping dans l'app

```tsx
// app.tsx
createInertiaApp({
    // ...
    setup({ el, App, props }) {
        createRoot(el).render(
            <GlobalErrorBoundary>
                <App {...props} />
            </GlobalErrorBoundary>
        );
    },
});
```

---

## 19. Preview Front-end avancée

**Référence** : WordPress (preview), Ghost (preview link)

### Fonctionnalités

```php
class PreviewService
{
    // Générer une URL de preview (pour une page en brouillon)
    public function generatePreviewUrl(Page $page): string;
    // Ex: /preview/{encrypted_token}
    // Token contient : page_id, expires_at (1h)
    // Accessible sans auth (pour partager avec un client)

    // Preview "comme visiteur" (sans les éléments admin)
    public function generateVisitorPreview(Page $page): string;

    // Preview sur un device spécifique
    // Ouvre un iframe redimensionné dans l'admin
    public function getDevicePreviewUrl(Page $page, string $device): string;
}
```

### UI dans l'éditeur de page

```
Bouton "Prévisualiser" → Dropdown :
├── 👁  Aperçu rapide (iframe dans l'admin)
├── 🖥  Desktop (1280px)
├── 📱 Mobile (375px)
├── 📄 Tablette (768px)
├── 🔗 Copier le lien de preview (pour partager avec le client)
│   └── "Ce lien expire dans 1 heure"
└── 🌐 Ouvrir dans un nouvel onglet
```

### Preview URL sécurisée

```php
// Le token contient :
// - page_id
// - content snapshot (le contenu actuel, pas celui en DB si c'est un brouillon)
// - expires_at
// - hash pour vérification

// Le middleware PreviewMode :
// 1. Décrypte le token
// 2. Vérifie l'expiration
// 3. Charge le contenu du snapshot (pas de la DB)
// 4. Rend la page avec le thème actif
// 5. Ajoute une bannière "Mode prévisualisation" en haut
```

---

## Résumé des nouvelles tables

| Table | Fonctionnalité |
|-------|---------------|
| `update_log` | Système de mises à jour |
| `popups` | Popup/Modal builder |
| `scheduled_task_log` | Scheduler UI |

### Modifications de tables existantes

| Table | Ajouts |
|-------|--------|
| `menu_items` | `is_mega`, `mega_content`, `mega_columns`, `mega_width`, `mega_background` |

### Nouveaux Services

| Service | Fonctionnalité |
|---------|---------------|
| `UpdateService` | Système de mises à jour |
| `DashboardService` | Dashboard admin |
| `MediaFolderService` | Dossiers médias |
| `OrphanMediaDetector` | Détection médias orphelins |
| `StockPhotoService` | Intégration Unsplash/Pexels |
| `RoleService` | Rôles custom + permissions |
| `OnboardingService` | Onboarding post-install |
| `PopupService` | Popup/Modal builder |
| `SchedulerService` | Scheduler UI |
| `QueueMonitorService` | Queue/Jobs UI |
| `PerformanceService` | Performance monitoring |
| `DataMigrationService` | Migration de données |
| `LogViewerService` | Log viewer |
| `HealthCheckService` | Health check |
| `PreviewService` | Preview avancée |

---

## Priorité d'implémentation recommandée

### Phase 1 (avec les fondations)
- Health check (#15) — simple, utile dès le début
- Error boundary global (#18) — protection de base
- Lazy loading routes admin (#13) — performance dès le départ
- Aide contextuelle (#17) — tooltips sur les champs

### Phase 2 (avec le contenu)
- Dashboard admin complet (#2) — première chose visible
- Onboarding post-install (#5) — retention
- Gestion médias avancée (#3) — usage quotidien
- Rôles custom UI (#4) — multi-utilisateur
- Log viewer (#14) — debug

### Phase 3 (avec le builder)
- Popup/Modal builder (#6) — marketing
- Sticky elements (#16) — headers sticky
- Table of contents (#8) — contenu long
- Mega menus (#7) — navigation avancée

### Phase 4 (avec les thèmes & plugins)
- Système de mises à jour (#1) — critique pour la maintenance
- Migration de données (#12) — nécessaire pour les updates
- Preview avancée (#19) — partage client

### Phase 5+ (outils avancés)
- Scheduler UI (#9) — monitoring
- Queue/Jobs UI (#10) — monitoring
- Performance monitoring (#11) — optimisation
