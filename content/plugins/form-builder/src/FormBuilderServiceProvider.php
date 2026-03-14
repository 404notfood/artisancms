<?php

declare(strict_types=1);

namespace FormBuilder;

use FormBuilder\Services\FormService;
use FormBuilder\Services\SpamProtectionService;
use FormBuilder\Services\SubmissionService;
use Illuminate\Support\ServiceProvider;

class FormBuilderServiceProvider extends ServiceProvider
{
    /**
     * Register any plugin services.
     */
    public function register(): void
    {
        $this->app->singleton(SpamProtectionService::class, function (): SpamProtectionService {
            return new SpamProtectionService();
        });

        $this->app->singleton(FormService::class, function (): FormService {
            return new FormService();
        });

        $this->app->singleton(SubmissionService::class, function ($app): SubmissionService {
            return new SubmissionService(
                $app->make(SpamProtectionService::class),
            );
        });
    }

    /**
     * Bootstrap the Form Builder plugin.
     */
    public function boot(): void
    {
        $this->loadMigrationsFrom(__DIR__ . '/../database/migrations');

        $this->loadRoutesFrom(__DIR__ . '/../routes/admin.php');
        $this->loadRoutesFrom(__DIR__ . '/../routes/web.php');

        $this->registerHooks();
    }

    /**
     * Register CMS hooks for sidebar integration.
     */
    private function registerHooks(): void
    {
        if (class_exists(\App\CMS\Facades\CMS::class)) {
            \App\CMS\Facades\CMS::hook('admin_sidebar', function (array &$items): void {
                $items[] = [
                    'label' => __('cms.forms'),
                    'icon' => 'file-text',
                    'url' => '/admin/forms',
                    'children' => [
                        ['label' => __('cms.all_forms'), 'url' => '/admin/forms'],
                    ],
                ];
            });
        }
    }
}
