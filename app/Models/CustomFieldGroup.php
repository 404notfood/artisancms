<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CustomFieldGroup extends Model
{
    /**
     * @var string
     */
    protected $table = 'cms_custom_field_groups';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'slug',
        'description',
        'applies_to',
        'position',
        'order',
        'active',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'applies_to' => 'array',
            'order'      => 'integer',
            'active'     => 'boolean',
        ];
    }

    // ─── Relations ────────────────────────────────────────

    /**
     * @return HasMany<CustomField, $this>
     */
    public function fields(): HasMany
    {
        return $this->hasMany(CustomField::class, 'group_id')->orderBy('order');
    }

    // ─── Scopes ───────────────────────────────────────────

    /**
     * Filter only active groups.
     *
     * @param Builder<CustomFieldGroup> $query
     * @return Builder<CustomFieldGroup>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('active', true);
    }

    /**
     * Filter groups that apply to a specific entity type.
     * Supports simple types ('page', 'post') and template-specific
     * entries like 'page:template:landing'.
     *
     * @param Builder<CustomFieldGroup> $query
     * @return Builder<CustomFieldGroup>
     */
    public function scopeForEntity(Builder $query, string $type, ?string $template = null): Builder
    {
        return $query->where(function (Builder $q) use ($type, $template): void {
            $q->whereJsonContains('applies_to', $type);

            if ($template !== null) {
                $q->orWhereJsonContains('applies_to', "{$type}:template:{$template}");
            }
        });
    }
}
