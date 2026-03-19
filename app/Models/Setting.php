<?php

declare(strict_types=1);

namespace App\Models;

use App\CMS\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    use HasFactory, LogsActivity;

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
    protected array $activityContext = ['group', 'key'];

    /**
     * @var list<string>
     */
    protected $fillable = [
        'group',
        'key',
        'value',
        'type',
        'is_public',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'value' => 'json',
            'is_public' => 'boolean',
        ];
    }

    /**
     * Get a setting value by key.
     * Supports 'group.key' format (e.g., 'site.name').
     */
    public static function get(string $key, mixed $default = null): mixed
    {
        if (str_contains($key, '.')) {
            [$group, $settingKey] = explode('.', $key, 2);

            $setting = static::where('group', $group)
                ->where('key', $settingKey)
                ->first();
        } else {
            $setting = static::where('key', $key)->first();
        }

        return $setting?->value ?? $default;
    }

    /**
     * Set a setting value by key.
     * Supports 'group.key' format (e.g., 'site.name').
     */
    public static function set(string $key, mixed $value): void
    {
        $group = 'general';
        $settingKey = $key;

        if (str_contains($key, '.')) {
            [$group, $settingKey] = explode('.', $key, 2);
        }

        static::updateOrCreate(
            ['group' => $group, 'key' => $settingKey],
            ['value' => $value],
        );
    }
}
