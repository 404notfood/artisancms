<?php

declare(strict_types=1);

namespace Backup\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Backup extends Model
{
    /**
     * The table associated with the model.
     */
    protected $table = 'cms_backups';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'filename',
        'path',
        'disk',
        'size',
        'type',
        'status',
        'metadata',
        'error_message',
        'started_at',
        'completed_at',
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
            'metadata' => 'array',
            'size' => 'integer',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    // -------------------------------------------------------------------------
    // Relations
    // -------------------------------------------------------------------------

    /**
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // -------------------------------------------------------------------------
    // Scopes
    // -------------------------------------------------------------------------

    /**
     * Scope to only completed backups.
     *
     * @param Builder<self> $query
     * @return Builder<self>
     */
    public function scopeCompleted(Builder $query): Builder
    {
        return $query->where('status', 'completed');
    }

    /**
     * Scope to only failed backups.
     *
     * @param Builder<self> $query
     * @return Builder<self>
     */
    public function scopeFailed(Builder $query): Builder
    {
        return $query->where('status', 'failed');
    }

    /**
     * Scope to order by latest first.
     *
     * @param Builder<self> $query
     * @return Builder<self>
     */
    public function scopeLatest(Builder $query): Builder
    {
        return $query->orderByDesc('created_at');
    }

    // -------------------------------------------------------------------------
    // Accessors
    // -------------------------------------------------------------------------

    /**
     * Get a human-readable file size.
     */
    public function getSizeForHumansAttribute(): string
    {
        $bytes = $this->size;

        if ($bytes === 0) {
            return '0 B';
        }

        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $i = 0;

        while ($bytes >= 1024 && $i < count($units) - 1) {
            $bytes /= 1024;
            $i++;
        }

        return round($bytes, 2) . ' ' . $units[$i];
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Check whether this backup completed successfully.
     */
    public function isComplete(): bool
    {
        return $this->status === 'completed';
    }

    /**
     * Check whether this backup failed.
     */
    public function isFailed(): bool
    {
        return $this->status === 'failed';
    }

    /**
     * Mark the backup as running.
     */
    public function markAsRunning(): void
    {
        $this->update([
            'status' => 'running',
            'started_at' => now(),
        ]);
    }

    /**
     * Mark the backup as completed.
     */
    public function markAsCompleted(int $size, array $metadata = []): void
    {
        $this->update([
            'status' => 'completed',
            'size' => $size,
            'metadata' => $metadata,
            'completed_at' => now(),
        ]);
    }

    /**
     * Mark the backup as failed.
     */
    public function markAsFailed(string $errorMessage): void
    {
        // Sanitize encoding — Windows cmd.exe outputs CP850/CP1252, MySQL expects UTF-8
        $clean = mb_convert_encoding($errorMessage, 'UTF-8', 'UTF-8');
        $clean = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x80-\x9F]/u', '?', $clean) ?? $clean;

        $this->update([
            'status' => 'failed',
            'error_message' => mb_substr($clean, 0, 2000),
            'completed_at' => now(),
        ]);
    }
}
