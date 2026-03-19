<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Storage;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

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

    protected $appends = ['avatar_url'];

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
