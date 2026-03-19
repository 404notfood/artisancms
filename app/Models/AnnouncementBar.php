<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class AnnouncementBar extends Model
{
    protected $table = 'cms_announcement_bars';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'message',
        'link_text',
        'link_url',
        'bg_color',
        'text_color',
        'position',
        'dismissible',
        'active',
        'starts_at',
        'ends_at',
        'priority',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'dismissible' => 'boolean',
            'active' => 'boolean',
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
        ];
    }

    /**
     * Get the currently active announcement bar.
     *
     * @param Builder<AnnouncementBar> $query
     * @return Builder<AnnouncementBar>
     */
    public function scopeCurrent(Builder $query): Builder
    {
        return $query->where('active', true)
            ->where(function (Builder $q): void {
                $q->whereNull('starts_at')->orWhere('starts_at', '<=', now());
            })
            ->where(function (Builder $q): void {
                $q->whereNull('ends_at')->orWhere('ends_at', '>=', now());
            })
            ->orderByDesc('priority');
    }
}
