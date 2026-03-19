<?php

declare(strict_types=1);

namespace MemberSpace\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ContentRestriction extends Model
{
    protected $table = 'content_restrictions';

    protected $fillable = [
        'restrictable_type',
        'restrictable_id',
        'restriction_type',
        'allowed_roles',
        'allowed_plans',
        'redirect_url',
        'restricted_message',
        'show_excerpt',
        'active',
    ];

    protected function casts(): array
    {
        return [
            'allowed_roles' => 'array',
            'allowed_plans' => 'array',
            'show_excerpt' => 'boolean',
            'active' => 'boolean',
        ];
    }

    /**
     * @return MorphTo<Model, $this>
     */
    public function restrictable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * @param Builder<ContentRestriction> $query
     */
    public function scopeActive(Builder $query): void
    {
        $query->where('active', true);
    }
}
