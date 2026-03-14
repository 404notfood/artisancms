<?php

declare(strict_types=1);

namespace App\CMS;

use App\CMS\Blocks\BlockRegistry;
use App\CMS\Plugins\PluginManager;
use App\CMS\Themes\ThemeManager;
use Illuminate\Support\ServiceProvider;

class CMSServiceProvider extends ServiceProvider
{
    /**
     * Register CMS services as singletons.
     */
    public function register(): void
    {
        $this->app->singleton('cms.hooks', function (): HookManager {
            return new HookManager();
        });

        $this->app->singleton('cms.plugins', function (): PluginManager {
            return new PluginManager();
        });

        $this->app->singleton('cms.themes', function (): ThemeManager {
            return new ThemeManager();
        });

        $this->app->singleton('cms.blocks', function (): BlockRegistry {
            return new BlockRegistry();
        });

        // Bind concrete classes for dependency injection
        $this->app->alias('cms.hooks', HookManager::class);
        $this->app->alias('cms.plugins', PluginManager::class);
        $this->app->alias('cms.themes', ThemeManager::class);
        $this->app->alias('cms.blocks', BlockRegistry::class);
    }

    /**
     * Bootstrap CMS services.
     */
    public function boot(): void
    {
        $this->mergeConfigFrom(
            config_path('cms.php'),
            'cms',
        );

        $this->publishes([
            config_path('cms.php') => config_path('cms.php'),
        ], 'cms-config');

        // Boot enabled plugins (load their service providers, routes, etc.)
        try {
            /** @var PluginManager $pluginManager */
            $pluginManager = $this->app->make(PluginManager::class);
            $pluginManager->loadPlugins();

            $enabledPlugins = \App\Models\CmsPlugin::where('enabled', true)->get();
            foreach ($enabledPlugins as $plugin) {
                $pluginManager->bootPlugin($plugin->slug);
            }
        } catch (\Throwable) {
            // Silently fail if DB is not yet set up (e.g., during installation)
        }
    }
}
