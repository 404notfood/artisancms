<?php

declare(strict_types=1);

namespace App\Providers;

use App\Models\Block;
use App\Models\CmsPlugin;
use App\Models\CmsTheme;
use App\Models\Media;
use App\Models\Menu;
use App\Models\Page;
use App\Models\Post;
use App\Models\Role;
use App\Models\Setting;
use App\Models\Taxonomy;
use App\Observers\BlockObserver;
use App\Observers\MenuObserver;
use App\Observers\PageObserver;
use App\Observers\PluginObserver;
use App\Observers\SettingObserver;
use App\Observers\ThemeObserver;
use App\Policies\MediaPolicy;
use App\Policies\MenuPolicy;
use App\Policies\PagePolicy;
use App\Policies\PluginPolicy;
use App\Policies\PostPolicy;
use App\Policies\RolePolicy;
use App\Policies\SettingPolicy;
use App\Policies\TaxonomyPolicy;
use App\Policies\ThemePolicy;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        // Rate limiter for builder API (60 requests per minute per user)
        RateLimiter::for('builder-api', function ($request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        // Register CMS Policies
        Gate::policy(Page::class, PagePolicy::class);
        Gate::policy(Post::class, PostPolicy::class);
        Gate::policy(Media::class, MediaPolicy::class);
        Gate::policy(Menu::class, MenuPolicy::class);
        Gate::policy(Setting::class, SettingPolicy::class);
        Gate::policy(Taxonomy::class, TaxonomyPolicy::class);
        Gate::policy(CmsPlugin::class, PluginPolicy::class);
        Gate::policy(CmsTheme::class, ThemePolicy::class);
        Gate::policy(Role::class, RolePolicy::class);

        // Super admin gate: admin role bypasses all checks
        Gate::before(function ($user, $ability) {
            if ($user->isAdmin()) {
                return true;
            }

            return null;
        });

        // Register CMS Cache Observers
        Page::observe(PageObserver::class);
        Setting::observe(SettingObserver::class);
        Menu::observe(MenuObserver::class);
        CmsTheme::observe(ThemeObserver::class);
        CmsPlugin::observe(PluginObserver::class);
        Block::observe(BlockObserver::class);
    }
}
