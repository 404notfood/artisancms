<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Block;
use Illuminate\Database\Seeder;

class BlockSeeder extends Seeder
{
    public function run(): void
    {
        $blocks = [
            // Layout blocks
            [
                'slug' => 'section',
                'name' => 'Section',
                'category' => 'layout',
                'icon' => 'layout',
                'schema' => [
                    'properties' => [
                        'background' => ['type' => 'string', 'default' => 'transparent'],
                        'padding' => ['type' => 'string', 'default' => '4rem 0'],
                        'maxWidth' => ['type' => 'string', 'default' => '1200px'],
                        'fullWidth' => ['type' => 'boolean', 'default' => false],
                    ],
                ],
                'default_props' => ['background' => 'transparent', 'padding' => '4rem 0', 'maxWidth' => '1200px', 'fullWidth' => false],
                'is_core' => true,
                'source' => 'core',
            ],
            [
                'slug' => 'grid',
                'name' => 'Grille',
                'category' => 'layout',
                'icon' => 'grid-3x3',
                'schema' => [
                    'properties' => [
                        'columns' => ['type' => 'number', 'default' => 2, 'minimum' => 1, 'maximum' => 6],
                        'gap' => ['type' => 'string', 'default' => '1.5rem'],
                    ],
                ],
                'default_props' => ['columns' => 2, 'gap' => '1.5rem'],
                'is_core' => true,
                'source' => 'core',
            ],

            // Content blocks
            [
                'slug' => 'heading',
                'name' => 'Titre',
                'category' => 'content',
                'icon' => 'heading',
                'schema' => [
                    'properties' => [
                        'text' => ['type' => 'string', 'default' => 'Titre'],
                        'level' => ['type' => 'number', 'default' => 2, 'enum' => [1, 2, 3, 4, 5, 6]],
                        'align' => ['type' => 'string', 'default' => 'left', 'enum' => ['left', 'center', 'right']],
                    ],
                ],
                'default_props' => ['text' => 'Titre', 'level' => 2, 'align' => 'left'],
                'is_core' => true,
                'source' => 'core',
            ],
            [
                'slug' => 'text',
                'name' => 'Texte',
                'category' => 'content',
                'icon' => 'type',
                'schema' => [
                    'properties' => [
                        'content' => ['type' => 'string', 'default' => '<p>Votre texte ici...</p>'],
                        'align' => ['type' => 'string', 'default' => 'left'],
                    ],
                ],
                'default_props' => ['content' => '<p>Votre texte ici...</p>', 'align' => 'left'],
                'is_core' => true,
                'source' => 'core',
            ],
            [
                'slug' => 'button',
                'name' => 'Bouton',
                'category' => 'content',
                'icon' => 'mouse-pointer-click',
                'schema' => [
                    'properties' => [
                        'text' => ['type' => 'string', 'default' => 'Cliquez ici'],
                        'url' => ['type' => 'string', 'default' => '#'],
                        'variant' => ['type' => 'string', 'default' => 'primary', 'enum' => ['primary', 'secondary', 'outline']],
                        'target' => ['type' => 'string', 'default' => '_self'],
                        'align' => ['type' => 'string', 'default' => 'left'],
                    ],
                ],
                'default_props' => ['text' => 'Cliquez ici', 'url' => '#', 'variant' => 'primary', 'target' => '_self', 'align' => 'left'],
                'is_core' => true,
                'source' => 'core',
            ],

            // Media blocks
            [
                'slug' => 'image',
                'name' => 'Image',
                'category' => 'media',
                'icon' => 'image',
                'schema' => [
                    'properties' => [
                        'src' => ['type' => 'string', 'default' => ''],
                        'alt' => ['type' => 'string', 'default' => ''],
                        'caption' => ['type' => 'string', 'default' => ''],
                        'width' => ['type' => 'string', 'default' => '100%'],
                        'align' => ['type' => 'string', 'default' => 'center'],
                    ],
                ],
                'default_props' => ['src' => '', 'alt' => '', 'caption' => '', 'width' => '100%', 'align' => 'center'],
                'is_core' => true,
                'source' => 'core',
            ],
            [
                'slug' => 'video',
                'name' => 'Vidéo',
                'category' => 'media',
                'icon' => 'video',
                'schema' => [
                    'properties' => [
                        'url' => ['type' => 'string', 'default' => ''],
                        'autoplay' => ['type' => 'boolean', 'default' => false],
                        'aspectRatio' => ['type' => 'string', 'default' => '16/9'],
                    ],
                ],
                'default_props' => ['url' => '', 'autoplay' => false, 'aspectRatio' => '16/9'],
                'is_core' => true,
                'source' => 'core',
            ],

            // Navigation blocks
            [
                'slug' => 'spacer',
                'name' => 'Espacement',
                'category' => 'layout',
                'icon' => 'move-vertical',
                'schema' => [
                    'properties' => [
                        'height' => ['type' => 'string', 'default' => '2rem'],
                    ],
                ],
                'default_props' => ['height' => '2rem'],
                'is_core' => true,
                'source' => 'core',
            ],
            [
                'slug' => 'divider',
                'name' => 'Séparateur',
                'category' => 'layout',
                'icon' => 'minus',
                'schema' => [
                    'properties' => [
                        'style' => ['type' => 'string', 'default' => 'solid', 'enum' => ['solid', 'dashed', 'dotted']],
                        'color' => ['type' => 'string', 'default' => '#e5e7eb'],
                        'width' => ['type' => 'string', 'default' => '100%'],
                    ],
                ],
                'default_props' => ['style' => 'solid', 'color' => '#e5e7eb', 'width' => '100%'],
                'is_core' => true,
                'source' => 'core',
            ],
            [
                'slug' => 'hero',
                'name' => 'Hero',
                'category' => 'content',
                'icon' => 'layout-dashboard',
                'schema' => [
                    'properties' => [
                        'title' => ['type' => 'string', 'default' => 'Bienvenue'],
                        'subtitle' => ['type' => 'string', 'default' => 'Votre sous-titre ici'],
                        'backgroundImage' => ['type' => 'string', 'default' => ''],
                        'backgroundColor' => ['type' => 'string', 'default' => '#1e293b'],
                        'textColor' => ['type' => 'string', 'default' => '#ffffff'],
                        'height' => ['type' => 'string', 'default' => '60vh'],
                        'ctaText' => ['type' => 'string', 'default' => ''],
                        'ctaUrl' => ['type' => 'string', 'default' => '#'],
                    ],
                ],
                'default_props' => ['title' => 'Bienvenue', 'subtitle' => 'Votre sous-titre ici', 'backgroundImage' => '', 'backgroundColor' => '#1e293b', 'textColor' => '#ffffff', 'height' => '60vh', 'ctaText' => '', 'ctaUrl' => '#'],
                'is_core' => true,
                'source' => 'core',
            ],

            // Interactive blocks
            [
                'slug' => 'gallery',
                'name' => 'Galerie',
                'category' => 'media',
                'icon' => 'images',
                'schema' => [
                    'properties' => [
                        'images' => ['type' => 'array', 'default' => []],
                        'columns' => ['type' => 'number', 'default' => 3],
                        'gap' => ['type' => 'string', 'default' => '0.5rem'],
                        'lightbox' => ['type' => 'boolean', 'default' => true],
                        'style' => ['type' => 'string', 'default' => 'grid', 'enum' => ['grid', 'masonry', 'carousel']],
                    ],
                ],
                'default_props' => ['images' => [], 'columns' => 3, 'gap' => '0.5rem', 'lightbox' => true, 'style' => 'grid'],
                'is_core' => true,
                'source' => 'core',
            ],
            [
                'slug' => 'accordion',
                'name' => 'Accordéon',
                'category' => 'content',
                'icon' => 'chevrons-down',
                'schema' => [
                    'properties' => [
                        'items' => ['type' => 'array', 'default' => [['title' => 'Question 1', 'content' => 'Réponse 1']]],
                        'allowMultiple' => ['type' => 'boolean', 'default' => false],
                        'defaultOpen' => ['type' => 'number', 'default' => 0],
                    ],
                ],
                'default_props' => ['items' => [['title' => 'Question 1', 'content' => 'Réponse 1']], 'allowMultiple' => false, 'defaultOpen' => 0],
                'is_core' => true,
                'source' => 'core',
            ],
            [
                'slug' => 'tabs',
                'name' => 'Onglets',
                'category' => 'content',
                'icon' => 'panel-top',
                'schema' => [
                    'properties' => [
                        'tabs' => ['type' => 'array', 'default' => [['label' => 'Onglet 1', 'content' => 'Contenu 1']]],
                        'style' => ['type' => 'string', 'default' => 'underline', 'enum' => ['underline', 'pills', 'boxed']],
                        'defaultTab' => ['type' => 'number', 'default' => 0],
                    ],
                ],
                'default_props' => ['tabs' => [['label' => 'Onglet 1', 'content' => 'Contenu 1']], 'style' => 'underline', 'defaultTab' => 0],
                'is_core' => true,
                'source' => 'core',
            ],
            [
                'slug' => 'testimonials',
                'name' => 'Témoignages',
                'category' => 'content',
                'icon' => 'quote',
                'schema' => [
                    'properties' => [
                        'items' => ['type' => 'array', 'default' => []],
                        'layout' => ['type' => 'string', 'default' => 'grid', 'enum' => ['grid', 'carousel', 'list']],
                        'columns' => ['type' => 'number', 'default' => 3],
                    ],
                ],
                'default_props' => ['items' => [], 'layout' => 'grid', 'columns' => 3],
                'is_core' => true,
                'source' => 'core',
            ],
            [
                'slug' => 'pricing-table',
                'name' => 'Tableau de prix',
                'category' => 'content',
                'icon' => 'credit-card',
                'schema' => [
                    'properties' => [
                        'plans' => ['type' => 'array', 'default' => []],
                        'columns' => ['type' => 'number', 'default' => 3],
                    ],
                ],
                'default_props' => ['plans' => [], 'columns' => 3],
                'is_core' => true,
                'source' => 'core',
            ],
            [
                'slug' => 'counter',
                'name' => 'Compteur',
                'category' => 'content',
                'icon' => 'hash',
                'schema' => [
                    'properties' => [
                        'items' => ['type' => 'array', 'default' => [['value' => 100, 'label' => 'Clients']]],
                        'columns' => ['type' => 'number', 'default' => 4],
                        'align' => ['type' => 'string', 'default' => 'center'],
                    ],
                ],
                'default_props' => ['items' => [['value' => 100, 'label' => 'Clients']], 'columns' => 4, 'align' => 'center'],
                'is_core' => true,
                'source' => 'core',
            ],
            [
                'slug' => 'icon-box',
                'name' => 'Boîte icône',
                'category' => 'content',
                'icon' => 'box',
                'schema' => [
                    'properties' => [
                        'items' => ['type' => 'array', 'default' => []],
                        'columns' => ['type' => 'number', 'default' => 3],
                        'align' => ['type' => 'string', 'default' => 'center'],
                    ],
                ],
                'default_props' => ['items' => [], 'columns' => 3, 'align' => 'center'],
                'is_core' => true,
                'source' => 'core',
            ],
            [
                'slug' => 'cta',
                'name' => 'Appel à l\'action',
                'category' => 'content',
                'icon' => 'megaphone',
                'schema' => [
                    'properties' => [
                        'title' => ['type' => 'string', 'default' => 'Prêt à commencer ?'],
                        'description' => ['type' => 'string', 'default' => 'Rejoignez-nous dès maintenant'],
                        'buttonText' => ['type' => 'string', 'default' => 'Commencer'],
                        'buttonUrl' => ['type' => 'string', 'default' => '#'],
                        'buttonVariant' => ['type' => 'string', 'default' => 'primary'],
                        'backgroundColor' => ['type' => 'string', 'default' => '#4f46e5'],
                        'textColor' => ['type' => 'string', 'default' => '#ffffff'],
                        'align' => ['type' => 'string', 'default' => 'center'],
                    ],
                ],
                'default_props' => ['title' => 'Prêt à commencer ?', 'description' => 'Rejoignez-nous dès maintenant', 'buttonText' => 'Commencer', 'buttonUrl' => '#', 'buttonVariant' => 'primary', 'backgroundColor' => '#4f46e5', 'textColor' => '#ffffff', 'align' => 'center'],
                'is_core' => true,
                'source' => 'core',
            ],
            [
                'slug' => 'map',
                'name' => 'Carte',
                'category' => 'media',
                'icon' => 'map-pin',
                'schema' => [
                    'properties' => [
                        'address' => ['type' => 'string', 'default' => 'Paris, France'],
                        'lat' => ['type' => 'number', 'default' => 48.8566],
                        'lng' => ['type' => 'number', 'default' => 2.3522],
                        'zoom' => ['type' => 'number', 'default' => 14],
                        'height' => ['type' => 'string', 'default' => '400px'],
                        'provider' => ['type' => 'string', 'default' => 'openstreetmap'],
                    ],
                ],
                'default_props' => ['address' => 'Paris, France', 'lat' => 48.8566, 'lng' => 2.3522, 'zoom' => 14, 'height' => '400px', 'provider' => 'openstreetmap'],
                'is_core' => true,
                'source' => 'core',
            ],
            [
                'slug' => 'table',
                'name' => 'Tableau',
                'category' => 'content',
                'icon' => 'table',
                'schema' => [
                    'properties' => [
                        'headers' => ['type' => 'array', 'default' => ['Colonne 1', 'Colonne 2', 'Colonne 3']],
                        'rows' => ['type' => 'array', 'default' => [['Cellule 1', 'Cellule 2', 'Cellule 3']]],
                        'striped' => ['type' => 'boolean', 'default' => true],
                        'bordered' => ['type' => 'boolean', 'default' => true],
                        'caption' => ['type' => 'string', 'default' => ''],
                    ],
                ],
                'default_props' => ['headers' => ['Colonne 1', 'Colonne 2', 'Colonne 3'], 'rows' => [['Cellule 1', 'Cellule 2', 'Cellule 3']], 'striped' => true, 'bordered' => true, 'caption' => ''],
                'is_core' => true,
                'source' => 'core',
            ],
            [
                'slug' => 'alert',
                'name' => 'Alerte',
                'category' => 'content',
                'icon' => 'alert-triangle',
                'schema' => [
                    'properties' => [
                        'type' => ['type' => 'string', 'default' => 'info', 'enum' => ['info', 'success', 'warning', 'error']],
                        'title' => ['type' => 'string', 'default' => 'Information'],
                        'content' => ['type' => 'string', 'default' => 'Votre message ici.'],
                        'dismissible' => ['type' => 'boolean', 'default' => false],
                        'icon' => ['type' => 'boolean', 'default' => true],
                    ],
                ],
                'default_props' => ['type' => 'info', 'title' => 'Information', 'content' => 'Votre message ici.', 'dismissible' => false, 'icon' => true],
                'is_core' => true,
                'source' => 'core',
            ],
            [
                'slug' => 'countdown',
                'name' => 'Compte à rebours',
                'category' => 'content',
                'icon' => 'timer',
                'schema' => [
                    'properties' => [
                        'targetDate' => ['type' => 'string', 'default' => ''],
                        'title' => ['type' => 'string', 'default' => ''],
                        'expiredMessage' => ['type' => 'string', 'default' => 'Terminé !'],
                        'showDays' => ['type' => 'boolean', 'default' => true],
                        'showHours' => ['type' => 'boolean', 'default' => true],
                        'showMinutes' => ['type' => 'boolean', 'default' => true],
                        'showSeconds' => ['type' => 'boolean', 'default' => true],
                        'style' => ['type' => 'string', 'default' => 'cards'],
                    ],
                ],
                'default_props' => ['targetDate' => '', 'title' => '', 'expiredMessage' => 'Terminé !', 'showDays' => true, 'showHours' => true, 'showMinutes' => true, 'showSeconds' => true, 'style' => 'cards'],
                'is_core' => true,
                'source' => 'core',
            ],
            [
                'slug' => 'code-block',
                'name' => 'Bloc de code',
                'category' => 'content',
                'icon' => 'code',
                'schema' => [
                    'properties' => [
                        'code' => ['type' => 'string', 'default' => '// Votre code ici'],
                        'language' => ['type' => 'string', 'default' => 'javascript'],
                        'showLineNumbers' => ['type' => 'boolean', 'default' => true],
                        'title' => ['type' => 'string', 'default' => ''],
                    ],
                ],
                'default_props' => ['code' => '// Votre code ici', 'language' => 'javascript', 'showLineNumbers' => true, 'title' => ''],
                'is_core' => true,
                'source' => 'core',
            ],
            [
                'slug' => 'blockquote',
                'name' => 'Citation',
                'category' => 'content',
                'icon' => 'text-quote',
                'schema' => [
                    'properties' => [
                        'text' => ['type' => 'string', 'default' => 'Votre citation ici...'],
                        'author' => ['type' => 'string', 'default' => ''],
                        'source' => ['type' => 'string', 'default' => ''],
                        'style' => ['type' => 'string', 'default' => 'bordered', 'enum' => ['simple', 'bordered', 'filled']],
                    ],
                ],
                'default_props' => ['text' => 'Votre citation ici...', 'author' => '', 'source' => '', 'style' => 'bordered'],
                'is_core' => true,
                'source' => 'core',
            ],
            [
                'slug' => 'list',
                'name' => 'Liste',
                'category' => 'content',
                'icon' => 'list',
                'schema' => [
                    'properties' => [
                        'items' => ['type' => 'array', 'default' => ['Élément 1', 'Élément 2', 'Élément 3']],
                        'style' => ['type' => 'string', 'default' => 'bullet', 'enum' => ['bullet', 'numbered', 'check', 'arrow', 'none']],
                        'spacing' => ['type' => 'string', 'default' => 'normal', 'enum' => ['compact', 'normal', 'relaxed']],
                    ],
                ],
                'default_props' => ['items' => ['Élément 1', 'Élément 2', 'Élément 3'], 'style' => 'bullet', 'spacing' => 'normal'],
                'is_core' => true,
                'source' => 'core',
            ],
            [
                'slug' => 'logo-grid',
                'name' => 'Grille de logos',
                'category' => 'media',
                'icon' => 'layout-grid',
                'schema' => [
                    'properties' => [
                        'logos' => ['type' => 'array', 'default' => []],
                        'columns' => ['type' => 'number', 'default' => 4],
                        'grayscale' => ['type' => 'boolean', 'default' => true],
                        'gap' => ['type' => 'string', 'default' => '2rem'],
                    ],
                ],
                'default_props' => ['logos' => [], 'columns' => 4, 'grayscale' => true, 'gap' => '2rem'],
                'is_core' => true,
                'source' => 'core',
            ],
            [
                'slug' => 'team-members',
                'name' => 'Équipe',
                'category' => 'content',
                'icon' => 'users',
                'schema' => [
                    'properties' => [
                        'members' => ['type' => 'array', 'default' => []],
                        'columns' => ['type' => 'number', 'default' => 3],
                        'style' => ['type' => 'string', 'default' => 'card', 'enum' => ['card', 'minimal', 'circle']],
                    ],
                ],
                'default_props' => ['members' => [], 'columns' => 3, 'style' => 'card'],
                'is_core' => true,
                'source' => 'core',
            ],
            [
                'slug' => 'progress-bar',
                'name' => 'Barre de progression',
                'category' => 'content',
                'icon' => 'bar-chart',
                'schema' => [
                    'properties' => [
                        'bars' => ['type' => 'array', 'default' => [['label' => 'Compétence', 'value' => 75, 'color' => '#4f46e5']]],
                        'showPercentage' => ['type' => 'boolean', 'default' => true],
                        'height' => ['type' => 'string', 'default' => 'md', 'enum' => ['sm', 'md', 'lg']],
                        'animated' => ['type' => 'boolean', 'default' => true],
                    ],
                ],
                'default_props' => ['bars' => [['label' => 'Compétence', 'value' => 75, 'color' => '#4f46e5']], 'showPercentage' => true, 'height' => 'md', 'animated' => true],
                'is_core' => true,
                'source' => 'core',
            ],
            [
                'slug' => 'timeline',
                'name' => 'Chronologie',
                'category' => 'content',
                'icon' => 'git-branch',
                'schema' => [
                    'properties' => [
                        'events' => ['type' => 'array', 'default' => [['date' => '2024', 'title' => 'Événement', 'content' => 'Description']]],
                        'style' => ['type' => 'string', 'default' => 'left', 'enum' => ['left', 'alternating']],
                        'lineColor' => ['type' => 'string', 'default' => '#e5e7eb'],
                    ],
                ],
                'default_props' => ['events' => [['date' => '2024', 'title' => 'Événement', 'content' => 'Description']], 'style' => 'left', 'lineColor' => '#e5e7eb'],
                'is_core' => true,
                'source' => 'core',
            ],
            [
                'slug' => 'embed',
                'name' => 'Intégration',
                'category' => 'media',
                'icon' => 'link',
                'schema' => [
                    'properties' => [
                        'url' => ['type' => 'string', 'default' => ''],
                        'type' => ['type' => 'string', 'default' => 'auto', 'enum' => ['auto', 'youtube', 'vimeo', 'twitter', 'iframe']],
                        'aspectRatio' => ['type' => 'string', 'default' => '16/9'],
                        'maxWidth' => ['type' => 'string', 'default' => '100%'],
                    ],
                ],
                'default_props' => ['url' => '', 'type' => 'auto', 'aspectRatio' => '16/9', 'maxWidth' => '100%'],
                'is_core' => true,
                'source' => 'core',
            ],
            [
                'slug' => 'form-block',
                'name' => 'Formulaire',
                'category' => 'data',
                'icon' => 'clipboard-list',
                'schema' => [
                    'properties' => [
                        'formId' => ['type' => 'number', 'default' => 0],
                        'formSlug' => ['type' => 'string', 'default' => ''],
                        'style' => ['type' => 'string', 'default' => 'default', 'enum' => ['default', 'card', 'minimal']],
                    ],
                ],
                'default_props' => ['formId' => 0, 'formSlug' => '', 'style' => 'default'],
                'is_core' => true,
                'source' => 'core',
            ],
        ];

        foreach ($blocks as $block) {
            Block::updateOrCreate(
                ['slug' => $block['slug']],
                $block,
            );
        }
    }
}
