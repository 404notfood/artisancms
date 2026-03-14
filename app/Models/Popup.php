<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Popup extends Model
{
    use HasFactory;

    protected $table = 'cms_popups';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'title',
        'content',
        'type',
        'trigger',
        'trigger_value',
        'display_frequency',
        'pages',
        'cta_text',
        'cta_url',
        'style',
        'active',
        'starts_at',
        'ends_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'pages' => 'array',
            'style' => 'array',
            'active' => 'boolean',
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
        ];
    }

    /**
     * @param Builder<Popup> $query
     * @return Builder<Popup>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('active', true);
    }

    /**
     * @param Builder<Popup> $query
     * @return Builder<Popup>
     */
    public function scopeCurrent(Builder $query): Builder
    {
        return $query->where(function (Builder $q) {
            $q->whereNull('starts_at')->orWhere('starts_at', '<=', now());
        })->where(function (Builder $q) {
            $q->whereNull('ends_at')->orWhere('ends_at', '>=', now());
        });
    }
}
