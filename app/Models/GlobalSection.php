<?php

declare(strict_types=1);

namespace App\Models;

use App\CMS\Traits\HasSiteScope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class GlobalSection extends Model
{
    use HasFactory;
    use HasSiteScope;

    /**
     * @var string
     */
    protected $table = 'cms_global_sections';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'slug',
        'type',
        'content',
        'status',
        'site_id',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'content' => 'array',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (GlobalSection $section): void {
            if (empty($section->slug) && !empty($section->name)) {
                $section->slug = Str::slug($section->name);
            }
        });
    }

    /**
     * @return BelongsTo<Site, $this>
     */
    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }

    /**
     * Scope: only active sections.
     *
     * @param Builder<GlobalSection> $query
     * @return Builder<GlobalSection>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope: only headers.
     *
     * @param Builder<GlobalSection> $query
     * @return Builder<GlobalSection>
     */
    public function scopeHeaders(Builder $query): Builder
    {
        return $query->where('type', 'header');
    }

    /**
     * Scope: only footers.
     *
     * @param Builder<GlobalSection> $query
     * @return Builder<GlobalSection>
     */
    public function scopeFooters(Builder $query): Builder
    {
        return $query->where('type', 'footer');
    }
}
