<?php

declare(strict_types=1);

namespace ContactForm\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class FormSubmission extends Model
{
    /**
     * @var string
     */
    protected $table = 'form_submissions';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'form_name',
        'data',
        'ip_address',
        'user_agent',
        'read_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'data' => 'array',
            'read_at' => 'datetime',
        ];
    }

    /**
     * Scope to filter unread submissions.
     *
     * @param Builder<FormSubmission> $query
     * @return Builder<FormSubmission>
     */
    public function scopeUnread(Builder $query): Builder
    {
        return $query->whereNull('read_at');
    }

    /**
     * Scope to filter by form name.
     *
     * @param Builder<FormSubmission> $query
     * @return Builder<FormSubmission>
     */
    public function scopeForForm(Builder $query, string $formName): Builder
    {
        return $query->where('form_name', $formName);
    }

    /**
     * Mark this submission as read.
     */
    public function markAsRead(): bool
    {
        return $this->update(['read_at' => now()]);
    }

    /**
     * Check if this submission has been read.
     */
    public function isRead(): bool
    {
        return $this->read_at !== null;
    }
}
