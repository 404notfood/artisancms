<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Site extends Model
{
    use HasFactory;

    /**
     * @var string
     */
    protected $table = 'cms_sites';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'slug',
        'domain',
        'subdomain',
        'is_primary',
        'is_active',
        'settings',
        'branding',
        'locale',
        'timezone',
        'owner_id',
        'expires_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'settings' => 'array',
            'branding' => 'array',
            'is_primary' => 'boolean',
            'is_active' => 'boolean',
            'expires_at' => 'datetime',
        ];
    }

    /**
     * The owner of this site.
     *
     * @return BelongsTo<User, $this>
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /**
     * Users assigned to this site (with pivot role and ownership).
     *
     * @return BelongsToMany<User, $this>
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'cms_site_users')
            ->withPivot(['role_id', 'is_owner'])
            ->withTimestamps();
    }

    /**
     * Design tokens belonging to this site.
     *
     * @return HasMany<DesignToken, $this>
     */
    public function designTokens(): HasMany
    {
        return $this->hasMany(DesignToken::class);
    }

    /**
     * Widget areas belonging to this site.
     *
     * @return HasMany<WidgetArea, $this>
     */
    public function widgetAreas(): HasMany
    {
        return $this->hasMany(WidgetArea::class);
    }

    /**
     * Global sections belonging to this site.
     *
     * @return HasMany<GlobalSection, $this>
     */
    public function globalSections(): HasMany
    {
        return $this->hasMany(GlobalSection::class);
    }

    /**
     * Scope: only active sites.
     *
     * @param Builder<Site> $query
     * @return Builder<Site>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Check if the site has expired.
     */
    public function isExpired(): bool
    {
        if ($this->expires_at === null) {
            return false;
        }

        return $this->expires_at->isPast();
    }

    /**
     * Get the public URL for this site.
     */
    public function getUrl(): string
    {
        if ($this->domain !== null && $this->domain !== '') {
            return 'https://' . $this->domain;
        }

        if ($this->subdomain !== null && $this->subdomain !== '') {
            $baseDomain = config('cms.multisite.base_domain', 'artisancms.dev');

            return 'https://' . $this->subdomain . '.' . $baseDomain;
        }

        return url('/');
    }
}
