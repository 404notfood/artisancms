<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Taxonomy extends Model
{
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'slug',
        'type',
        'description',
        'hierarchical',
        'applies_to',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'hierarchical' => 'boolean',
            'applies_to' => 'array',
        ];
    }

    /**
     * @return HasMany<TaxonomyTerm, $this>
     */
    public function terms(): HasMany
    {
        return $this->hasMany(TaxonomyTerm::class);
    }
}
