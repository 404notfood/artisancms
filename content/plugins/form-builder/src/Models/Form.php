<?php

declare(strict_types=1);

namespace FormBuilder\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Form extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     */
    protected $table = 'forms';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'slug',
        'fields',
        'settings',
        'notifications',
        'confirmation',
        'spam_protection',
        'is_active',
        'created_by',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'fields' => 'array',
            'settings' => 'array',
            'notifications' => 'array',
            'confirmation' => 'array',
            'spam_protection' => 'array',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Get the submissions for this form.
     *
     * @return HasMany<FormSubmission, $this>
     */
    public function submissions(): HasMany
    {
        return $this->hasMany(FormSubmission::class);
    }

    /**
     * Get the user who created this form.
     *
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Scope to only active forms.
     *
     * @param Builder<Form> $query
     * @return Builder<Form>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Get the field names from the form fields definition.
     *
     * @return array<int, string>
     */
    public function getFieldNames(): array
    {
        $fields = $this->fields;

        if (!is_array($fields)) {
            return [];
        }

        $names = [];

        foreach ($fields as $field) {
            if (isset($field['name']) && !in_array($field['type'] ?? '', ['heading', 'paragraph', 'divider'], true)) {
                $names[] = $field['name'];
            }
        }

        return $names;
    }
}
