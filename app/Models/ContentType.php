<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class ContentType extends Model
{
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'slug',
        'description',
        'icon',
        'fields',
        'supports',
        'has_archive',
        'public',
        'menu_position',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'fields' => 'array',
            'supports' => 'array',
            'has_archive' => 'boolean',
            'public' => 'boolean',
            'menu_position' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (ContentType $contentType): void {
            if (empty($contentType->slug) && !empty($contentType->name)) {
                $contentType->slug = Str::slug($contentType->name);
            }
        });
    }

    /**
     * @return HasMany<ContentEntry, $this>
     */
    public function entries(): HasMany
    {
        return $this->hasMany(ContentEntry::class);
    }
}
