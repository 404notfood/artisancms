<?php

declare(strict_types=1);

namespace App\Providers;

use App\Models\Block;
use App\Models\BlockPattern;
use App\Models\CmsPlugin;
use App\Models\CmsTheme;
use App\Models\Comment;
use App\Models\ContentEntry;
use App\Models\ContentType;
use App\Models\CustomFieldGroup;
use App\Models\DesignToken;
use App\Models\EmailTemplate;
use App\Models\GlobalSection;
use App\Models\Media;
use App\Models\Menu;
use App\Models\Page;
use App\Models\Popup;
use App\Models\Post;
use App\Models\Redirect;
use App\Models\Role;
use App\Models\Setting;
use App\Models\Taxonomy;
use App\Models\Webhook;
use App\Models\Widget;
use App\Models\WidgetArea;
use App\Observers\BlockObserver;
use App\Observers\CommentObserver;
use App\Observers\GlobalSectionObserver;
use App\Observers\MenuObserver;
use App\Observers\PageObserver;
use App\Observers\PluginObserver;
use App\Observers\PostObserver;
use App\Observers\RedirectObserver;
use App\Observers\SettingObserver;
use App\Observers\ThemeObserver;
use App\Policies\BlockPatternPolicy;
use App\Policies\CommentPolicy;
use App\Policies\ContentEntryPolicy;
use App\Policies\ContentTypePolicy;
use App\Policies\CustomFieldGroupPolicy;
use App\Policies\DesignTokenPolicy;
use App\Policies\EmailTemplatePolicy;
use App\Policies\GlobalSectionPolicy;
use App\Policies\MediaPolicy;
use App\Policies\MenuPolicy;
use App\Policies\PagePolicy;
use App\Policies\PluginPolicy;
use App\Policies\PopupPolicy;
use App\Policies\PostPolicy;
use App\Policies\RolePolicy;
use App\Policies\SettingPolicy;
use App\Policies\TaxonomyPolicy;
use App\Policies\ThemePolicy;
use App\Policies\WebhookPolicy;
use App\Policies\WidgetAreaPolicy;
use App\Policies\WidgetPolicy;
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
        Gate::policy(Comment::class, CommentPolicy::class);
        Gate::policy(Webhook::class, WebhookPolicy::class);
        Gate::policy(ContentType::class, ContentTypePolicy::class);
        Gate::policy(ContentEntry::class, ContentEntryPolicy::class);
        Gate::policy(CustomFieldGroup::class, CustomFieldGroupPolicy::class);
        Gate::policy(EmailTemplate::class, EmailTemplatePolicy::class);
        Gate::policy(Popup::class, PopupPolicy::class);
        Gate::policy(DesignToken::class, DesignTokenPolicy::class);
        Gate::policy(BlockPattern::class, BlockPatternPolicy::class);
        Gate::policy(GlobalSection::class, GlobalSectionPolicy::class);
        Gate::policy(Widget::class, WidgetPolicy::class);
        Gate::policy(WidgetArea::class, WidgetAreaPolicy::class);

        // Super admin gate: admin role bypasses all checks
        Gate::before(function ($user, $ability) {
            if ($user->isAdmin()) {
                return true;
            }

            return null;
        });

        // Register CMS Cache Observers
        Page::observe(PageObserver::class);
        Post::observe(PostObserver::class);
        Comment::observe(CommentObserver::class);
        Redirect::observe(RedirectObserver::class);
        GlobalSection::observe(GlobalSectionObserver::class);
        Setting::observe(SettingObserver::class);
        Menu::observe(MenuObserver::class);
        CmsTheme::observe(ThemeObserver::class);
        CmsPlugin::observe(PluginObserver::class);
        Block::observe(BlockObserver::class);
    }
}
