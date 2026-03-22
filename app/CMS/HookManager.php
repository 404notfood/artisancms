<?php

declare(strict_types=1);

namespace App\CMS;

class HookManager
{
    /**
     * Registered hooks (actions).
     *
     * @var array<string, array<int, list<callable>>>
     */
    private array $hooks = [];

    /**
     * Registered filters.
     *
     * @var array<string, array<int, list<callable>>>
     */
    private array $filters = [];

    /**
     * Register a hook (action) callback.
     */
    public function hook(string $name, callable $callback, int $priority = 10): void
    {
        $this->hooks[$name][$priority][] = $callback;
    }

    /**
     * Fire all callbacks for a given hook, sorted by priority.
     */
    public function fire(string $name, mixed ...$args): void
    {
        if (!isset($this->hooks[$name])) {
            return;
        }

        $callbacks = $this->hooks[$name];
        ksort($callbacks);

        foreach ($callbacks as $priorityCallbacks) {
            foreach ($priorityCallbacks as $callback) {
                try {
                    $callback(...$args);
                } catch (\Throwable $e) {
                    report($e);
                }
            }
        }
    }

    /**
     * Register a filter callback.
     */
    public function filter(string $name, callable $callback, int $priority = 10): void
    {
        $this->filters[$name][$priority][] = $callback;
    }

    /**
     * Apply all filter callbacks in priority order, passing the value through each.
     */
    public function applyFilter(string $name, mixed $value, mixed ...$args): mixed
    {
        if (!isset($this->filters[$name])) {
            return $value;
        }

        $callbacks = $this->filters[$name];
        ksort($callbacks);

        foreach ($callbacks as $priorityCallbacks) {
            foreach ($priorityCallbacks as $callback) {
                $value = $callback($value, ...$args);
            }
        }

        return $value;
    }

    /**
     * Check if a hook has any registered callbacks.
     */
    public function hasHook(string $name): bool
    {
        return isset($this->hooks[$name]) && count($this->hooks[$name]) > 0;
    }

    /**
     * Check if a filter has any registered callbacks.
     */
    public function hasFilter(string $name): bool
    {
        return isset($this->filters[$name]) && count($this->filters[$name]) > 0;
    }

    /**
     * Remove all callbacks for a given hook.
     */
    public function removeHook(string $name): void
    {
        unset($this->hooks[$name]);
    }

    /**
     * Remove all callbacks for a given filter.
     */
    public function removeFilter(string $name): void
    {
        unset($this->filters[$name]);
    }
}
