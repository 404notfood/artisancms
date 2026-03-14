# Blueprint 20 - Journal d'activité (Audit Trail)

## Vue d'ensemble
Ce document définit le système de journal d'activité d'ArtisanCMS. Il s'agit d'une fonctionnalité **core** (pas un plugin) qui trace toutes les actions utilisateur et système : CRUD de contenu, authentification, gestion des plugins/thèmes, modifications de paramètres, etc. L'objectif est de fournir un audit trail complet, performant et conforme au RGPD.

---

## 1. Table : activity_log

```php
Schema::create('activity_log', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
    $table->string('action');                          // created, updated, deleted, published, login, logout, etc.
    $table->nullableMorphs('subject');                 // subject_type + subject_id (entité concernée)
    $table->json('properties')->nullable();            // {old: {...}, new: {...}, metadata: {...}}
    $table->string('ip_address', 45)->nullable();      // IPv4 ou IPv6
    $table->string('user_agent')->nullable();
    $table->timestamp('created_at')->useCurrent();

    // Index pour les requêtes fréquentes
    $table->index(['subject_type', 'subject_id'], 'activity_log_subject_index');
    $table->index(['user_id', 'created_at'], 'activity_log_user_date_index');
    $table->index('action');
    $table->index('created_at');
});
```

### Actions possibles

| Action | Catégorie | Description |
|--------|-----------|-------------|
| `created` | Contenu | Création d'une page, post, média, menu, taxonomie |
| `updated` | Contenu | Modification d'une entité |
| `deleted` | Contenu | Suppression (soft ou hard) d'une entité |
| `restored` | Contenu | Restauration depuis la corbeille |
| `published` | Contenu | Publication d'une page ou d'un post |
| `unpublished` | Contenu | Dépublication (retour en brouillon) |
| `login` | Auth | Connexion réussie |
| `logout` | Auth | Déconnexion |
| `login_failed` | Auth | Tentative de connexion échouée |
| `password_changed` | Auth | Changement de mot de passe |
| `user_created` | Utilisateurs | Création d'un compte utilisateur |
| `role_changed` | Utilisateurs | Changement de rôle d'un utilisateur |
| `user_deleted` | Utilisateurs | Suppression d'un utilisateur |
| `settings_updated` | Paramètres | Modification des paramètres CMS |
| `plugin_installed` | Plugins | Installation d'un plugin |
| `plugin_activated` | Plugins | Activation d'un plugin |
| `plugin_deactivated` | Plugins | Désactivation d'un plugin |
| `plugin_uninstalled` | Plugins | Désinstallation d'un plugin |
| `theme_activated` | Thèmes | Activation d'un thème |
| `theme_customized` | Thèmes | Modification des personnalisations d'un thème |
| `backup_created` | Système | Création d'une sauvegarde |
| `backup_restored` | Système | Restauration d'une sauvegarde |
| `cache_cleared` | Système | Vidage du cache |

---

## 2. Modèle ActivityLog

```php
// app/Models/ActivityLog.php
<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ActivityLog extends Model
{
    public $timestamps = false;

    protected $table = 'activity_log';

    protected $fillable = [
        'user_id',
        'action',
        'subject_type',
        'subject_id',
        'properties',
        'ip_address',
        'user_agent',
        'created_at',
    ];

    protected $casts = [
        'properties' => 'array',
        'created_at' => 'datetime',
    ];

    // ─── Relations ────────────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function subject(): MorphTo
    {
        return $this->morphTo();
    }

    // ─── Scopes ───────────────────────────────────────────

    public function scopeForSubject($query, string $type, int $id)
    {
        return $query->where('subject_type', $type)->where('subject_id', $id);
    }

    public function scopeByUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeByAction($query, string $action)
    {
        return $query->where('action', $action);
    }

    public function scopeByActionCategory($query, string $category)
    {
        $actionsByCategory = [
            'content'  => ['created', 'updated', 'deleted', 'restored', 'published', 'unpublished'],
            'auth'     => ['login', 'logout', 'login_failed', 'password_changed'],
            'users'    => ['user_created', 'role_changed', 'user_deleted'],
            'settings' => ['settings_updated'],
            'plugins'  => ['plugin_installed', 'plugin_activated', 'plugin_deactivated', 'plugin_uninstalled'],
            'themes'   => ['theme_activated', 'theme_customized'],
            'system'   => ['backup_created', 'backup_restored', 'cache_cleared'],
        ];

        $actions = $actionsByCategory[$category] ?? [];

        return $query->whereIn('action', $actions);
    }

    public function scopeBetween($query, string $from, string $to)
    {
        return $query->whereBetween('created_at', [$from, $to]);
    }

    // ─── Helpers ──────────────────────────────────────────

    public function getOldValues(): array
    {
        return $this->properties['old'] ?? [];
    }

    public function getNewValues(): array
    {
        return $this->properties['new'] ?? [];
    }

    public function getChangedFields(): array
    {
        $old = $this->getOldValues();
        $new = $this->getNewValues();

        return array_keys(array_diff_assoc($new, $old));
    }

    /**
     * Libellé lisible de l'action pour l'affichage admin
     */
    public function getActionLabelAttribute(): string
    {
        $labels = [
            'created'              => __('cms.activity.created'),
            'updated'              => __('cms.activity.updated'),
            'deleted'              => __('cms.activity.deleted'),
            'restored'             => __('cms.activity.restored'),
            'published'            => __('cms.activity.published'),
            'unpublished'          => __('cms.activity.unpublished'),
            'login'                => __('cms.activity.login'),
            'logout'               => __('cms.activity.logout'),
            'login_failed'         => __('cms.activity.login_failed'),
            'password_changed'     => __('cms.activity.password_changed'),
            'user_created'         => __('cms.activity.user_created'),
            'role_changed'         => __('cms.activity.role_changed'),
            'user_deleted'         => __('cms.activity.user_deleted'),
            'settings_updated'     => __('cms.activity.settings_updated'),
            'plugin_installed'     => __('cms.activity.plugin_installed'),
            'plugin_activated'     => __('cms.activity.plugin_activated'),
            'plugin_deactivated'   => __('cms.activity.plugin_deactivated'),
            'plugin_uninstalled'   => __('cms.activity.plugin_uninstalled'),
            'theme_activated'      => __('cms.activity.theme_activated'),
            'theme_customized'     => __('cms.activity.theme_customized'),
            'backup_created'       => __('cms.activity.backup_created'),
            'backup_restored'      => __('cms.activity.backup_restored'),
            'cache_cleared'        => __('cms.activity.cache_cleared'),
        ];

        return $labels[$this->action] ?? $this->action;
    }
}
```

---

## 3. Trait LogsActivity

Ce trait s'applique aux modèles Eloquent pour enregistrer automatiquement les opérations `created`, `updated` et `deleted` avec les anciennes et nouvelles valeurs.

```php
// app/CMS/Traits/LogsActivity.php
<?php

declare(strict_types=1);

namespace App\CMS\Traits;

use App\Services\ActivityLogService;

trait LogsActivity
{
    public static function bootLogsActivity(): void
    {
        static::created(function ($model) {
            app(ActivityLogService::class)->logModelEvent($model, 'created');
        });

        static::updated(function ($model) {
            app(ActivityLogService::class)->logModelEvent($model, 'updated');
        });

        static::deleted(function ($model) {
            app(ActivityLogService::class)->logModelEvent($model, 'deleted');
        });

        // Support du soft delete (restored)
        if (method_exists(static::class, 'bootSoftDeletes')) {
            static::restored(function ($model) {
                app(ActivityLogService::class)->logModelEvent($model, 'restored');
            });
        }
    }

    /**
     * Attributs exclus du log (mots de passe, tokens, etc.)
     */
    public function getActivityExcludedAttributes(): array
    {
        return $this->activityExcluded ?? ['password', 'remember_token', 'two_factor_secret'];
    }

    /**
     * Attributs à toujours inclure dans le log (même si non modifiés)
     * Utile pour donner du contexte (ex: titre de la page)
     */
    public function getActivityContextAttributes(): array
    {
        return $this->activityContext ?? [];
    }

    /**
     * Nom lisible du modèle pour l'affichage dans le log
     */
    public function getActivitySubjectName(): string
    {
        return $this->title ?? $this->name ?? $this->slug ?? "#{$this->id}";
    }
}
```

### Utilisation sur un modèle

```php
// app/Models/Page.php
<?php

declare(strict_types=1);

namespace App\Models;

use App\CMS\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Model;

class Page extends Model
{
    use LogsActivity;

    /**
     * Attributs exclus du log d'activité
     */
    protected array $activityExcluded = ['content', 'updated_at', 'created_at'];

    /**
     * Attributs de contexte toujours inclus
     */
    protected array $activityContext = ['title', 'slug'];

    // ...
}
```

**Note :** Le champ `content` (JSON du page builder) est exclu par defaut pour les pages et posts car il est volumineux. Les modifications de contenu sont tracees via le systeme de revisions (Blueprint 01). Le log d'activite enregistre uniquement que la page a ete modifiee, pas le detail du JSON.

### Modeles qui utilisent le trait

| Modele | activityExcluded | activityContext |
|--------|-----------------|-----------------|
| `Page` | content, updated_at, created_at | title, slug |
| `Post` | content, updated_at, created_at | title, slug |
| `Media` | metadata, thumbnails, updated_at | original_filename, mime_type |
| `Menu` | updated_at, created_at | name, slug |
| `User` | password, remember_token, updated_at | name, email |
| `Setting` | updated_at, created_at | group, key |

---

## 4. ActivityLogService

Service central pour enregistrer les evenements. Gere a la fois le logging automatique (via le trait) et le logging manuel (login, plugins, etc.).

```php
// app/Services/ActivityLogService.php
<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\ActivityLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class ActivityLogService
{
    // ─── Logging automatique (via trait) ──────────────────

    public function logModelEvent(Model $model, string $action): void
    {
        $properties = $this->buildModelProperties($model, $action);

        $this->log(
            action: $action,
            subjectType: $model->getMorphClass(),
            subjectId: $model->getKey(),
            properties: $properties,
        );
    }

    protected function buildModelProperties(Model $model, string $action): array
    {
        $excluded = method_exists($model, 'getActivityExcludedAttributes')
            ? $model->getActivityExcludedAttributes()
            : [];

        $context = method_exists($model, 'getActivityContextAttributes')
            ? $model->getActivityContextAttributes()
            : [];

        $properties = [];

        // Ajouter le nom lisible du sujet
        if (method_exists($model, 'getActivitySubjectName')) {
            $properties['subject_name'] = $model->getActivitySubjectName();
        }

        switch ($action) {
            case 'created':
                $attributes = array_diff_key($model->getAttributes(), array_flip($excluded));
                $properties['new'] = $attributes;
                break;

            case 'updated':
                $dirty = array_diff_key($model->getDirty(), array_flip($excluded));
                $original = array_intersect_key($model->getOriginal(), $dirty);
                $properties['old'] = $original;
                $properties['new'] = $dirty;

                // Ajouter les attributs de contexte
                foreach ($context as $attr) {
                    if (!isset($properties['new'][$attr]) && $model->getAttribute($attr)) {
                        $properties['context'][$attr] = $model->getAttribute($attr);
                    }
                }
                break;

            case 'deleted':
                $properties['old'] = array_diff_key($model->getAttributes(), array_flip($excluded));
                break;

            case 'restored':
                $properties['new'] = ['status' => $model->getAttribute('status') ?? 'restored'];
                break;
        }

        return $properties;
    }

    // ─── Logging manuel ───────────────────────────────────

    /**
     * Enregistrer une action manuelle (login, plugin install, settings, etc.)
     */
    public function log(
        string $action,
        ?string $subjectType = null,
        ?int $subjectId = null,
        array $properties = [],
        ?int $userId = null,
    ): ActivityLog {
        return ActivityLog::create([
            'user_id'      => $userId ?? Auth::id(),
            'action'       => $action,
            'subject_type' => $subjectType,
            'subject_id'   => $subjectId,
            'properties'   => !empty($properties) ? $properties : null,
            'ip_address'   => $this->getIpAddress(),
            'user_agent'   => $this->getUserAgent(),
            'created_at'   => now(),
        ]);
    }

    // ─── Methodes de raccourci ────────────────────────────

    public function logLogin(int $userId): ActivityLog
    {
        return $this->log(
            action: 'login',
            userId: $userId,
        );
    }

    public function logLogout(): ActivityLog
    {
        return $this->log(action: 'logout');
    }

    public function logFailedLogin(string $email): ActivityLog
    {
        return $this->log(
            action: 'login_failed',
            properties: ['email' => $email],
            userId: null,
        );
    }

    public function logSettingsUpdated(string $group, array $oldValues, array $newValues): ActivityLog
    {
        return $this->log(
            action: 'settings_updated',
            properties: [
                'group' => $group,
                'old'   => $oldValues,
                'new'   => $newValues,
            ],
        );
    }

    public function logPluginAction(string $action, string $pluginSlug, ?int $pluginId = null): ActivityLog
    {
        return $this->log(
            action: $action, // plugin_installed, plugin_activated, etc.
            subjectType: 'cms_plugin',
            subjectId: $pluginId,
            properties: ['slug' => $pluginSlug],
        );
    }

    public function logThemeAction(string $action, string $themeSlug, ?int $themeId = null): ActivityLog
    {
        return $this->log(
            action: $action, // theme_activated, theme_customized
            subjectType: 'cms_theme',
            subjectId: $themeId,
            properties: ['slug' => $themeSlug],
        );
    }

    public function logBackup(string $action, array $metadata = []): ActivityLog
    {
        return $this->log(
            action: $action, // backup_created, backup_restored
            properties: $metadata,
        );
    }

    public function logUserRoleChange(int $targetUserId, string $oldRole, string $newRole): ActivityLog
    {
        return $this->log(
            action: 'role_changed',
            subjectType: 'user',
            subjectId: $targetUserId,
            properties: [
                'old' => ['role' => $oldRole],
                'new' => ['role' => $newRole],
            ],
        );
    }

    // ─── Utilitaires ──────────────────────────────────────

    protected function getIpAddress(): ?string
    {
        $ip = Request::ip();

        // Anonymisation RGPD si activee
        if (config('cms.activity_log.anonymize_ip', false)) {
            return $this->anonymizeIp($ip);
        }

        return $ip;
    }

    protected function getUserAgent(): ?string
    {
        $ua = Request::userAgent();

        // Tronquer a 500 caracteres max
        return $ua ? mb_substr($ua, 0, 500) : null;
    }

    /**
     * Anonymiser une adresse IP (remplacer le dernier octet/segment)
     * IPv4 : 192.168.1.42 → 192.168.1.0
     * IPv6 : 2001:db8::1  → 2001:db8::0
     */
    protected function anonymizeIp(?string $ip): ?string
    {
        if ($ip === null) {
            return null;
        }

        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
            return preg_replace('/\.\d+$/', '.0', $ip);
        }

        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6)) {
            // Masquer les 80 derniers bits
            return preg_replace('/:[^:]+$/', ':0', $ip);
        }

        return null;
    }
}
```

### Integration dans les controllers et listeners

```php
// app/Http/Controllers/Auth/AuthenticatedSessionController.php
// Dans la methode store() apres authentification reussie :
app(ActivityLogService::class)->logLogin($user->id);

// Dans la methode destroy() :
app(ActivityLogService::class)->logLogout();
```

```php
// app/Listeners/LogFailedLogin.php
<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Services\ActivityLogService;
use Illuminate\Auth\Events\Failed;

class LogFailedLogin
{
    public function __construct(
        protected ActivityLogService $activityLogService,
    ) {}

    public function handle(Failed $event): void
    {
        $this->activityLogService->logFailedLogin(
            $event->credentials['email'] ?? 'unknown',
        );
    }
}
```

```php
// app/Providers/EventServiceProvider.php (ou AppServiceProvider::boot)
use Illuminate\Auth\Events\Failed;
use App\Listeners\LogFailedLogin;

Event::listen(Failed::class, LogFailedLogin::class);
```

```php
// Dans PluginManager lors de l'installation d'un plugin :
app(ActivityLogService::class)->logPluginAction('plugin_installed', $plugin->slug, $plugin->id);

// Dans SettingsController lors d'une mise a jour :
app(ActivityLogService::class)->logSettingsUpdated($group, $oldValues, $newValues);

// Dans ThemeManager lors de l'activation d'un theme :
app(ActivityLogService::class)->logThemeAction('theme_activated', $theme->slug, $theme->id);
```

---

## 5. Structure JSON de `properties`

### Exemple : mise a jour d'une page

```json
{
    "subject_name": "Page d'accueil",
    "old": {
        "title": "Accueil",
        "status": "draft",
        "meta_title": null
    },
    "new": {
        "title": "Page d'accueil",
        "status": "published",
        "meta_title": "Bienvenue sur notre site"
    },
    "context": {
        "slug": "accueil"
    }
}
```

### Exemple : connexion echouee

```json
{
    "email": "attacker@example.com"
}
```

### Exemple : changement de parametres

```json
{
    "group": "general",
    "old": {
        "site_name": "Mon Site"
    },
    "new": {
        "site_name": "ArtisanCMS Demo"
    }
}
```

### Exemple : installation d'un plugin

```json
{
    "slug": "form-builder"
}
```

### Exemple : changement de role

```json
{
    "old": { "role": "author" },
    "new": { "role": "editor" }
}
```

---

## 6. Configuration

```php
// config/cms.php — section activity_log
'activity_log' => [
    'enabled'       => env('CMS_ACTIVITY_LOG_ENABLED', true),
    'retention_days' => env('CMS_ACTIVITY_LOG_RETENTION', 90),
    'anonymize_ip'  => env('CMS_ACTIVITY_LOG_ANONYMIZE_IP', false),

    // Actions a ne pas logger (pour reduire le bruit)
    'excluded_actions' => [
        // 'login', 'logout',
    ],

    // Modeles exclus du logging automatique
    'excluded_models' => [
        // \App\Models\ActivityLog::class, // Ne pas logger le log lui-meme (toujours exclu)
    ],
],
```

---

## 7. Commande de nettoyage

```php
// app/Console/Commands/CleanupActivityLog.php
<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\ActivityLog;
use Illuminate\Console\Command;

class CleanupActivityLog extends Command
{
    protected $signature = 'cms:activity:cleanup
                            {--days= : Nombre de jours a conserver (defaut: config)}
                            {--dry-run : Afficher le nombre d\'entrees a supprimer sans les supprimer}';

    protected $description = 'Supprimer les anciennes entrees du journal d\'activite';

    public function handle(): int
    {
        $days = (int) ($this->option('days') ?? config('cms.activity_log.retention_days', 90));
        $cutoff = now()->subDays($days);

        $query = ActivityLog::where('created_at', '<', $cutoff);
        $count = $query->count();

        if ($count === 0) {
            $this->info('Aucune entree a supprimer.');
            return self::SUCCESS;
        }

        if ($this->option('dry-run')) {
            $this->info("Mode dry-run : {$count} entrees seraient supprimees (anterieures au {$cutoff->toDateString()}).");
            return self::SUCCESS;
        }

        // Suppression par lots pour eviter les problemes de memoire
        $deleted = 0;
        do {
            $batch = ActivityLog::where('created_at', '<', $cutoff)
                ->limit(1000)
                ->delete();
            $deleted += $batch;
        } while ($batch > 0);

        $this->info("{$deleted} entrees supprimees (anterieures au {$cutoff->toDateString()}).");

        return self::SUCCESS;
    }
}
```

### Planification automatique

```php
// routes/console.php (ou app/Console/Kernel.php)
use Illuminate\Support\Facades\Schedule;

Schedule::command('cms:activity:cleanup')->daily()->at('03:00');
```

---

## 8. Controller admin

```php
// app/Http/Controllers/Admin/ActivityLogController.php
<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ActivityLogController extends Controller
{
    public function index(Request $request): Response
    {
        $query = ActivityLog::with('user:id,name,email,avatar')
            ->orderByDesc('created_at');

        // Filtre par utilisateur
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->integer('user_id'));
        }

        // Filtre par action
        if ($request->filled('action')) {
            $query->where('action', $request->string('action'));
        }

        // Filtre par categorie d'action
        if ($request->filled('category')) {
            $query->byActionCategory($request->string('category'));
        }

        // Filtre par type de modele
        if ($request->filled('subject_type')) {
            $query->where('subject_type', $request->string('subject_type'));
        }

        // Filtre par plage de dates
        if ($request->filled('date_from') && $request->filled('date_to')) {
            $query->between($request->string('date_from'), $request->string('date_to'));
        }

        // Recherche textuelle dans properties (JSON)
        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where(function ($q) use ($search) {
                $q->where('properties', 'like', "%{$search}%")
                  ->orWhereHas('user', fn ($uq) => $uq->where('name', 'like', "%{$search}%"));
            });
        }

        $activities = $query->paginate(50)->withQueryString();

        return Inertia::render('Admin/ActivityLog/Index', [
            'activities' => $activities,
            'filters'    => $request->only([
                'user_id', 'action', 'category', 'subject_type',
                'date_from', 'date_to', 'search',
            ]),
            'users'         => User::select('id', 'name')->orderBy('name')->get(),
            'actionTypes'   => $this->getActionTypes(),
            'subjectTypes'  => $this->getSubjectTypes(),
            'categories'    => $this->getCategories(),
        ]);
    }

    protected function getActionTypes(): array
    {
        return [
            'created', 'updated', 'deleted', 'restored', 'published', 'unpublished',
            'login', 'logout', 'login_failed', 'password_changed',
            'user_created', 'role_changed', 'user_deleted',
            'settings_updated',
            'plugin_installed', 'plugin_activated', 'plugin_deactivated', 'plugin_uninstalled',
            'theme_activated', 'theme_customized',
            'backup_created', 'backup_restored', 'cache_cleared',
        ];
    }

    protected function getSubjectTypes(): array
    {
        return ActivityLog::select('subject_type')
            ->whereNotNull('subject_type')
            ->distinct()
            ->pluck('subject_type')
            ->toArray();
    }

    protected function getCategories(): array
    {
        return ['content', 'auth', 'users', 'settings', 'plugins', 'themes', 'system'];
    }
}
```

### Route

```php
// routes/admin.php
Route::middleware(['web', 'auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    // ...
    Route::get('/activity-log', [ActivityLogController::class, 'index'])
        ->name('activity-log.index')
        ->middleware('can:cms.manage,settings.view');
});
```

---

## 9. Page admin React

```tsx
// resources/js/pages/Admin/ActivityLog/Index.tsx
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/layouts/admin-layout';
import { DataTable } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';

interface ActivityLogEntry {
    id: number;
    user_id: number | null;
    action: string;
    subject_type: string | null;
    subject_id: number | null;
    properties: Record<string, unknown> | null;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string;
    user: {
        id: number;
        name: string;
        email: string;
        avatar: string | null;
    } | null;
}

interface Props {
    activities: {
        data: ActivityLogEntry[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
        current_page: number;
        last_page: number;
        total: number;
    };
    filters: Record<string, string>;
    users: Array<{ id: number; name: string }>;
    actionTypes: string[];
    subjectTypes: string[];
    categories: string[];
}

const ACTION_COLORS: Record<string, string> = {
    created: 'bg-green-100 text-green-800',
    updated: 'bg-blue-100 text-blue-800',
    deleted: 'bg-red-100 text-red-800',
    restored: 'bg-yellow-100 text-yellow-800',
    published: 'bg-emerald-100 text-emerald-800',
    unpublished: 'bg-orange-100 text-orange-800',
    login: 'bg-indigo-100 text-indigo-800',
    logout: 'bg-gray-100 text-gray-800',
    login_failed: 'bg-red-100 text-red-800',
    settings_updated: 'bg-purple-100 text-purple-800',
    plugin_installed: 'bg-teal-100 text-teal-800',
    plugin_activated: 'bg-teal-100 text-teal-800',
    plugin_deactivated: 'bg-orange-100 text-orange-800',
    theme_activated: 'bg-pink-100 text-pink-800',
};

const ACTION_LABELS: Record<string, string> = {
    created: 'Cree',
    updated: 'Modifie',
    deleted: 'Supprime',
    restored: 'Restaure',
    published: 'Publie',
    unpublished: 'Depublie',
    login: 'Connexion',
    logout: 'Deconnexion',
    login_failed: 'Echec connexion',
    password_changed: 'Mot de passe modifie',
    user_created: 'Utilisateur cree',
    role_changed: 'Role modifie',
    user_deleted: 'Utilisateur supprime',
    settings_updated: 'Parametres modifies',
    plugin_installed: 'Plugin installe',
    plugin_activated: 'Plugin active',
    plugin_deactivated: 'Plugin desactive',
    plugin_uninstalled: 'Plugin desinstalle',
    theme_activated: 'Theme active',
    theme_customized: 'Theme personnalise',
    backup_created: 'Sauvegarde creee',
    backup_restored: 'Sauvegarde restauree',
    cache_cleared: 'Cache vide',
};

export default function ActivityLogIndex({
    activities,
    filters,
    users,
    actionTypes,
    subjectTypes,
    categories,
}: Props) {
    const [localFilters, setLocalFilters] = useState(filters);

    function applyFilters() {
        router.get(route('admin.activity-log.index'), localFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    }

    function resetFilters() {
        setLocalFilters({});
        router.get(route('admin.activity-log.index'));
    }

    function getSubjectLabel(entry: ActivityLogEntry): string {
        const name = (entry.properties as Record<string, unknown>)?.subject_name as string;
        if (name) return name;
        if (entry.subject_type && entry.subject_id) {
            return `${entry.subject_type} #${entry.subject_id}`;
        }
        return '-';
    }

    return (
        <AdminLayout>
            <Head title="Journal d'activite" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Journal d'activite</h1>
                    <span className="text-sm text-muted-foreground">
                        {activities.total} entrees
                    </span>
                </div>

                {/* Filtres */}
                <div className="grid grid-cols-1 gap-4 rounded-lg border bg-card p-4 md:grid-cols-5">
                    <Input
                        placeholder="Rechercher..."
                        value={localFilters.search ?? ''}
                        onChange={(e) =>
                            setLocalFilters({ ...localFilters, search: e.target.value })
                        }
                    />

                    <Select
                        value={localFilters.user_id ?? ''}
                        onValueChange={(value) =>
                            setLocalFilters({ ...localFilters, user_id: value })
                        }
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Tous les utilisateurs" />
                        </SelectTrigger>
                        <SelectContent>
                            {users.map((user) => (
                                <SelectItem key={user.id} value={String(user.id)}>
                                    {user.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={localFilters.category ?? ''}
                        onValueChange={(value) =>
                            setLocalFilters({ ...localFilters, category: value })
                        }
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Toutes les categories" />
                        </SelectTrigger>
                        <SelectContent>
                            {categories.map((cat) => (
                                <SelectItem key={cat} value={cat}>
                                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={localFilters.subject_type ?? ''}
                        onValueChange={(value) =>
                            setLocalFilters({ ...localFilters, subject_type: value })
                        }
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Tous les types" />
                        </SelectTrigger>
                        <SelectContent>
                            {subjectTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                    {type}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="flex gap-2">
                        <Button onClick={applyFilters}>Filtrer</Button>
                        <Button variant="outline" onClick={resetFilters}>
                            Reset
                        </Button>
                    </div>
                </div>

                {/* Tableau */}
                <DataTable
                    columns={[
                        {
                            header: 'Date',
                            cell: (entry: ActivityLogEntry) => (
                                <time
                                    className="whitespace-nowrap text-sm text-muted-foreground"
                                    dateTime={entry.created_at}
                                >
                                    {new Date(entry.created_at).toLocaleString('fr-FR', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </time>
                            ),
                        },
                        {
                            header: 'Utilisateur',
                            cell: (entry: ActivityLogEntry) =>
                                entry.user ? (
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src={entry.user.avatar ?? undefined} />
                                            <AvatarFallback>
                                                {entry.user.name.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm">{entry.user.name}</span>
                                    </div>
                                ) : (
                                    <span className="text-sm text-muted-foreground">Systeme</span>
                                ),
                        },
                        {
                            header: 'Action',
                            cell: (entry: ActivityLogEntry) => (
                                <Badge
                                    className={
                                        ACTION_COLORS[entry.action] ??
                                        'bg-gray-100 text-gray-800'
                                    }
                                >
                                    {ACTION_LABELS[entry.action] ?? entry.action}
                                </Badge>
                            ),
                        },
                        {
                            header: 'Sujet',
                            cell: (entry: ActivityLogEntry) => (
                                <span className="text-sm">{getSubjectLabel(entry)}</span>
                            ),
                        },
                        {
                            header: 'IP',
                            cell: (entry: ActivityLogEntry) => (
                                <span className="font-mono text-xs text-muted-foreground">
                                    {entry.ip_address ?? '-'}
                                </span>
                            ),
                        },
                    ]}
                    data={activities.data}
                    pagination={activities}
                />
            </div>
        </AdminLayout>
    );
}
```

---

## 10. Conformite RGPD et vie privee

### Anonymisation des adresses IP

Lorsque `CMS_ACTIVITY_LOG_ANONYMIZE_IP=true`, le dernier octet (IPv4) ou les derniers segments (IPv6) sont remplaces par `0` **avant** le stockage en base. L'adresse complete n'est jamais enregistree.

```
192.168.1.42   → 192.168.1.0
2001:db8::1    → 2001:db8::0
```

### Commande d'anonymisation retroactive

Pour anonymiser les IP deja stockees (si l'option est activee apres coup) :

```php
// app/Console/Commands/AnonymizeActivityLogIps.php
<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\ActivityLog;
use Illuminate\Console\Command;

class AnonymizeActivityLogIps extends Command
{
    protected $signature = 'cms:activity:anonymize-ips
                            {--dry-run : Compter les entrees sans les modifier}';

    protected $description = 'Anonymiser les adresses IP dans le journal d\'activite (RGPD)';

    public function handle(): int
    {
        $count = ActivityLog::whereNotNull('ip_address')
            ->where('ip_address', 'NOT LIKE', '%.0')
            ->where('ip_address', 'NOT LIKE', '%::0')
            ->count();

        if ($count === 0) {
            $this->info('Toutes les adresses IP sont deja anonymisees.');
            return self::SUCCESS;
        }

        if ($this->option('dry-run')) {
            $this->info("Mode dry-run : {$count} adresses IP seraient anonymisees.");
            return self::SUCCESS;
        }

        // IPv4 : remplacer le dernier octet par 0
        ActivityLog::whereNotNull('ip_address')
            ->where('ip_address', 'LIKE', '%.%.%.%')
            ->where('ip_address', 'NOT LIKE', '%.0')
            ->update([
                'ip_address' => \DB::raw("CONCAT(SUBSTRING_INDEX(ip_address, '.', 3), '.0')"),
            ]);

        $this->info("{$count} adresses IP anonymisees.");

        return self::SUCCESS;
    }
}
```

### Suppression des donnees utilisateur

Lorsqu'un utilisateur est supprime, le `user_id` est mis a `null` via `nullOnDelete()` dans la migration. Les entrees du log sont conservees mais anonymisees (on ne peut plus identifier l'utilisateur).

### Bonnes pratiques RGPD

1. **Ne pas logger de donnees sensibles** : les mots de passe, tokens et secrets sont exclus via `getActivityExcludedAttributes()`
2. **Retention limitee** : la commande `cms:activity:cleanup` supprime les entrees anciennes selon la configuration
3. **Anonymisation IP** : activable via configuration sans modifier le code
4. **Droit a l'oubli** : la suppression du compte anonymise automatiquement le log (user_id = null)
5. **Acces restreint** : seuls les admins/editeurs avec la permission `settings.view` peuvent consulter le journal

---

## 11. Integration dans le menu admin

```php
// Dans CMSServiceProvider::boot() ou via le hook system
CMS::hook('admin_sidebar', function (&$items) {
    $items[] = [
        'label'    => __('cms.sidebar.activity_log'),
        'icon'     => 'activity',       // Icone Lucide
        'url'      => '/admin/activity-log',
        'position' => 90,               // En bas du menu
        'permission' => 'settings.view',
    ];
});
```

---

## 12. Performance

### Index de la table

Les index definis dans la migration couvrent les requetes les plus frequentes :
- `(subject_type, subject_id)` : afficher l'historique d'une entite specifique
- `(user_id, created_at)` : afficher l'activite d'un utilisateur
- `action` : filtrer par type d'action
- `created_at` : tri chronologique et nettoyage

### Ecriture asynchrone (optionnel)

Pour les sites a fort trafic, le logging peut etre deplace dans une queue :

```php
// app/Jobs/LogActivityJob.php
<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\ActivityLog;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class LogActivityJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        protected array $data,
    ) {}

    public function handle(): void
    {
        ActivityLog::create($this->data);
    }
}
```

```php
// config/cms.php
'activity_log' => [
    // ...
    'queue' => env('CMS_ACTIVITY_LOG_QUEUE', false), // true = ecriture async
],
```

### Volume attendu et nettoyage

| Type de site | Entrees/jour estimees | Taille/an (90 jours retenus) |
|-------------|----------------------|------------------------------|
| Blog simple | 10-50 | < 5 000 entrees |
| Site vitrine | 50-200 | < 18 000 entrees |
| E-commerce actif | 500-2000 | < 180 000 entrees |

Avec le nettoyage automatique a 90 jours, la table reste a une taille raisonnable meme pour les sites actifs.

---

## 13. Relations Eloquent (resume)

```
ActivityLog belongsTo User (user_id, nullable)
ActivityLog morphTo Subject (subject_type + subject_id)

User hasMany ActivityLog
Page morphMany ActivityLog (as subject)
Post morphMany ActivityLog (as subject)
Media morphMany ActivityLog (as subject)
Setting morphMany ActivityLog (as subject)
CmsPlugin morphMany ActivityLog (as subject)
CmsTheme morphMany ActivityLog (as subject)
```

---

## 14. Checklist d'implementation

### Phase 1 (Fondations)
- [ ] Migration `create_activity_log_table`
- [ ] Modele `ActivityLog` avec relations, scopes, casts
- [ ] Service `ActivityLogService` avec methodes de logging
- [ ] Configuration dans `config/cms.php`

### Phase 2 (Logging automatique)
- [ ] Trait `LogsActivity` cree dans `app/CMS/Traits/`
- [ ] Trait applique sur les modeles : Page, Post, Media, Menu, User, Setting
- [ ] Listener `LogFailedLogin` enregistre
- [ ] Logging dans les controllers Auth (login, logout)

### Phase 3 (Logging manuel)
- [ ] Logging dans PluginManager (install, activate, deactivate, uninstall)
- [ ] Logging dans ThemeManager (activate, customize)
- [ ] Logging dans SettingsController (update)
- [ ] Logging dans UserController (create, role_change, delete)
- [ ] Logging des actions backup (create, restore)

### Phase 4 (Interface admin)
- [ ] Controller `ActivityLogController` avec filtres
- [ ] Page Inertia `Admin/ActivityLog/Index.tsx`
- [ ] Integration dans le menu sidebar admin
- [ ] Permission `settings.view` requise pour acceder

### Phase 5 (Maintenance et RGPD)
- [ ] Commande `cms:activity:cleanup` avec option `--days` et `--dry-run`
- [ ] Commande `cms:activity:anonymize-ips` avec option `--dry-run`
- [ ] Planification du nettoyage automatique (daily a 03:00)
- [ ] Tests unitaires pour le service, le trait, et les commandes
