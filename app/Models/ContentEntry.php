<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class ContentEntry extends Model
{
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'content_type_id',
        'title',
        'slug',
        'content',
        'excerpt',
        'featured_image',
        'status',
        'fields_data',
        'created_by',
        'published_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'content' => 'array',
            'fields_data' => 'array',
            'published_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (ContentEntry $entry): void {
            if (empty($entry->slug) && !empty($entry->title)) {
                $entry->slug = Str::slug($entry->title);
            }
        });
    }

    /**
     * @return BelongsTo<ContentType, $this>
     */
    public function contentType(): BelongsTo
    {
        return $this->belongsTo(ContentType::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * @param Builder<ContentEntry> $query
     * @return Builder<ContentEntry>
     */
    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', 'published')
            ->where(function (Builder $q): void {
                $q->whereNull('published_at')
                    ->orWhere('published_at', '<=', now());
            });
    }

    /**
     * @param Builder<ContentEntry> $query
     * @return Builder<ContentEntry>
     */
    public function scopeByType(Builder $query, int $contentTypeId): Builder
    {
        return $query->where('content_type_id', $contentTypeId);
    }
}
