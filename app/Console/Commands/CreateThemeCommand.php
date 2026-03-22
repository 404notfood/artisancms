<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;

class CreateThemeCommand extends Command
{
    protected $signature = 'cms:theme:create {slug : The theme slug (kebab-case)}';

    protected $description = 'Créer un nouveau thème ArtisanCMS';

    public function handle(): int
    {
        $slug = $this->argument('slug');

        // Validate slug is kebab-case
        if (!preg_match('/^[a-z0-9]+(-[a-z0-9]+)*$/', $slug)) {
            $this->components->error("Le slug « {$slug} » est invalide. Utilisez le format kebab-case (ex: mon-theme).");
            return self::FAILURE;
        }

        $themePath = base_path("content/themes/{$slug}");

        // Check directory doesn't already exist
        if (is_dir($themePath)) {
            $this->components->error("Le thème « {$slug} » existe déjà dans {$themePath}.");
            return self::FAILURE;
        }

        // Derive name from slug
        $name = ucwords(str_replace('-', ' ', $slug));

        // Create directories
        $directories = [
            "{$themePath}/assets/css",
            "{$themePath}/assets/images",
            "{$themePath}/layouts",
            "{$themePath}/blocks",
            "{$themePath}/partials",
        ];

        foreach ($directories as $dir) {
            if (!mkdir($dir, 0755, true)) {
                $this->components->error("Impossible de créer le répertoire : {$dir}");
                return self::FAILURE;
            }
        }

        // Create artisan-theme.json manifest
        $manifest = [
            'name' => $name,
            'slug' => $slug,
            'version' => '1.0.0',
            'description' => "Thème {$name} pour ArtisanCMS",
            'author' => [
                'name' => 'ArtisanCMS',
                'url' => 'https://artisancms.dev',
            ],
            'license' => 'MIT',
            'requires' => [
                'cms' => '>=1.0.0',
            ],
            'preview' => 'assets/images/preview.png',
            'category' => 'general',
            'tags' => [],
            'layouts' => [
                [
                    'slug' => 'default',
                    'name' => 'Par défaut',
                    'regions' => ['header', 'content', 'footer'],
                ],
            ],
            'menu_locations' => [
                [
                    'slug' => 'header',
                    'name' => 'Navigation principale',
                ],
                [
                    'slug' => 'footer',
                    'name' => 'Navigation pied de page',
                ],
            ],
            'customization' => [
                'colors' => [
                    'primary' => [
                        'label' => 'Couleur principale',
                        'type' => 'color',
                        'default' => '#3b82f6',
                    ],
                    'secondary' => [
                        'label' => 'Couleur secondaire',
                        'type' => 'color',
                        'default' => '#64748b',
                    ],
                    'accent' => [
                        'label' => 'Couleur d\'accent',
                        'type' => 'color',
                        'default' => '#f59e0b',
                    ],
                    'background' => [
                        'label' => 'Couleur de fond',
                        'type' => 'color',
                        'default' => '#ffffff',
                    ],
                    'text' => [
                        'label' => 'Couleur du texte',
                        'type' => 'color',
                        'default' => '#0f172a',
                    ],
                ],
                'fonts' => [
                    'heading' => [
                        'label' => 'Police des titres',
                        'type' => 'select',
                        'default' => 'Inter',
                        'options' => ['Inter', 'Poppins', 'Montserrat', 'Playfair Display', 'Roboto'],
                    ],
                    'body' => [
                        'label' => 'Police du texte',
                        'type' => 'select',
                        'default' => 'Inter',
                        'options' => ['Inter', 'Open Sans', 'Lato', 'Roboto', 'Source Sans Pro'],
                    ],
                ],
            ],
        ];

        file_put_contents(
            "{$themePath}/artisan-theme.json",
            json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . "\n"
        );

        // Create assets/css/theme.css with CSS variables placeholder
        $cssContent = <<<'CSS'
/*
 * Theme CSS Variables
 * These variables are overridden by the theme customizer settings.
 */

:root {
    /* Colors */
    --color-primary: #3b82f6;
    --color-secondary: #64748b;
    --color-accent: #f59e0b;
    --color-background: #ffffff;
    --color-text: #0f172a;

    /* Fonts */
    --font-heading: 'Inter', sans-serif;
    --font-body: 'Inter', sans-serif;

    /* Spacing */
    --spacing-section: 4rem;
    --spacing-block: 2rem;

    /* Border radius */
    --radius-sm: 0.25rem;
    --radius-md: 0.5rem;
    --radius-lg: 1rem;
}
CSS;

        file_put_contents("{$themePath}/assets/css/theme.css", $cssContent . "\n");

        $this->components->info("Thème « {$name} » créé avec succès !");
        $this->components->twoColumnDetail('Chemin', $themePath);
        $this->components->twoColumnDetail('Manifeste', 'artisan-theme.json');
        $this->components->twoColumnDetail('Stylesheet', 'assets/css/theme.css');

        return self::SUCCESS;
    }
}
