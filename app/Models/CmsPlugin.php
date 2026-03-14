<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CmsPlugin extends Model
{
    /**
     * @var string
     */
    protected $table = 'cms_plugins';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'slug',
        'name',
        'version',
        'description',
        'author',
        'enabled',
        'settings',
        'order',
        'installed_at',
        'activated_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'enabled' => 'boolean',
            'settings' => 'array',
            'order' => 'integer',
            'installed_at' => 'datetime',
            'activated_at' => 'datetime',
        ];
    }
}
