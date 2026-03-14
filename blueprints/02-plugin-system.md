# Blueprint 02 - Système de Plugins

## Vue d'ensemble
Le système de plugins d'ArtisanCMS est inspiré de WordPress mais modernisé avec les Service Providers Laravel. Chaque plugin est isolé dans son propre dossier sous `content/plugins/`.

---

## Structure d'un plugin

```
content/plugins/contact-form/
├── artisan-plugin.json          # Manifeste du plugin
├── src/
│   ├── ContactFormServiceProvider.php   # Point d'entrée Laravel
│   ├── Models/
│   │   └── FormSubmission.php
│   ├── Http/
│   │   ├── Controllers/
│   │   │   └── FormController.php
│   │   └── Requests/
│   │       └── SubmitFormRequest.php
│   ├── Services/
│   │   └── FormService.php
│   └── Listeners/
│       └── SendNotification.php
├── database/
│   └── migrations/
│       └── 2024_01_01_create_form_submissions_table.php
├── resources/
│   ├── js/
│   │   ├── blocks/              # Blocs React du plugin
│   │   │   └── ContactFormBlock.tsx
│   │   └── admin/               # Pages admin React du plugin
│   │       └── FormSubmissions.tsx
│   └── lang/
│       ├── en/
│       │   └── messages.php
│       └── fr/
│           └── messages.php
├── routes/
│   ├── web.php
│   └── admin.php
├── config/
│   └── contact-form.php
└── tests/
    └── ContactFormTest.php
```

## Manifeste : artisan-plugin.json

```json
{
  "name": "Contact Form",
  "slug": "contact-form",
  "version": "1.0.0",
  "description": "Formulaire de contact avec notifications email",
  "author": {
    "name": "ArtisanCMS",
    "url": "https://artisancms.dev"
  },
  "license": "MIT",
  "requires": {
    "cms": ">=1.0.0",
    "php": ">=8.2"
  },
  "dependencies": [],
  "providers": ["ContactForm\\ContactFormServiceProvider"],
  "blocks": ["contact-form"],
  "routes": true,
  "migrations": true,
  "settings": {
    "recipient_email": {
      "type": "string",
      "label": "Email destinataire",
      "default": ""
    },
    "success_message": {
      "type": "string",
      "label": "Message de succès",
      "default": "Merci pour votre message !"
    }
  },
  "admin_pages": [
    {
      "title": "Soumissions",
      "slug": "submissions",
      "icon": "inbox",
      "parent": "contact-form"
    }
  ]
}
```

---

## Core : Plugin Manager (`app/CMS/Plugins/PluginManager.php`)

```php
<?php

declare(strict_types=1);

namespace App\CMS\Plugins;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Cache;
use App\Models\CmsPlugin;

class PluginManager
{
    protected array $loaded = [];
    protected array $hooks = [];
    protected array $filters = [];

    /**
     * Découvrir tous les plugins dans content/plugins/
     */
    public function discover(): array
    {
        $pluginsPath = base_path('content/plugins');
        $plugins = [];

        if (!File::isDirectory($pluginsPath)) {
            return $plugins;
        }

        foreach (File::directories($pluginsPath) as $dir) {
            $manifest = $dir . '/artisan-plugin.json';
            if (File::exists($manifest)) {
                $data = json_decode(File::get($manifest), true);
                $data['path'] = $dir;
                $plugins[$data['slug']] = $data;
            }
        }

        return $plugins;
    }

    /**
     * Charger et démarrer tous les plugins activés
     */
    public function bootAll(): void
    {
        $enabled = CmsPlugin::where('enabled', true)
            ->orderBy('order')
            ->pluck('slug')
            ->toArray();

        $discovered = $this->discover();

        foreach ($enabled as $slug) {
            if (isset($discovered[$slug])) {
                $this->boot($slug, $discovered[$slug]);
            }
        }
    }

    /**
     * Démarrer un plugin spécifique
     */
    public function boot(string $slug, array $manifest): void
    {
        if (isset($this->loaded[$slug])) {
            return;
        }

        // Enregistrer l'autoloader du plugin
        $this->registerAutoloader($slug, $manifest['path']);

        // Enregistrer les Service Providers
        foreach ($manifest['providers'] ?? [] as $provider) {
            app()->register($provider);
        }

        // Charger les routes
        if ($manifest['routes'] ?? false) {
            $this->loadRoutes($manifest['path']);
        }

        // Enregistrer les blocs
        foreach ($manifest['blocks'] ?? [] as $blockSlug) {
            app('cms.blocks')->registerFromPlugin($slug, $blockSlug, $manifest['path']);
        }

        $this->loaded[$slug] = $manifest;
    }

    /**
     * Installer un plugin
     */
    public function install(string $slug): void
    {
        $manifest = $this->discover()[$slug] ?? null;
        if (!$manifest) {
            throw new \RuntimeException("Plugin '{$slug}' not found.");
        }

        // Créer l'entrée en DB
        CmsPlugin::create([
            'slug' => $slug,
            'name' => $manifest['name'],
            'version' => $manifest['version'],
            'description' => $manifest['description'] ?? null,
            'author' => $manifest['author']['name'] ?? null,
            'enabled' => false,
            'settings' => $this->extractDefaultSettings($manifest),
            'installed_at' => now(),
        ]);

        // Exécuter les migrations
        if ($manifest['migrations'] ?? false) {
            $this->runMigrations($manifest['path']);
        }

        $this->fireHook('plugin.installed', $slug);
    }

    /**
     * Activer un plugin
     */
    public function activate(string $slug): void
    {
        $plugin = CmsPlugin::where('slug', $slug)->firstOrFail();
        $plugin->update(['enabled' => true, 'activated_at' => now()]);
        Cache::forget('cms.plugins.enabled');
        $this->fireHook('plugin.activated', $slug);
    }

    /**
     * Désactiver un plugin
     */
    public function deactivate(string $slug): void
    {
        $plugin = CmsPlugin::where('slug', $slug)->firstOrFail();
        $plugin->update(['enabled' => false, 'activated_at' => null]);
        Cache::forget('cms.plugins.enabled');
        $this->fireHook('plugin.deactivated', $slug);
    }

    /**
     * Désinstaller un plugin
     */
    public function uninstall(string $slug): void
    {
        $this->deactivate($slug);
        $manifest = $this->discover()[$slug] ?? null;

        if ($manifest && ($manifest['migrations'] ?? false)) {
            $this->rollbackMigrations($manifest['path']);
        }

        CmsPlugin::where('slug', $slug)->delete();
        $this->fireHook('plugin.uninstalled', $slug);
    }

    // --- Hook System ---

    /**
     * Enregistrer un hook (action)
     */
    public function hook(string $name, callable $callback, int $priority = 10): void
    {
        $this->hooks[$name][] = [
            'callback' => $callback,
            'priority' => $priority,
        ];
    }

    /**
     * Déclencher un hook
     */
    public function fireHook(string $name, ...$args): void
    {
        $hooks = $this->hooks[$name] ?? [];
        usort($hooks, fn($a, $b) => $a['priority'] <=> $b['priority']);

        foreach ($hooks as $hook) {
            call_user_func($hook['callback'], ...$args);
        }
    }

    /**
     * Enregistrer un filtre
     */
    public function filter(string $name, callable $callback, int $priority = 10): void
    {
        $this->filters[$name][] = [
            'callback' => $callback,
            'priority' => $priority,
        ];
    }

    /**
     * Appliquer un filtre
     */
    public function applyFilter(string $name, mixed $value, ...$args): mixed
    {
        $filters = $this->filters[$name] ?? [];
        usort($filters, fn($a, $b) => $a['priority'] <=> $b['priority']);

        foreach ($filters as $filter) {
            $value = call_user_func($filter['callback'], $value, ...$args);
        }

        return $value;
    }

    // --- Private helpers ---

    protected function registerAutoloader(string $slug, string $path): void
    {
        $srcPath = $path . '/src';
        if (File::isDirectory($srcPath)) {
            spl_autoload_register(function (string $class) use ($slug, $srcPath) {
                $namespace = str_replace('-', '', ucwords($slug, '-')) . '\\';
                if (str_starts_with($class, $namespace)) {
                    $relative = str_replace($namespace, '', $class);
                    $file = $srcPath . '/' . str_replace('\\', '/', $relative) . '.php';
                    if (File::exists($file)) {
                        require_once $file;
                    }
                }
            });
        }
    }

    protected function loadRoutes(string $path): void
    {
        $webRoutes = $path . '/routes/web.php';
        $adminRoutes = $path . '/routes/admin.php';

        if (File::exists($webRoutes)) {
            \Illuminate\Support\Facades\Route::middleware('web')->group($webRoutes);
        }
        if (File::exists($adminRoutes)) {
            \Illuminate\Support\Facades\Route::middleware(['web', 'auth', 'admin'])
                ->prefix('admin')
                ->group($adminRoutes);
        }
    }

    protected function runMigrations(string $path): void
    {
        $migrationsPath = $path . '/database/migrations';
        if (File::isDirectory($migrationsPath)) {
            \Illuminate\Support\Facades\Artisan::call('migrate', [
                '--path' => str_replace(base_path() . '/', '', $migrationsPath),
                '--force' => true,
            ]);
        }
    }

    protected function rollbackMigrations(string $path): void
    {
        $migrationsPath = $path . '/database/migrations';
        if (File::isDirectory($migrationsPath)) {
            \Illuminate\Support\Facades\Artisan::call('migrate:rollback', [
                '--path' => str_replace(base_path() . '/', '', $migrationsPath),
                '--force' => true,
            ]);
        }
    }

    protected function extractDefaultSettings(array $manifest): array
    {
        $settings = [];
        foreach ($manifest['settings'] ?? [] as $key => $config) {
            $settings[$key] = $config['default'] ?? null;
        }
        return $settings;
    }
}
```

---

## Facade CMS (`app/CMS/Facades/CMS.php`)

```php
<?php

namespace App\CMS\Facades;

use Illuminate\Support\Facades\Facade;

class CMS extends Facade
{
    protected static function getFacadeAccessor(): string
    {
        return 'cms.plugins';
    }
}
```

Usage :
```php
use App\CMS\Facades\CMS;

// Dans un plugin Service Provider :
CMS::hook('before_page_render', function ($page) {
    // Injecter du tracking, modifier le contenu, etc.
});

CMS::filter('page_title', function ($title) {
    return $title . ' | Mon Site';
});

// Déclencher depuis le core :
CMS::fireHook('before_page_render', $page);
$title = CMS::applyFilter('page_title', $page->title);
```

---

## Hooks disponibles (core)

| Hook | Arguments | Description |
|------|-----------|-------------|
| `cms.booted` | - | CMS complètement chargé |
| `plugin.installed` | slug | Plugin installé |
| `plugin.activated` | slug | Plugin activé |
| `plugin.deactivated` | slug | Plugin désactivé |
| `page.creating` | Page | Avant création d'une page |
| `page.created` | Page | Après création |
| `page.updating` | Page | Avant mise à jour |
| `page.updated` | Page | Après mise à jour |
| `page.deleting` | Page | Avant suppression |
| `page.rendering` | Page | Avant rendu front |
| `post.creating` | Post | Avant création d'un post |
| `post.created` | Post | Après création |
| `media.uploaded` | Media | Après upload d'un média |
| `theme.activated` | slug | Thème activé |
| `menu.rendering` | Menu | Avant rendu d'un menu |
| `user.registered` | User | Après inscription |

## Filtres disponibles (core)

| Filtre | Valeur | Description |
|--------|--------|-------------|
| `page_title` | string | Titre de la page |
| `page_content` | array | Contenu JSON de la page |
| `page_meta` | array | Meta SEO de la page |
| `post_content` | array | Contenu JSON du post |
| `menu_items` | array | Items d'un menu |
| `admin_sidebar` | array | Items du sidebar admin |
| `block_render` | string | HTML rendu d'un bloc |
| `media_upload_rules` | array | Règles de validation upload |
| `head_tags` | string | Tags injectés dans <head> |
| `body_end` | string | Tags injectés avant </body> |
