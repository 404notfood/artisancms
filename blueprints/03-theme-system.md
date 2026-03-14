# Blueprint 03 - Système de Thèmes

## Vue d'ensemble
Le système de thèmes permet aux utilisateurs de changer l'apparence complète du site sans modifier le contenu. Chaque thème est un dossier dans `content/themes/` contenant des layouts, des styles, des surcharges de blocs et un manifeste JSON.

---

## Structure d'un thème

```
content/themes/default/
├── artisan-theme.json           # Manifeste du thème
├── layouts/                     # Layouts Blade/React
│   ├── default.tsx              # Layout par défaut
│   ├── full-width.tsx           # Pleine largeur
│   ├── sidebar-left.tsx         # Sidebar gauche
│   ├── sidebar-right.tsx        # Sidebar droite
│   └── landing.tsx              # Landing page
├── blocks/                      # Surcharges de blocs
│   └── hero-custom/             # Bloc custom du thème
│       ├── render.tsx           # Composant React
│       └── schema.json          # Définition props
├── partials/                    # Composants réutilisables du thème
│   ├── header.tsx
│   ├── footer.tsx
│   └── sidebar.tsx
├── assets/                      # Assets statiques
│   ├── css/
│   │   └── theme.css            # CSS custom (si nécessaire)
│   ├── images/
│   │   ├── logo.svg
│   │   └── preview.png          # Screenshot pour le sélecteur de thème
│   └── fonts/
└── config/                      # Overrides de config
    └── theme-settings.json      # Valeurs par défaut des settings
```

## Manifeste : artisan-theme.json

```json
{
  "name": "Default Theme",
  "slug": "default",
  "version": "1.0.0",
  "description": "Thème par défaut d'ArtisanCMS - Moderne et responsive",
  "author": {
    "name": "ArtisanCMS",
    "url": "https://artisancms.dev"
  },
  "license": "MIT",
  "requires": {
    "cms": ">=1.0.0"
  },
  "preview": "assets/images/preview.png",
  "layouts": [
    {
      "slug": "default",
      "name": "Par défaut",
      "description": "Layout standard avec header et footer",
      "regions": ["header", "content", "footer"]
    },
    {
      "slug": "full-width",
      "name": "Pleine largeur",
      "description": "Sans marges latérales, idéal pour landing pages",
      "regions": ["header", "content", "footer"]
    },
    {
      "slug": "sidebar-left",
      "name": "Sidebar gauche",
      "description": "Contenu avec sidebar à gauche",
      "regions": ["header", "sidebar", "content", "footer"]
    },
    {
      "slug": "landing",
      "name": "Landing page",
      "description": "Sans header/footer, plein écran",
      "regions": ["content"]
    }
  ],
  "menu_locations": [
    { "slug": "header", "name": "Navigation principale" },
    { "slug": "footer", "name": "Navigation pied de page" },
    { "slug": "sidebar", "name": "Navigation sidebar" }
  ],
  "customization": {
    "colors": {
      "primary": {
        "label": "Couleur principale",
        "type": "color",
        "default": "#3b82f6"
      },
      "secondary": {
        "label": "Couleur secondaire",
        "type": "color",
        "default": "#64748b"
      },
      "accent": {
        "label": "Couleur d'accent",
        "type": "color",
        "default": "#f59e0b"
      },
      "background": {
        "label": "Fond de page",
        "type": "color",
        "default": "#ffffff"
      },
      "text": {
        "label": "Couleur du texte",
        "type": "color",
        "default": "#1e293b"
      }
    },
    "fonts": {
      "heading": {
        "label": "Police des titres",
        "type": "font",
        "default": "Inter",
        "options": ["Inter", "Poppins", "Montserrat", "Playfair Display", "Roboto"]
      },
      "body": {
        "label": "Police du corps",
        "type": "font",
        "default": "Inter",
        "options": ["Inter", "Open Sans", "Lato", "Roboto", "Source Sans Pro"]
      }
    },
    "layout": {
      "container_width": {
        "label": "Largeur max du contenu",
        "type": "select",
        "default": "1280px",
        "options": ["1024px", "1280px", "1440px", "1600px", "100%"]
      },
      "border_radius": {
        "label": "Arrondi des coins",
        "type": "select",
        "default": "0.5rem",
        "options": ["0", "0.25rem", "0.5rem", "0.75rem", "1rem"]
      }
    }
  },
  "blocks": ["hero-custom"],
  "supports": ["dark_mode", "responsive", "custom_css"]
}
```

---

## Core : Theme Manager (`app/CMS/Themes/ThemeManager.php`)

```php
<?php

declare(strict_types=1);

namespace App\CMS\Themes;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Cache;
use App\Models\CmsTheme;

class ThemeManager
{
    protected ?array $activeTheme = null;

    /**
     * Découvrir tous les thèmes disponibles dans content/themes/
     */
    public function discover(): array
    {
        return Cache::remember('cms.themes.discovered', 3600, function () {
            $themesPath = base_path('content/themes');
            $themes = [];

            if (!File::isDirectory($themesPath)) {
                return $themes;
            }

            foreach (File::directories($themesPath) as $dir) {
                $manifest = $dir . '/artisan-theme.json';
                if (File::exists($manifest)) {
                    $data = json_decode(File::get($manifest), true);
                    $data['path'] = $dir;
                    $themes[$data['slug']] = $data;
                }
            }

            return $themes;
        });
    }

    /**
     * Obtenir le thème actif
     */
    public function getActive(): ?array
    {
        if ($this->activeTheme) {
            return $this->activeTheme;
        }

        $activeSlug = Cache::remember('cms.theme.active_slug', 3600, function () {
            return CmsTheme::where('active', true)->value('slug');
        });

        if ($activeSlug) {
            $themes = $this->discover();
            $this->activeTheme = $themes[$activeSlug] ?? null;

            // Fusionner les customizations sauvegardées en DB
            if ($this->activeTheme) {
                $dbTheme = CmsTheme::where('slug', $activeSlug)->first();
                if ($dbTheme && $dbTheme->settings) {
                    $this->activeTheme['active_settings'] = $dbTheme->settings;
                }
                if ($dbTheme && $dbTheme->customizations) {
                    $this->activeTheme['active_customizations'] = $dbTheme->customizations;
                }
            }
        }

        return $this->activeTheme;
    }

    /**
     * Activer un thème
     */
    public function activate(string $slug): void
    {
        // Désactiver le thème actuel
        CmsTheme::where('active', true)->update(['active' => false]);

        // Activer le nouveau
        $theme = $this->discover()[$slug] ?? null;
        if (!$theme) {
            throw new \RuntimeException("Theme '{$slug}' not found.");
        }

        CmsTheme::updateOrCreate(
            ['slug' => $slug],
            [
                'name' => $theme['name'],
                'version' => $theme['version'],
                'active' => true,
            ]
        );

        // Clear caches
        Cache::forget('cms.theme.active_slug');
        Cache::forget('cms.theme.css_variables');
        $this->activeTheme = null;
    }

    /**
     * Générer les CSS variables à partir des customizations du thème
     */
    public function getCssVariables(): string
    {
        return Cache::remember('cms.theme.css_variables', 3600, function () {
            $theme = $this->getActive();
            if (!$theme) {
                return '';
            }

            $customization = $theme['customization'] ?? [];
            $activeSettings = $theme['active_settings'] ?? [];
            $vars = [];

            // Couleurs
            foreach ($customization['colors'] ?? [] as $key => $config) {
                $value = $activeSettings['colors'][$key] ?? $config['default'];
                $vars[] = "  --color-{$key}: {$value};";
            }

            // Fonts
            foreach ($customization['fonts'] ?? [] as $key => $config) {
                $value = $activeSettings['fonts'][$key] ?? $config['default'];
                $vars[] = "  --font-{$key}: '{$value}', sans-serif;";
            }

            // Layout
            foreach ($customization['layout'] ?? [] as $key => $config) {
                $value = $activeSettings['layout'][$key] ?? $config['default'];
                $cssKey = str_replace('_', '-', $key);
                $vars[] = "  --{$cssKey}: {$value};";
            }

            return ":root {\n" . implode("\n", $vars) . "\n}";
        });
    }

    /**
     * Obtenir les layouts disponibles pour le thème actif
     */
    public function getLayouts(): array
    {
        $theme = $this->getActive();
        return $theme['layouts'] ?? [];
    }

    /**
     * Obtenir les emplacements de menu du thème
     */
    public function getMenuLocations(): array
    {
        $theme = $this->getActive();
        return $theme['menu_locations'] ?? [];
    }

    /**
     * Sauvegarder les customizations du thème
     */
    public function saveCustomization(string $slug, array $settings): void
    {
        CmsTheme::where('slug', $slug)->update([
            'settings' => $settings,
        ]);

        Cache::forget('cms.theme.css_variables');
        Cache::forget('cms.theme.active_slug');
        $this->activeTheme = null;
    }
}
```

---

## CSS Variables → Tailwind CSS v4

Le thème génère des CSS variables qui s'intègrent avec Tailwind v4 :

```css
/* Généré dynamiquement par ThemeManager::getCssVariables() */
:root {
  --color-primary: #3b82f6;
  --color-secondary: #64748b;
  --color-accent: #f59e0b;
  --color-background: #ffffff;
  --color-text: #1e293b;
  --font-heading: 'Inter', sans-serif;
  --font-body: 'Inter', sans-serif;
  --container-width: 1280px;
  --border-radius: 0.5rem;
}

/* Dans le CSS Tailwind v4 (resources/css/app.css) */
@theme {
  --color-primary: var(--color-primary);
  --color-secondary: var(--color-secondary);
  --color-accent: var(--color-accent);
  --font-family-heading: var(--font-heading);
  --font-family-body: var(--font-body);
}
```

Usage dans les composants :
```tsx
<h1 className="font-heading text-primary">Mon titre</h1>
<p className="font-body text-text">Mon contenu</p>
<div className="max-w-[var(--container-width)] mx-auto">...</div>
```

---

## Layout React d'un thème

```tsx
// content/themes/default/layouts/default.tsx
import React from 'react';
import Header from '../partials/header';
import Footer from '../partials/footer';

interface LayoutProps {
  children: React.ReactNode;
  page: {
    title: string;
    meta_title?: string;
    meta_description?: string;
  };
  menus: Record<string, MenuItem[]>;
  settings: Record<string, any>;
}

export default function DefaultLayout({ children, page, menus, settings }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-background)] text-[var(--color-text)]">
      <Header menu={menus.header} settings={settings} />

      <main className="flex-1">
        <div className="max-w-[var(--container-width)] mx-auto px-4 py-8">
          {children}
        </div>
      </main>

      <Footer menu={menus.footer} settings={settings} />
    </div>
  );
}
```

---

## Personnalisation no-code (admin)

L'admin CMS propose un éditeur de thème visuel :

1. **Onglet Couleurs** : color pickers pour chaque variable couleur
2. **Onglet Typographie** : sélecteurs de fonts + preview en temps réel
3. **Onglet Layout** : largeur conteneur, arrondis, espacements
4. **Onglet CSS custom** : éditeur CSS pour overrides avancés
5. **Preview live** : iframe montrant le site avec les changements en temps réel
6. **Sauvegarder / Publier** : les changements sont sauvegardés en DB (table `cms_themes.settings`)

Le tout est un formulaire React qui modifie les CSS variables en temps réel dans l'iframe de preview, puis sauvegarde en DB via Inertia.
