<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;

class CreateThemeCommand extends Command
{
    protected $signature = 'cms:theme:create {slug? : The theme slug (kebab-case)}';

    protected $description = 'Créer un nouveau thème ArtisanCMS (wizard interactif)';

    public function handle(): int
    {
        $this->components->info('🎨 Création d\'un nouveau thème ArtisanCMS');
        $this->newLine();

        // ─── Slug ────────────────────────────────────────
        $slug = $this->argument('slug') ?? $this->ask('Slug du thème (kebab-case)', 'mon-theme');

        if (!preg_match('/^[a-z0-9]+(-[a-z0-9]+)*$/', $slug)) {
            $this->components->error("Le slug « {$slug} » est invalide. Utilisez le format kebab-case.");
            return self::FAILURE;
        }

        $themePath = base_path("content/themes/{$slug}");

        if (is_dir($themePath)) {
            $this->components->error("Le thème « {$slug} » existe déjà.");
            return self::FAILURE;
        }

        // ─── Basic info ──────────────────────────────────
        $name = $this->ask('Nom du thème', ucwords(str_replace('-', ' ', $slug)));
        $description = $this->ask('Description', "Thème {$name} pour ArtisanCMS");
        $authorName = $this->ask('Auteur', 'ArtisanCMS');
        $category = $this->choice('Catégorie', ['general', 'business', 'portfolio', 'blog', 'ecommerce', 'restaurant', 'agence', 'education', 'sante'], 0);

        // ─── Colors ──────────────────────────────────────
        $this->newLine();
        $this->components->info('🎨 Palette de couleurs :');

        $primary = $this->ask('Couleur principale (hex)', '#3b82f6');
        $secondary = $this->ask('Couleur secondaire', '#64748b');
        $accent = $this->ask('Couleur d\'accent', '#f59e0b');
        $background = $this->ask('Fond', '#ffffff');
        $textColor = $this->ask('Texte', '#0f172a');

        // ─── Fonts ───────────────────────────────────────
        $this->newLine();
        $fonts = ['Inter', 'Poppins', 'Montserrat', 'Playfair Display', 'Roboto', 'Open Sans', 'Lato', 'DM Sans', 'Space Grotesk'];
        $headingFont = $this->choice('Police des titres', $fonts, 0);
        $bodyFont = $this->choice('Police du texte', $fonts, 0);

        // ─── Layouts ─────────────────────────────────────
        $this->newLine();
        $this->components->info('📐 Layouts :');

        $availableLayouts = ['default', 'full-width', 'landing', 'blog', 'sidebar-left', 'sidebar-right'];
        $selectedLayouts = [];

        // Default is always included
        $selectedLayouts[] = ['slug' => 'default', 'name' => 'Par défaut', 'regions' => ['header', 'content', 'footer']];

        $extraLayouts = $this->choice(
            'Layouts supplémentaires (séparés par des virgules)',
            array_slice($availableLayouts, 1),
            null,
            null,
            true,
        );

        foreach ($extraLayouts as $layout) {
            $regions = ['header', 'content', 'footer'];
            if (str_contains($layout, 'sidebar') || $layout === 'blog') {
                $regions = ['header', 'content', 'sidebar', 'footer'];
            }
            $selectedLayouts[] = [
                'slug' => $layout,
                'name' => ucwords(str_replace('-', ' ', $layout)),
                'regions' => $regions,
            ];
        }

        // ─── Block overrides ─────────────────────────────
        $this->newLine();
        $coreBlocks = ['hero', 'testimonials', 'pricing-table', 'cta', 'icon-box', 'counter', 'tabs', 'accordion'];
        $this->components->info('🧱 Surcharges de blocs :');
        $this->line('  Choisissez les blocs core que votre thème surcharge visuellement.');

        $blockOverrides = $this->choice(
            'Blocs à surcharger (séparés par des virgules, vide = aucun)',
            array_merge(['aucun'], $coreBlocks),
            0,
            null,
            true,
        );

        if (in_array('aucun', $blockOverrides, true)) {
            $blockOverrides = [];
        }

        // ─── Features ────────────────────────────────────
        $this->newLine();
        $features = $this->choice(
            'Fonctionnalités supportées',
            ['dark-mode', 'custom-header', 'custom-footer', 'newsletter', 'sidebar', 'mega-menu', 'sticky-header'],
            '0,1,2',
            null,
            true,
        );

        // ─── Confirmation ────────────────────────────────
        $this->newLine();
        $this->components->info('Récapitulatif :');
        $this->components->twoColumnDetail('Thème', "{$name} ({$slug})");
        $this->components->twoColumnDetail('Catégorie', $category);
        $this->components->twoColumnDetail('Couleurs', "{$primary} / {$secondary} / {$accent}");
        $this->components->twoColumnDetail('Polices', "{$headingFont} / {$bodyFont}");
        $this->components->twoColumnDetail('Layouts', implode(', ', array_column($selectedLayouts, 'slug')));
        $this->components->twoColumnDetail('Surcharges blocs', empty($blockOverrides) ? 'Aucune' : implode(', ', $blockOverrides));
        $this->components->twoColumnDetail('Features', implode(', ', $features));
        $this->newLine();

        if (!$this->confirm('Créer le thème ?', true)) {
            $this->components->warn('Annulé.');
            return self::SUCCESS;
        }

        // ─── Generate ────────────────────────────────────
        $this->scaffoldTheme(
            $themePath, $slug, $name, $description, $authorName, $category,
            $primary, $secondary, $accent, $background, $textColor,
            $headingFont, $bodyFont, $selectedLayouts, $blockOverrides, $features,
        );

        $this->newLine();
        $this->components->info("✅ Thème « {$name} » créé avec succès !");
        $this->components->twoColumnDetail('Chemin', $themePath);
        $this->newLine();
        $this->line('Prochaines étapes :');
        $this->line('  1. Activez le thème dans Admin > Thèmes');
        $this->line('  2. Personnalisez les layouts dans layouts/');
        if (!empty($blockOverrides)) {
            $this->line('  3. Implémentez les surcharges dans blocks/');
        }

        return self::SUCCESS;
    }

    private function scaffoldTheme(
        string $path, string $slug, string $name, string $description, string $author,
        string $category, string $primary, string $secondary, string $accent,
        string $bg, string $text, string $headingFont, string $bodyFont,
        array $layouts, array $blockOverrides, array $features,
    ): void {
        // Directories
        $dirs = [
            "{$path}/assets/css",
            "{$path}/assets/images",
            "{$path}/assets/fonts",
            "{$path}/layouts",
            "{$path}/partials",
            "{$path}/blocks",
        ];
        foreach ($dirs as $dir) {
            mkdir($dir, 0755, true);
        }

        // Manifest
        $manifest = [
            'name' => $name,
            'slug' => $slug,
            'version' => '1.0.0',
            'description' => $description,
            'author' => ['name' => $author, 'url' => 'https://artisancms.dev'],
            'license' => 'MIT',
            'requires' => ['cms' => '>=1.0.0'],
            'preview' => 'assets/images/preview.png',
            'category' => $category,
            'tags' => [],
            'layouts' => $layouts,
            'menu_locations' => [
                ['slug' => 'header', 'name' => 'Navigation principale'],
                ['slug' => 'footer', 'name' => 'Navigation pied de page'],
            ],
            'supports' => $features,
            'customization' => [
                'colors' => [
                    'primary' => ['label' => 'Couleur principale', 'type' => 'color', 'default' => $primary],
                    'secondary' => ['label' => 'Couleur secondaire', 'type' => 'color', 'default' => $secondary],
                    'accent' => ['label' => 'Couleur d\'accent', 'type' => 'color', 'default' => $accent],
                    'background' => ['label' => 'Couleur de fond', 'type' => 'color', 'default' => $bg],
                    'text' => ['label' => 'Couleur du texte', 'type' => 'color', 'default' => $text],
                ],
                'fonts' => [
                    'heading' => ['label' => 'Police des titres', 'type' => 'select', 'default' => $headingFont, 'options' => ['Inter', 'Poppins', 'Montserrat', 'Playfair Display', 'Roboto', 'Open Sans', 'DM Sans', 'Space Grotesk']],
                    'body' => ['label' => 'Police du texte', 'type' => 'select', 'default' => $bodyFont, 'options' => ['Inter', 'Open Sans', 'Lato', 'Roboto', 'Source Sans Pro', 'DM Sans', 'Space Grotesk']],
                ],
            ],
            'css_variables' => [
                '--color-primary' => $primary,
                '--color-secondary' => $secondary,
                '--color-accent' => $accent,
                '--color-background' => $bg,
                '--color-text' => $text,
                '--font-heading' => "'{$headingFont}', system-ui, sans-serif",
                '--font-body' => "'{$bodyFont}', system-ui, sans-serif",
                '--container-width' => '1280px',
                '--section-padding' => '96px',
            ],
        ];

        file_put_contents("{$path}/artisan-theme.json", json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . "\n");

        // CSS
        $css = <<<CSS
/*
 * {$name} — Theme CSS
 * Variables overridden by customizer settings.
 */

:root {
    --color-primary: {$primary};
    --color-secondary: {$secondary};
    --color-accent: {$accent};
    --color-background: {$bg};
    --color-text: {$text};
    --font-heading: '{$headingFont}', system-ui, sans-serif;
    --font-body: '{$bodyFont}', system-ui, sans-serif;
    --container-width: 1280px;
    --section-padding: 96px;
    --radius-sm: 0.25rem;
    --radius-md: 0.5rem;
    --radius-lg: 1rem;
}
CSS;

        file_put_contents("{$path}/assets/css/theme.css", $css . "\n");

        // Layouts TSX
        foreach ($layouts as $layout) {
            $this->generateLayoutTsx($path, $layout);
        }

        // Partials
        $this->generatePartial($path, 'header', $name);
        $this->generatePartial($path, 'footer', $name);

        // Block overrides
        foreach ($blockOverrides as $blockSlug) {
            $this->generateBlockOverride($path, $blockSlug);
        }
    }

    private function generateLayoutTsx(string $path, array $layout): void
    {
        $pascal = str_replace(' ', '', ucwords(str_replace('-', ' ', $layout['slug']))) . 'Layout';
        $hasSidebar = in_array('sidebar', $layout['regions'], true);

        $mainClass = $hasSidebar
            ? 'flex-1 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 max-w-[var(--container-width,1280px)] mx-auto px-4 py-8'
            : 'flex-1 max-w-[var(--container-width,1280px)] mx-auto px-4 py-8';

        $children = $hasSidebar
            ? "<div>{children}</div>\n                <aside className=\"hidden lg:block\">{/* Sidebar */}</aside>"
            : '{children}';

        $content = <<<TSX
import type { ReactNode } from 'react';

interface {$pascal}Props {
    children: ReactNode;
    header?: ReactNode;
    footer?: ReactNode;
}

export default function {$pascal}({ children, header, footer }: {$pascal}Props) {
    return (
        <div className="min-h-screen flex flex-col" style={{ fontFamily: 'var(--font-body, Inter, system-ui, sans-serif)' }}>
            {header && <header>{header}</header>}
            <main className="{$mainClass}">
                {$children}
            </main>
            {footer && <footer>{footer}</footer>}
        </div>
    );
}
TSX;

        file_put_contents("{$path}/layouts/{$pascal}.tsx", $content . "\n");
    }

    private function generatePartial(string $path, string $type, string $themeName): void
    {
        if ($type === 'header') {
            $content = <<<TSX
interface HeaderProps {
    menus?: Record<string, any>;
    theme?: Record<string, any>;
}

export default function Header({ menus, theme }: HeaderProps) {
    return (
        <nav className="w-full border-b" style={{ backgroundColor: 'var(--color-background, #fff)' }}>
            <div className="max-w-[var(--container-width,1280px)] mx-auto px-4 h-16 flex items-center justify-between">
                <span className="text-lg font-bold" style={{ color: 'var(--color-primary)' }}>
                    {$themeName}
                </span>
                {/* Navigation items */}
            </div>
        </nav>
    );
}
TSX;
        } else {
            $content = <<<TSX
export default function Footer() {
    return (
        <footer className="border-t py-8" style={{ backgroundColor: 'var(--color-background, #fff)' }}>
            <div className="max-w-[var(--container-width,1280px)] mx-auto px-4 text-center text-sm" style={{ color: 'var(--color-text)' }}>
                © {new Date().getFullYear()} {$themeName}. Tous droits réservés.
            </div>
        </footer>
    );
}
TSX;
        }

        file_put_contents("{$path}/partials/{$type}.tsx", $content . "\n");
    }

    private function generateBlockOverride(string $path, string $blockSlug): void
    {
        $pascal = str_replace(' ', '', ucwords(str_replace('-', ' ', $blockSlug)));

        $content = <<<TSX
import type { BlockRendererProps } from '@/Components/builder/blocks/block-registry';

/**
 * Theme override for the "{$blockSlug}" block.
 * This component replaces the default renderer when this theme is active.
 */
export default function {$pascal}Renderer({ block, isSelected, isEditing }: BlockRendererProps) {
    // TODO: Implement custom rendering for {$blockSlug}
    // Access block props via block.props

    return (
        <div className="w-full">
            {/* Custom {$blockSlug} rendering */}
            <p>Override: {$blockSlug}</p>
        </div>
    );
}
TSX;

        file_put_contents("{$path}/blocks/{$blockSlug}-renderer.tsx", $content . "\n");
    }
}
