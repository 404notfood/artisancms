<?php

declare(strict_types=1);

namespace App\Models;

use App\CMS\Traits\HasSiteScope;
use App\CMS\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Menu extends Model
{
    use HasFactory, HasSiteScope, LogsActivity;

    /**
     * Attributs exclus du log d'activite.
     *
     * @var array<int, string>
     */
    protected array $activityExcluded = ['updated_at', 'created_at'];

    /**
     * Attributs de contexte toujours inclus dans le log.
     *
     * @var array<int, string>
     */
    protected array $activityContext = ['name', 'slug'];

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'slug',
        'location',
    ];

    /**
     * @return HasMany<MenuItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(MenuItem::class);
    }

    /**
     * @return HasMany<MenuItem, $this>
     */
    public function rootItems(): HasMany
    {
        return $this->hasMany(MenuItem::class)
            ->whereNull('parent_id')
            ->orderBy('order');
    }
}
