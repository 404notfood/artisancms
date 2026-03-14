<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphToMany;

class TaxonomyTerm extends Model
{
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'taxonomy_id',
        'name',
        'slug',
        'description',
        'parent_id',
        'order',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'order' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<Taxonomy, $this>
     */
    public function taxonomy(): BelongsTo
    {
        return $this->belongsTo(Taxonomy::class);
    }

    /**
     * @return BelongsTo<TaxonomyTerm, $this>
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(TaxonomyTerm::class, 'parent_id');
    }

    /**
     * @return HasMany<TaxonomyTerm, $this>
     */
    public function children(): HasMany
    {
        return $this->hasMany(TaxonomyTerm::class, 'parent_id');
    }

    /**
     * @return MorphToMany<Page, $this>
     */
    public function pages(): MorphToMany
    {
        return $this->morphedByMany(Page::class, 'termable', 'termables');
    }

    /**
     * @return MorphToMany<Post, $this>
     */
    public function posts(): MorphToMany
    {
        return $this->morphedByMany(Post::class, 'termable', 'termables');
    }
}
