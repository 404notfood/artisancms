<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ActivityLog extends Model
{
    /**
     * Disable default timestamps (only created_at is used).
     */
    public $timestamps = false;

    /**
     * @var string
     */
    protected $table = 'activity_log';

    /**
     * @var list<string>
     */
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

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'properties' => 'array',
            'created_at' => 'datetime',
        ];
    }

    // ─── Relations ────────────────────────────────────────

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return MorphTo<Model, $this>
     */
    public function subject(): MorphTo
    {
        return $this->morphTo();
    }

    // ─── Scopes ───────────────────────────────────────────

    /**
     * Filtrer par sujet (type + id).
     *
     * @param Builder<ActivityLog> $query
     * @return Builder<ActivityLog>
     */
    public function scopeForSubject(Builder $query, string $type, int $id): Builder
    {
        return $query->where('subject_type', $type)->where('subject_id', $id);
    }

    /**
     * Filtrer par utilisateur.
     *
     * @param Builder<ActivityLog> $query
     * @return Builder<ActivityLog>
     */
    public function scopeByUser(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Filtrer par action.
     *
     * @param Builder<ActivityLog> $query
     * @return Builder<ActivityLog>
     */
    public function scopeByAction(Builder $query, string $action): Builder
    {
        return $query->where('action', $action);
    }

    /**
     * Filtrer par categorie d'action.
     *
     * @param Builder<ActivityLog> $query
     * @return Builder<ActivityLog>
     */
    public function scopeByActionCategory(Builder $query, string $category): Builder
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

    /**
     * Filtrer par plage de dates.
     *
     * @param Builder<ActivityLog> $query
     * @return Builder<ActivityLog>
     */
    public function scopeBetween(Builder $query, string $from, string $to): Builder
    {
        return $query->whereBetween('created_at', [$from, $to]);
    }

    // ─── Helpers ──────────────────────────────────────────

    /**
     * Obtenir les anciennes valeurs depuis les proprietes.
     *
     * @return array<string, mixed>
     */
    public function getOldValues(): array
    {
        return $this->properties['old'] ?? [];
    }

    /**
     * Obtenir les nouvelles valeurs depuis les proprietes.
     *
     * @return array<string, mixed>
     */
    public function getNewValues(): array
    {
        return $this->properties['new'] ?? [];
    }

    /**
     * Obtenir la liste des champs modifies.
     *
     * @return array<int, string>
     */
    public function getChangedFields(): array
    {
        $old = $this->getOldValues();
        $new = $this->getNewValues();

        return array_keys(array_diff_assoc($new, $old));
    }

    /**
     * Libelle lisible de l'action pour l'affichage admin.
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
