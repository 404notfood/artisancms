<?php

declare(strict_types=1);

namespace ContactForm;

use App\CMS\Blocks\BlockRegistry;
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

        $this->registerBlocks();
    }

    /**
     * Register plugin blocks in the BlockRegistry.
     */
    private function registerBlocks(): void
    {
        $registry = app(BlockRegistry::class);

        $registry->register([
            'slug' => 'contact-form',
            'name' => 'Formulaire de contact',
            'category' => 'data',
            'icon' => 'Mail',
            'schema' => [
                'recipient_email' => ['type' => 'string', 'label' => 'Email destinataire'],
                'success_message' => ['type' => 'string', 'label' => 'Message de succès'],
                'show_phone' => ['type' => 'boolean', 'label' => 'Afficher le champ téléphone'],
                'show_subject' => ['type' => 'boolean', 'label' => 'Afficher le champ sujet'],
                'button_text' => ['type' => 'string', 'label' => 'Texte du bouton'],
            ],
            'default_props' => [
                'recipient_email' => '',
                'success_message' => 'Merci pour votre message !',
                'show_phone' => false,
                'show_subject' => true,
                'button_text' => 'Envoyer',
            ],
            'is_core' => false,
            'source' => 'contact-form',
        ]);
    }
}
