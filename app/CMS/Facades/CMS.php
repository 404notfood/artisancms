<?php

declare(strict_types=1);

namespace App\CMS\Facades;

use App\CMS\HookManager;
use Illuminate\Support\Facades\Facade;

/**
 * @method static void hook(string $name, callable $callback, int $priority = 10)
 * @method static void fire(string $name, mixed ...$args)
 * @method static void filter(string $name, callable $callback, int $priority = 10)
 * @method static mixed applyFilter(string $name, mixed $value, mixed ...$args)
 * @method static bool hasHook(string $name)
 * @method static bool hasFilter(string $name)
 * @method static void removeHook(string $name)
 * @method static void removeFilter(string $name)
 *
 * @see \App\CMS\HookManager
 */
class CMS extends Facade
{
    protected static function getFacadeAccessor(): string
    {
        return 'cms.hooks';
    }
}
