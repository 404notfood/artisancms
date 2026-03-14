<?php

declare(strict_types=1);

namespace ContactForm;

use ContactForm\Services\FormService;
use Illuminate\Support\ServiceProvider;

class ContactFormServiceProvider extends ServiceProvider
{
    /**
     * Register any plugin services.
     */
    public function register(): void
    {
        $this->app->singleton(FormService::class, function ($app): FormService {
            return new FormService();
        });
    }

    /**
     * Bootstrap the Contact Form plugin.
     */
    public function boot(): void
    {
        $this->loadRoutesFrom(__DIR__ . '/../routes/web.php');

        $this->loadMigrationsFrom(__DIR__ . '/../database/migrations');
    }
}
