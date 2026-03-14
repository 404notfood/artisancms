<?php

declare(strict_types=1);

namespace App\Models;

use App\CMS\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Relations\MorphToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;
use Laravel\Scout\Searchable;

class Post extends Model
{
    use HasFactory, LogsActivity, Searchable, SoftDeletes;

    /**
     * Attributs exclus du log d'activite.
     *
     * @var array<int, string>
     */
    protected array $activityExcluded = ['content', 'updated_at', 'created_at'];

    /**
     * Attributs de contexte toujours inclus dans le log.
     *
     * @var array<int, string>
     */
    protected array $activityContext = ['title', 'slug'];

    /**
     * @var list<string>
     */
    protected $fillable = [
        'title',
        'slug',
        'content',
        'excerpt',
        'status',
        'access_level',
        'rejection_reason',
        'reviewed_by',
        'reviewed_at',
        'featured_image',
        'created_by',
        'published_at',
        'allow_comments',
        'checked_out_by',
        'checked_out_at',
        'locale',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'content' => 'array',
            'published_at' => 'datetime',
            'reviewed_at' => 'datetime',
            'checked_out_at' => 'datetime',
            'allow_comments' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Post $post): void {
            if (empty($post->slug) && !empty($post->title)) {
                $post->slug = Str::slug($post->title);
            }
        });
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    /**
     * @return MorphMany<Revision, $this>
     */
    public function revisions(): MorphMany
    {
        return $this->morphMany(Revision::class, 'revisionable');
    }

    /**
     * @return HasMany<Comment, $this>
     */
    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    /**
     * @return MorphMany<ContentRelation, $this>
     */
    public function relatedContent(): MorphMany
    {
        return $this->morphMany(ContentRelation::class, 'source');
    }

    /**
     * @return MorphToMany<TaxonomyTerm, $this>
     */
    public function terms(): MorphToMany
    {
        return $this->morphToMany(TaxonomyTerm::class, 'termable', 'termables', null, 'term_id');
    }

    /**
     * @return MorphMany<CustomFieldValue, $this>
     */
    public function customFieldValues(): MorphMany
    {
        return $this->morphMany(CustomFieldValue::class, 'entity');
    }

    /**
     * Get a custom field value by field slug.
     */
    public function getCustomField(string $slug): mixed
    {
        $fieldValue = $this->customFieldValues()
            ->whereHas('field', fn ($q) => $q->where('slug', $slug))
            ->with('field')
            ->first();

        return $fieldValue?->getValue();
    }

    /**
     * Set a custom field value by field slug.
     */
    public function setCustomField(string $slug, mixed $value): void
    {
        $field = CustomField::where('slug', $slug)
            ->whereHas('group', fn ($q) => $q->whereJsonContains('applies_to', 'post'))
            ->first();

        if ($field === null) {
            return;
        }

        $storedValue = is_array($value) ? json_encode($value, JSON_UNESCAPED_UNICODE) : (string) $value;

        $this->customFieldValues()->updateOrCreate(
            ['field_id' => $field->id],
            ['value' => $storedValue],
        );
    }

    // ---- Content Locking ----

    /**
     * @return BelongsTo<User, $this>
     */
    public function checkedOutBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'checked_out_by');
    }

    /**
     * Check if this post is currently checked out (lock is less than 30 minutes old).
     */
    public function isCheckedOut(): bool
    {
        return $this->checked_out_by !== null && $this->checked_out_at?->gt(now()->subMinutes(30));
    }

    /**
     * Check if this post is checked out by a specific user.
     */
    public function isCheckedOutBy(User $user): bool
    {
        return $this->checked_out_by === $user->id;
    }

    // ---- Multi-language ----

    /**
     * @return MorphMany<ContentTranslation, $this>
     */
    public function translations(): MorphMany
    {
        return $this->morphMany(ContentTranslation::class, 'source');
    }

    /**
     * Get the translation of this post in a specific locale.
     */
    public function getTranslation(string $locale): ?static
    {
        $translation = $this->translations()->where('target_locale', $locale)->first();

        return $translation ? static::find($translation->target_id) : null;
    }

    /**
     * Get all available locales for this post (including its own locale).
     *
     * @return array<int, string>
     */
    public function getAvailableLocales(): array
    {
        return $this->translations()->pluck('target_locale')->push($this->locale)->unique()->values()->all();
    }

    // ---- Scopes ----

    /**
     * @param Builder<Post> $query
     * @return Builder<Post>
     */
    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', 'published')
            ->where('published_at', '<=', now());
    }

    /**
     * @param Builder<Post> $query
     * @return Builder<Post>
     */
    public function scopeDraft(Builder $query): Builder
    {
        return $query->where('status', 'draft');
    }

    /**
     * @param Builder<Post> $query
     * @return Builder<Post>
     */
    public function scopePendingReview(Builder $query): Builder
    {
        return $query->where('status', 'pending_review');
    }

    /**
     * @param Builder<Post> $query
     * @return Builder<Post>
     */
    public function scopeApproved(Builder $query): Builder
    {
        return $query->where('status', 'approved');
    }

    /**
     * @return array<string, mixed>
     */
    public function toSearchableArray(): array
    {
        return [
            'id'      => $this->id,
            'title'   => $this->title,
            'slug'    => $this->slug,
            'excerpt' => $this->excerpt,
            'status'  => $this->status,
        ];
    }

    public function shouldBeSearchable(): bool
    {
        return $this->status === 'published';
    }
}
