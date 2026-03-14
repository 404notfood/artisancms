<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class CustomFieldValue extends Model
{
    /**
     * @var string
     */
    protected $table = 'cms_custom_field_values';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'field_id',
        'entity_type',
        'entity_id',
        'value',
    ];

    // ─── Relations ────────────────────────────────────────

    /**
     * @return BelongsTo<CustomField, $this>
     */
    public function field(): BelongsTo
    {
        return $this->belongsTo(CustomField::class, 'field_id');
    }

    /**
     * @return MorphTo<Model, $this>
     */
    public function entity(): MorphTo
    {
        return $this->morphTo();
    }

    // ─── Helpers ──────────────────────────────────────────

    /**
     * Get the decoded value. JSON is decoded for complex types,
     * raw string returned for simple types.
     */
    public function getValue(): mixed
    {
        if ($this->value === null) {
            return null;
        }

        $field = $this->field;
        if ($field === null) {
            return $this->value;
        }

        $complexTypes = ['repeater', 'checkbox'];
        if (in_array($field->type, $complexTypes, true)) {
            $decoded = json_decode($this->value, true);

            return json_last_error() === JSON_ERROR_NONE ? $decoded : $this->value;
        }

        return $this->value;
    }
}
