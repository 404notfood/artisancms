<?php

declare(strict_types=1);

namespace MemberSpace\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MemberProfile extends Model
{
    protected $table = 'member_profiles';

    protected $fillable = [
        'user_id',
        'display_name',
        'first_name',
        'last_name',
        'bio',
        'avatar',
        'cover_photo',
        'phone',
        'website',
        'location',
        'birth_date',
        'gender',
        'company',
        'job_title',
        'social_links',
        'profile_visibility',
        'show_in_directory',
        'show_email',
        'show_phone',
        'profile_completion',
        'last_active_at',
    ];

    protected function casts(): array
    {
        return [
            'social_links' => 'array',
            'show_in_directory' => 'boolean',
            'show_email' => 'boolean',
            'show_phone' => 'boolean',
            'profile_completion' => 'integer',
            'birth_date' => 'date',
            'last_active_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @param Builder<MemberProfile> $query
     */
    public function scopeVisible(Builder $query, ?User $viewer = null): void
    {
        if ($viewer?->isAdmin()) {
            return;
        }

        if ($viewer) {
            $query->whereIn('profile_visibility', ['public', 'members_only']);
        } else {
            $query->where('profile_visibility', 'public');
        }
    }

    /**
     * @param Builder<MemberProfile> $query
     */
    public function scopeInDirectory(Builder $query): void
    {
        $query->where('show_in_directory', true);
    }

    /**
     * @param Builder<MemberProfile> $query
     */
    public function scopeSearch(Builder $query, string $term): void
    {
        $query->where(function (Builder $q) use ($term) {
            $q->where('display_name', 'like', "%{$term}%")
                ->orWhere('bio', 'like', "%{$term}%")
                ->orWhere('location', 'like', "%{$term}%")
                ->orWhere('company', 'like', "%{$term}%");
        });
    }

    public function getFullNameAttribute(): string
    {
        if ($this->first_name || $this->last_name) {
            return trim("{$this->first_name} {$this->last_name}");
        }

        return $this->display_name ?? $this->user?->name ?? '';
    }
}
