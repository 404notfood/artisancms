<?php

declare(strict_types=1);

namespace FormBuilder\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FormSubmission extends Model
{
    /**
     * The table associated with the model.
     */
    protected $table = 'form_submissions';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'form_id',
        'data',
        'ip_address',
        'user_agent',
        'referrer',
        'status',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'data' => 'array',
        ];
    }

    /**
     * Get the form that owns this submission.
     *
     * @return BelongsTo<Form, $this>
     */
    public function form(): BelongsTo
    {
        return $this->belongsTo(Form::class);
    }

    /**
     * Scope to only new (unread) submissions.
     *
     * @param Builder<FormSubmission> $query
     * @return Builder<FormSubmission>
     */
    public function scopeNew(Builder $query): Builder
    {
        return $query->where('status', 'new');
    }

    /**
     * Scope to only spam submissions.
     *
     * @param Builder<FormSubmission> $query
     * @return Builder<FormSubmission>
     */
    public function scopeSpam(Builder $query): Builder
    {
        return $query->where('status', 'spam');
    }

    /**
     * Scope to filter by a specific status.
     *
     * @param Builder<FormSubmission> $query
     * @return Builder<FormSubmission>
     */
    public function scopeByStatus(Builder $query, string $status): Builder
    {
        return $query->where('status', $status);
    }
}
