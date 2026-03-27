<?php

declare(strict_types=1);

namespace App\Models;

use App\CMS\Traits\HasContentFeatures;
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

class Page extends Model
{
    use HasContentFeatures, HasFactory, LogsActivity, Searchable, SoftDeletes;

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
        'status',
        'access_level',
        'rejection_reason',
        'reviewed_by',
        'reviewed_at',
        'template',
        'meta_title',
        'meta_description',
        'meta_keywords',
        'og_image',
        'meta_robots',
        'canonical_url',
        'focus_keyword',
        'parent_id',
        'order',
        'created_by',
        'published_at',
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
            'order' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Page $page): void {
            if (empty($page->slug) && !empty($page->title)) {
                $page->slug = Str::slug($page->title);
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
     * @return BelongsTo<Page, $this>
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Page::class, 'parent_id');
    }

    /**
     * @return HasMany<Page, $this>
     */
    public function children(): HasMany
    {
        return $this->hasMany(Page::class, 'parent_id');
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
     * @param Builder<Page> $query
     * @return Builder<Page>
     */
    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', 'published')
            ->where('published_at', '<=', now());
    }

    /**
     * @param Builder<Page> $query
     * @return Builder<Page>
     */
    public function scopeDraft(Builder $query): Builder
    {
        return $query->where('status', 'draft');
    }

    /**
     * @param Builder<Page> $query
     * @return Builder<Page>
     */
    public function scopePendingReview(Builder $query): Builder
    {
        return $query->where('status', 'pending_review');
    }

    /**
     * @param Builder<Page> $query
     * @return Builder<Page>
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
            'id'               => $this->id,
            'title'            => $this->title,
            'slug'             => $this->slug,
            'meta_description' => $this->meta_description,
            'status'           => $this->status,
        ];
    }

    public function shouldBeSearchable(): bool
    {
        return $this->status === 'published';
    }
}
