<?php

declare(strict_types=1);

namespace MemberSpace\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MemberCustomField extends Model
{
    protected $table = 'member_custom_fields';

    protected $fillable = [
        'name',
        'slug',
        'type',
        'options',
        'placeholder',
        'description',
        'required',
        'show_on_registration',
        'show_on_profile',
        'show_in_directory',
        'admin_only',
        'visibility_roles',
        'validation_rules',
        'order',
        'active',
    ];

    protected function casts(): array
    {
        return [
            'options' => 'array',
            'visibility_roles' => 'array',
            'required' => 'boolean',
            'show_on_registration' => 'boolean',
            'show_on_profile' => 'boolean',
            'show_in_directory' => 'boolean',
            'admin_only' => 'boolean',
            'active' => 'boolean',
            'order' => 'integer',
        ];
    }

    /**
     * @return HasMany<MemberFieldValue, $this>
     */
    public function values(): HasMany
    {
        return $this->hasMany(MemberFieldValue::class, 'field_id');
    }

    /**
     * @param Builder<MemberCustomField> $query
     */
    public function scopeActive(Builder $query): void
    {
        $query->where('active', true);
    }

    /**
     * @param Builder<MemberCustomField> $query
     */
    public function scopeForRegistration(Builder $query): void
    {
        $query->where('show_on_registration', true)->where('active', true);
    }

    /**
     * @param Builder<MemberCustomField> $query
     */
    public function scopeForProfile(Builder $query): void
    {
        $query->where('show_on_profile', true)->where('active', true);
    }

    /**
     * @param Builder<MemberCustomField> $query
     */
    public function scopeForDirectory(Builder $query): void
    {
        $query->where('show_in_directory', true)->where('active', true);
    }

    /**
     * @param Builder<MemberCustomField> $query
     */
    public function scopeOrdered(Builder $query): void
    {
        $query->orderBy('order')->orderBy('name');
    }
}
