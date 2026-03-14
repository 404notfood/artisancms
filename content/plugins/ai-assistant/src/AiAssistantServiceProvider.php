<?php

declare(strict_types=1);

namespace AiAssistant;

use AiAssistant\Http\Middleware\AiRateLimiter;
use AiAssistant\Services\AiService;
use AiAssistant\Services\UsageTracker;
use App\CMS\Facades\CMS;
use Illuminate\Support\ServiceProvider;

class AiAssistantServiceProvider extends ServiceProvider
{
    /**
     * Register any plugin services.
     */
    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__ . '/../config/ai-assistant.php', 'ai-assistant');

        $this->app->singleton(AiService::class);
        $this->app->singleton(UsageTracker::class);
    }

    /**
     * Bootstrap the AI Assistant plugin.
     */
    public function boot(): void
    {
        // Migrations
        $this->loadMigrationsFrom(__DIR__ . '/../database/migrations');

        // Translations
        $this->loadTranslationsFrom(__DIR__ . '/../resources/lang', 'ai-assistant');

        // Routes
        $this->loadRoutesFrom(__DIR__ . '/../routes/api.php');
        $this->loadRoutesFrom(__DIR__ . '/../routes/admin.php');

        // Middleware
        $this->app['router']->aliasMiddleware('ai.rate_limit', AiRateLimiter::class);

        // Artisan commands
        if ($this->app->runningInConsole()) {
            $this->commands([
                \AiAssistant\Commands\AiBulkGenerateCommand::class,
            ]);
        }

        // Hook : sidebar admin
        CMS::hook('admin_sidebar', function (&$items) {
            $items[] = [
                'label' => __('ai-assistant::messages.sidebar_label'),
                'icon' => 'sparkles',
                'url' => '/admin/ai-assistant',
                'children' => [
                    ['label' => __('ai-assistant::messages.settings'), 'url' => '/admin/ai-assistant/settings'],
                    ['label' => __('ai-assistant::messages.usage'), 'url' => '/admin/ai-assistant/usage'],
                ],
            ];
        });

        // Filtre : bouton AI dans la toolbar des blocs texte
        CMS::filter('builder.block_toolbar', function (array $toolbarItems, string $blockType) {
            if (in_array($blockType, ['text', 'heading'], true)) {
                $toolbarItems[] = [
                    'type' => 'ai-button',
                    'component' => 'AiButton',
                    'label' => __('ai-assistant::messages.ai_button'),
                    'icon' => 'sparkles',
                ];
            }
            return $toolbarItems;
        });

        // Filtre : onglet AI dans le sidebar du builder
        CMS::filter('builder.sidebar_tabs', function (array $tabs) {
            $tabs[] = [
                'id' => 'ai',
                'label' => 'IA',
                'icon' => 'sparkles',
                'component' => 'AiPanel',
            ];
            return $tabs;
        });
    }
}
