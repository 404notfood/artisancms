<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\CMS\Traits\LogsActivity;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Storage;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, LogsActivity, Notifiable;

    /** @var array<int, string> */
    protected array $activityExcluded = ['password', 'remember_token', 'two_factor_secret', 'updated_at', 'created_at'];

    /** @var array<int, string> */
    protected array $activityContext = ['name', 'email'];

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role_id',
        'avatar',
        'bio',
        'social_links',
        'profile_visibility',
        'preferences',
        'email_verified_at',
    ];

    protected $appends = ['avatar_url', 'avatar_display_url'];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'preferences' => 'array',
            'social_links' => 'array',
        ];
    }

    /**
     * @return BelongsTo<Role, $this>
     */
    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    /**
     * @return HasMany<Page, $this>
     */
    public function pages(): HasMany
    {
        return $this->hasMany(Page::class, 'created_by');
    }

    /**
     * @return HasMany<Post, $this>
     */
    public function posts(): HasMany
    {
        return $this->hasMany(Post::class, 'created_by');
    }

    /**
     * @return HasMany<Media, $this>
     */
    public function media(): HasMany
    {
        return $this->hasMany(Media::class, 'uploaded_by');
    }

    /**
     * Sites owned by this user.
     *
     * @return HasMany<Site, $this>
     */
    public function ownedSites(): HasMany
    {
        return $this->hasMany(Site::class, 'owner_id');
    }

    /**
     * Sites this user is assigned to (via pivot table).
     *
     * @return BelongsToMany<Site, $this>
     */
    public function sites(): BelongsToMany
    {
        return $this->belongsToMany(Site::class, 'cms_site_users')
            ->withPivot(['role_id', 'is_owner'])
            ->withTimestamps();
    }

    /**
     * Check if the user has a specific permission.
     * Supports wildcard patterns like 'pages.*'.
     */
    public function hasPermission(string $permission): bool
    {
        $role = $this->role;

        if ($role === null || !is_array($role->permissions)) {
            return false;
        }

        $permissions = $role->permissions;

        if (in_array('*', $permissions, true)) {
            return true;
        }

        if (in_array($permission, $permissions, true)) {
            return true;
        }

        // Check wildcard permissions (e.g., 'pages.*' matches 'pages.create')
        foreach ($permissions as $perm) {
            if (str_contains($perm, '*')) {
                $pattern = str_replace('\*', '.*', preg_quote($perm, '/'));
                if (preg_match('/^' . $pattern . '$/', $permission)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Get the avatar URL.
     */
    public function getAvatarUrlAttribute(): ?string
    {
        if (! $this->avatar) {
            return null;
        }

        return Storage::url($this->avatar);
    }

    /**
     * Get the Gravatar URL based on the user's email.
     */
    public function getGravatarUrlAttribute(): string
    {
        $hash = md5(strtolower(trim($this->email ?? '')));

        return "https://www.gravatar.com/avatar/{$hash}?s=80&d=mp";
    }

    /**
     * Get the display avatar URL with Gravatar fallback.
     * Uses the uploaded avatar if available, otherwise falls back to Gravatar.
     */
    public function getAvatarDisplayUrlAttribute(): string
    {
        return $this->avatar_url ?? $this->gravatar_url;
    }

    /**
     * Scope to filter users by profile visibility.
     *
     * @param Builder<User> $query
     * @return Builder<User>
     */
    public function scopeVisibleTo(Builder $query, ?User $viewer = null): Builder
    {
        if ($viewer?->isAdmin()) {
            return $query;
        }

        return $query->where(function (Builder $q) use ($viewer) {
            $q->where('profile_visibility', 'public');

            if ($viewer !== null) {
                $q->orWhere('profile_visibility', 'members_only');
                $q->orWhere('id', $viewer->id);
            }
        });
    }

    /**
     * Check if the user has the admin role.
     */
    public function isAdmin(): bool
    {
        return $this->role?->slug === 'admin';
    }
}
