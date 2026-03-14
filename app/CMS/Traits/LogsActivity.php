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
     *
     * @return array<int, string>
     */
    public function getActivityExcludedAttributes(): array
    {
        return $this->activityExcluded ?? ['password', 'remember_token', 'two_factor_secret'];
    }

    /**
     * Attributs a toujours inclure dans le log (meme si non modifies)
     * Utile pour donner du contexte (ex: titre de la page)
     *
     * @return array<int, string>
     */
    public function getActivityContextAttributes(): array
    {
        return $this->activityContext ?? [];
    }

    /**
     * Nom lisible du modele pour l'affichage dans le log
     */
    public function getActivitySubjectName(): string
    {
        return $this->title ?? $this->name ?? $this->slug ?? "#{$this->id}";
    }
}
