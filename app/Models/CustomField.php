<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CustomField extends Model
{
    /**
     * @var string
     */
    protected $table = 'cms_custom_fields';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'group_id',
        'name',
        'slug',
        'type',
        'description',
        'placeholder',
        'default_value',
        'options',
        'validation',
        'order',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'options'    => 'array',
            'validation' => 'array',
            'order'      => 'integer',
        ];
    }

    // ─── Relations ────────────────────────────────────────

    /**
     * @return BelongsTo<CustomFieldGroup, $this>
     */
    public function group(): BelongsTo
    {
        return $this->belongsTo(CustomFieldGroup::class, 'group_id');
    }

    /**
     * @return HasMany<CustomFieldValue, $this>
     */
    public function values(): HasMany
    {
        return $this->hasMany(CustomFieldValue::class, 'field_id');
    }

    // ─── Helpers ──────────────────────────────────────────

    /**
     * Available field types.
     *
     * @return list<string>
     */
    public static function availableTypes(): array
    {
        return [
            'text',
            'textarea',
            'wysiwyg',
            'number',
            'email',
            'url',
            'select',
            'checkbox',
            'radio',
            'image',
            'file',
            'date',
            'datetime',
            'color',
            'repeater',
        ];
    }
}
