<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class CmsTheme extends Model
{
    /**
     * @var string
     */
    protected $table = 'cms_themes';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'slug',
        'name',
        'version',
        'description',
        'author',
        'active',
        'settings',
        'customizations',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'active' => 'boolean',
            'settings' => 'array',
            'customizations' => 'array',
        ];
    }

    /**
     * @param Builder<CmsTheme> $query
     * @return Builder<CmsTheme>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('active', true);
    }
}
