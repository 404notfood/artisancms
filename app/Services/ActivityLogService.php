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

    /**
     * Log un evenement de modele Eloquent (appele par le trait LogsActivity).
     */
    public function logModelEvent(Model $model, string $action): void
    {
        // Ne pas logger le modele ActivityLog lui-meme
        if ($model instanceof ActivityLog) {
            return;
        }

        // Verifier si le logging est active
        if (!config('cms.activity_log.enabled', true)) {
            return;
        }

        // Verifier si l'action est exclue
        $excludedActions = config('cms.activity_log.excluded_actions', []);
        if (in_array($action, $excludedActions, true)) {
            return;
        }

        // Verifier si le modele est exclu
        $excludedModels = config('cms.activity_log.excluded_models', []);
        if (in_array(get_class($model), $excludedModels, true)) {
            return;
        }

        $properties = $this->buildModelProperties($model, $action);

        $this->log(
            action: $action,
            subjectType: $model->getMorphClass(),
            subjectId: (int) $model->getKey(),
            properties: $properties,
        );
    }

    /**
     * Construit les proprietes (old/new/context) pour le log d'un evenement de modele.
     *
     * @return array<string, mixed>
     */
    private function buildModelProperties(Model $model, string $action): array
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
     * Enregistrer une action dans le journal d'activite.
     *
     * @param array<string, mixed> $properties
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

    /**
     * Log une connexion reussie.
     */
    public function logLogin(int $userId): ActivityLog
    {
        return $this->log(
            action: 'login',
            userId: $userId,
        );
    }

    /**
     * Log une deconnexion.
     */
    public function logLogout(): ActivityLog
    {
        return $this->log(action: 'logout');
    }

    /**
     * Log une tentative de connexion echouee.
     */
    public function logFailedLogin(string $email): ActivityLog
    {
        return $this->log(
            action: 'login_failed',
            properties: ['email' => $email],
            userId: null,
        );
    }

    /**
     * Log une modification des parametres.
     *
     * @param array<string, mixed> $oldValues
     * @param array<string, mixed> $newValues
     */
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

    /**
     * Log un evenement de plugin (plugin_installed, plugin_activated, etc.).
     */
    public function logPluginEvent(string $slug, string $action): ActivityLog
    {
        return $this->log(
            action: $action,
            subjectType: 'cms_plugin',
            properties: ['slug' => $slug],
        );
    }

    /**
     * Log un evenement de theme (theme_activated, theme_customized).
     */
    public function logThemeEvent(string $slug, string $action): ActivityLog
    {
        return $this->log(
            action: $action,
            subjectType: 'cms_theme',
            properties: ['slug' => $slug],
        );
    }

    /**
     * Log un evenement de backup (backup_created, backup_restored).
     *
     * @param array<string, mixed> $metadata
     */
    public function logBackup(string $action, array $metadata = []): ActivityLog
    {
        return $this->log(
            action: $action,
            properties: $metadata,
        );
    }

    /**
     * Log un changement de role utilisateur.
     */
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

    /**
     * Obtenir l'adresse IP du client, avec anonymisation optionnelle.
     */
    private function getIpAddress(): ?string
    {
        $ip = Request::ip();

        // Anonymisation RGPD si activee
        if (config('cms.activity_log.anonymize_ip', false)) {
            return $this->anonymizeIp($ip);
        }

        return $ip;
    }

    /**
     * Obtenir le User-Agent du client, tronque a 500 caracteres.
     */
    private function getUserAgent(): ?string
    {
        $ua = Request::userAgent();

        // Tronquer a 500 caracteres max
        return $ua ? mb_substr($ua, 0, 500) : null;
    }

    /**
     * Anonymiser une adresse IP (remplacer le dernier octet/segment).
     * IPv4 : 192.168.1.42 -> 192.168.1.0
     * IPv6 : 2001:db8::1  -> 2001:db8::0
     */
    private function anonymizeIp(?string $ip): ?string
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
