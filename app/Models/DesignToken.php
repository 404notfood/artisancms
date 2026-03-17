<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DesignToken extends Model
{
    use HasFactory;

    protected $table = 'cms_design_tokens';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'slug',
        'category',
        'value',
        'order',
        'site_id',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'value' => 'array',
            'order' => 'integer',
        ];
    }

    /**
     * @param Builder<DesignToken> $query
     * @return Builder<DesignToken>
     */
    public function scopeCategory(Builder $query, string $category): Builder
    {
        return $query->where('category', $category);
    }

    /**
     * @param Builder<DesignToken> $query
     * @return Builder<DesignToken>
     */
    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('order')->orderBy('name');
    }

    /**
     * Generate a CSS variable name from the token slug.
     */
    public function getCssVariableAttribute(): string
    {
        return '--token-' . $this->slug;
    }
}
