<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Block extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'slug',
        'name',
        'category',
        'icon',
        'schema',
        'default_props',
        'is_core',
        'source',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'schema' => 'array',
            'default_props' => 'array',
            'is_core' => 'boolean',
        ];
    }
}
