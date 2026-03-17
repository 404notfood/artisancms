<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BlockPattern extends Model
{
    use HasFactory;

    protected $table = 'cms_block_patterns';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'slug',
        'content',
        'category',
        'is_synced',
        'created_by',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'content' => 'array',
            'is_synced' => 'boolean',
        ];
    }

    /**
     * @return BelongsTo<User, BlockPattern>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * @param Builder<BlockPattern> $query
     * @return Builder<BlockPattern>
     */
    public function scopeCategory(Builder $query, string $category): Builder
    {
        return $query->where('category', $category);
    }
}
