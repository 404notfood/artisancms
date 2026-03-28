<?php

declare(strict_types=1);

namespace App\Models;

use App\CMS\Blocks\BlockTextExtractor;
use App\CMS\Traits\HasContentFeatures;
use App\CMS\Traits\HasSiteScope;
use App\CMS\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;
use Laravel\Scout\Searchable;

class Post extends Model
{
    use HasContentFeatures, HasFactory, HasSiteScope, LogsActivity, Searchable, SoftDeletes;

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
        'meta_title',
        'meta_description',
        'meta_keywords',
        'og_image',
        'meta_robots',
        'canonical_url',
        'focus_keyword',
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

    // ---- Relations ----

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
     * @return HasMany<Comment, $this>
     */
    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    /**
     * @return MorphMany<PageView, $this>
     */
    public function pageViews(): MorphMany
    {
        return $this->morphMany(PageView::class, 'viewable');
    }

    /**
     * @return MorphMany<ActivityLog, $this>
     */
    public function activityLogs(): MorphMany
    {
        return $this->morphMany(ActivityLog::class, 'subject');
    }

    /**
     * @return MorphMany<PreviewToken, $this>
     */
    public function previewTokens(): MorphMany
    {
        return $this->morphMany(PreviewToken::class, 'previewable');
    }

    /**
     * @return MorphMany<MediaUsage, $this>
     */
    public function mediaUsages(): MorphMany
    {
        return $this->morphMany(MediaUsage::class, 'usable');
    }

    // ---- Scopes ----

    /**
     * @param Builder<Post> $query
     * @return Builder<Post>
     */
    public function scopePublished(Builder $query): Builder
    {
        $referenceDate = app()->bound('cms.preview_at')
            ? app('cms.preview_at')
            : now();

        return $query->where('status', 'published')
            ->where('published_at', '<=', $referenceDate);
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

    // ---- Search ----

    /**
     * @return array<string, mixed>
     */
    public function toSearchableArray(): array
    {
        return [
            'id'            => $this->id,
            'title'         => $this->title,
            'slug'          => $this->slug,
            'excerpt'       => $this->excerpt,
            'content_text'  => Str::limit(BlockTextExtractor::extract($this->content), 5000),
            'meta_title'    => $this->meta_title,
            'meta_keywords' => $this->meta_keywords,
            'published_at'  => $this->published_at?->toIso8601String(),
        ];
    }

    public function shouldBeSearchable(): bool
    {
        return $this->status === 'published'
            && $this->published_at !== null
            && $this->published_at->lte(now());
    }
}
