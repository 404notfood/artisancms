<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class PreviewToken extends Model
{
    /**
     * @var string
     */
    protected $table = 'cms_preview_tokens';

    /**
     * Disable updated_at (table only has created_at).
     */
    public $timestamps = false;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'previewable_type',
        'previewable_id',
        'token',
        'expires_at',
        'created_by',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'created_at' => 'datetime',
        ];
    }

    // ─── Relations ────────────────────────────────────────

    /**
     * @return MorphTo<Model, $this>
     */
    public function previewable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // ─── Scopes ───────────────────────────────────────────

    /**
     * Tokens non expires.
     *
     * @param Builder<PreviewToken> $query
     * @return Builder<PreviewToken>
     */
    public function scopeValid(Builder $query): Builder
    {
        return $query->where('expires_at', '>', now());
    }

    // ─── Methods ──────────────────────────────────────────

    /**
     * Verifier si le token est expire.
     */
    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }
}
