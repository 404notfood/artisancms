<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Redirect extends Model
{
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'source_path',
        'target_url',
        'status_code',
        'hits',
        'active',
        'note',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status_code' => 'integer',
            'hits' => 'integer',
            'active' => 'boolean',
        ];
    }

    /**
     * Scope to get only active redirects.
     *
     * @param Builder<Redirect> $query
     * @return Builder<Redirect>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('active', true);
    }
}
