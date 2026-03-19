<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Block;
use App\Models\CmsTheme;
use App\Models\Page;
use App\Models\Role;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class InstallerService
{
    public const STEPS = [
        'env'         => ['label' => 'Configuration .env', 'weight' => 5],
        'migrations'  => ['label' => 'Création des tables', 'weight' => 20],
        'roles'       => ['label' => 'Création des rôles', 'weight' => 5],
        'admin'       => ['label' => 'Compte administrateur', 'weight' => 5],
        'settings'    => ['label' => 'Paramètres du site', 'weight' => 10],
        'theme'       => ['label' => 'Thème par défaut', 'weight' => 15],
        'blocks'      => ['label' => 'Blocs core', 'weight' => 15],
        'homepage'    => ['label' => "Page d'accueil", 'weight' => 10],
        'directories' => ['label' => 'Création des dossiers', 'weight' => 5],
        'finalize'    => ['label' => 'Finalisation', 'weight' => 10],
    ];

    public function runStep(string $stepName, array $config): array
    {
        if (!isset(self::STEPS[$stepName])) {
            return ['success' => false, 'message' => "Étape inconnue : {$stepName}"];
        }

        try {
            match ($stepName) {
                'env' => $this->stepEnv($config),
                'migrations' => $this->stepMigrations($config),
                'roles' => $this->seedRoles(),
                'admin' => $this->createAdmin($config),
                'settings' => $this->seedSettings($config),
                'theme' => $this->installDefaultTheme(),
                'blocks' => $this->seedCoreBlocks(),
                'homepage' => $this->createHomepage(),
                'directories' => $this->createDirectories(),
                'finalize' => $this->stepFinalize($config),
            };

            return ['success' => true, 'message' => self::STEPS[$stepName]['label'] . ' terminé.'];
        } catch (\Throwable $e) {
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    private function stepEnv(array $config): void
    {
        $envPath = base_path('.env');
        $envContent = file_get_contents($envPath);

        $replacements = [
            'DB_CONNECTION' => 'mysql',
            'DB_HOST' => $config['db_host'],
            'DB_PORT' => (string) $config['db_port'],
            'DB_DATABASE' => $config['db_database'],
            'DB_USERNAME' => $config['db_username'],
            'DB_PASSWORD' => $config['db_password'],
            'APP_NAME' => str_contains($config['site_name'] ?? 'ArtisanCMS', ' ')
                ? '"' . ($config['site_name'] ?? 'ArtisanCMS') . '"'
                : ($config['site_name'] ?? 'ArtisanCMS'),
            'APP_URL' => $config['site_url'] ?? 'http://localhost',
            'APP_TIMEZONE' => $config['timezone'] ?? 'UTC',
            'APP_LOCALE' => $config['locale'] ?? 'fr',
        ];

        if (!empty($config['db_prefix'])) {
            $replacements['DB_PREFIX'] = $config['db_prefix'];
        }

        foreach ($replacements as $key => $value) {
            if (preg_match("/^{$key}=.*/m", $envContent)) {
                $envContent = preg_replace("/^{$key}=.*/m", "{$key}={$value}", $envContent);
            } else {
                $envContent .= "\n{$key}={$value}";
            }
        }

        // Write to temp file then rename to avoid file locking issues (Vite watcher)
        $tmpPath = $envPath . '.tmp';
        file_put_contents($tmpPath, $envContent);
        if (DIRECTORY_SEPARATOR === '\\') {
            // Windows: rename fails if target exists, use copy + unlink
            copy($tmpPath, $envPath);
            @unlink($tmpPath);
        } else {
            rename($tmpPath, $envPath);
        }

        Artisan::call('config:clear');
    }

    private function stepMigrations(array $config): void
    {
        // Reload DB config from the .env we just wrote
        $dbConfig = [
            'driver' => 'mysql',
            'host' => $config['db_host'],
            'port' => $config['db_port'],
            'database' => $config['db_database'],
            'username' => $config['db_username'],
            'password' => $config['db_password'],
            'prefix' => $config['db_prefix'] ?? '',
            'charset' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
        ];
        config(['database.connections.mysql' => array_merge(
            config('database.connections.mysql'),
            $dbConfig,
        )]);
        DB::purge('mysql');
        DB::reconnect('mysql');

        Artisan::call('migrate', ['--force' => true]);
    }

    private function stepFinalize(array $config): void
    {
        file_put_contents(storage_path('.installed'), json_encode([
            'version' => config('cms.version', '1.0.0'),
            'stack' => $config['stack'] ?? 'laravel',
            'installed_at' => now()->toIso8601String(),
            'php_version' => PHP_VERSION,
        ]));

        Artisan::call('config:clear');
        Artisan::call('cache:clear');
        Artisan::call('route:clear');
        Artisan::call('view:clear');

        if (empty(config('app.key')) || config('app.key') === 'base64:') {
            Artisan::call('key:generate', ['--force' => true]);
        }

        try {
            Artisan::call('storage:link');
        } catch (\Throwable) {
            // Link may already exist
        }
    }

    public function install(array $config): array
    {
        $stepNames = array_keys(self::STEPS);

        foreach ($stepNames as $stepName) {
            $result = $this->runStep($stepName, $config);
            if (!$result['success']) {
                return $result;
            }
        }

        return ['success' => true, 'message' => 'Installation terminée.'];
    }

    private function seedRoles(): void
    {
        $roles = [
            [
                'name' => 'Administrateur',
                'slug' => 'admin',
                'permissions' => ['*'],
                'is_system' => true,
            ],
            [
                'name' => 'Éditeur',
                'slug' => 'editor',
                'permissions' => ['pages.*', 'posts.*', 'media.*', 'menus.*', 'taxonomies.*'],
                'is_system' => true,
            ],
            [
                'name' => 'Auteur',
                'slug' => 'author',
                'permissions' => ['pages.create', 'pages.update.own', 'posts.create', 'posts.update.own', 'media.create'],
                'is_system' => true,
            ],
            [
                'name' => 'Abonné',
                'slug' => 'subscriber',
                'permissions' => ['profile.edit'],
                'is_system' => true,
            ],
        ];

        foreach ($roles as $role) {
            Role::updateOrCreate(['slug' => $role['slug']], $role);
        }
    }

    private function createAdmin(array $config): void
    {
        $adminRole = Role::where('slug', 'admin')->first();

        User::updateOrCreate(
            ['email' => $config['admin_email']],
            [
                'name' => $config['admin_name'],
                'email' => $config['admin_email'],
                'password' => Hash::make($config['admin_password']),
                'role_id' => $adminRole->id,
                'email_verified_at' => now(),
            ]
        );
    }

    private function seedSettings(array $config): void
    {
        $settings = [
            ['group' => 'general', 'key' => 'site_name', 'value' => $config['site_name'] ?? 'ArtisanCMS', 'type' => 'string', 'is_public' => true],
            ['group' => 'general', 'key' => 'site_description', 'value' => $config['site_description'] ?? '', 'type' => 'string', 'is_public' => true],
            ['group' => 'general', 'key' => 'site_url', 'value' => $config['site_url'] ?? 'http://localhost', 'type' => 'string', 'is_public' => true],
            ['group' => 'general', 'key' => 'locale', 'value' => $config['locale'] ?? 'fr', 'type' => 'string', 'is_public' => false],
            ['group' => 'general', 'key' => 'timezone', 'value' => $config['timezone'] ?? 'Europe/Paris', 'type' => 'string', 'is_public' => false],
            ['group' => 'general', 'key' => 'date_format', 'value' => 'd/m/Y', 'type' => 'string', 'is_public' => false],
            ['group' => 'general', 'key' => 'time_format', 'value' => 'H:i', 'type' => 'string', 'is_public' => false],
            ['group' => 'general', 'key' => 'site_logo', 'value' => null, 'type' => 'image', 'is_public' => true],
            ['group' => 'general', 'key' => 'site_favicon', 'value' => null, 'type' => 'image', 'is_public' => true],
            ['group' => 'seo', 'key' => 'meta_title_suffix', 'value' => ' | ' . ($config['site_name'] ?? 'ArtisanCMS'), 'type' => 'string', 'is_public' => false],
            ['group' => 'seo', 'key' => 'meta_description', 'value' => $config['site_description'] ?? '', 'type' => 'string', 'is_public' => false],
            ['group' => 'seo', 'key' => 'robots_index', 'value' => true, 'type' => 'boolean', 'is_public' => false],
            ['group' => 'seo', 'key' => 'sitemap_enabled', 'value' => true, 'type' => 'boolean', 'is_public' => false],
            ['group' => 'mail', 'key' => 'from_name', 'value' => $config['site_name'] ?? 'ArtisanCMS', 'type' => 'string', 'is_public' => false],
            ['group' => 'mail', 'key' => 'from_email', 'value' => $config['admin_email'] ?? 'noreply@example.com', 'type' => 'string', 'is_public' => false],
            ['group' => 'content', 'key' => 'posts_per_page', 'value' => 10, 'type' => 'number', 'is_public' => false],
            ['group' => 'content', 'key' => 'allow_comments', 'value' => true, 'type' => 'boolean', 'is_public' => false],
            ['group' => 'content', 'key' => 'homepage_type', 'value' => 'page', 'type' => 'string', 'is_public' => false],
            ['group' => 'content', 'key' => 'homepage_id', 'value' => null, 'type' => 'number', 'is_public' => false],
            ['group' => 'media', 'key' => 'max_upload_size', 'value' => 10, 'type' => 'number', 'is_public' => false],
            ['group' => 'media', 'key' => 'allowed_types', 'value' => ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'pdf', 'doc', 'docx', 'mp4', 'webm'], 'type' => 'json', 'is_public' => false],
            ['group' => 'media', 'key' => 'image_sizes', 'value' => ['sm' => 300, 'md' => 768, 'lg' => 1200], 'type' => 'json', 'is_public' => false],
            ['group' => 'maintenance', 'key' => 'enabled', 'value' => false, 'type' => 'boolean', 'is_public' => true],
            ['group' => 'maintenance', 'key' => 'message', 'value' => 'Site en maintenance. Revenez bientôt !', 'type' => 'string', 'is_public' => true],
        ];

        foreach ($settings as $setting) {
            Setting::updateOrCreate(
                ['group' => $setting['group'], 'key' => $setting['key']],
                [
                    'value' => is_array($setting['value']) || is_bool($setting['value'])
                        ? json_encode($setting['value'])
                        : ($setting['value'] === null ? null : (string) $setting['value']),
                    'type' => $setting['type'],
                    'is_public' => $setting['is_public'],
                ]
            );
        }
    }

    private function installDefaultTheme(): void
    {
        $themePath = base_path('content/themes/default');
        if (!is_dir($themePath)) {
            mkdir($themePath, 0755, true);
        }
        foreach (['layouts', 'blocks', 'assets', 'assets/css'] as $dir) {
            if (!is_dir("{$themePath}/{$dir}")) {
                mkdir("{$themePath}/{$dir}", 0755, true);
            }
        }

        CmsTheme::updateOrCreate(
            ['slug' => 'default'],
            [
                'name' => 'Default Theme',
                'version' => '1.0.0',
                'description' => "Thème par défaut d'ArtisanCMS.",
                'author' => 'ArtisanCMS',
                'active' => true,
                'settings' => [
                    'primary' => '#3b82f6',
                    'secondary' => '#64748b',
                    'accent' => '#f59e0b',
                    'background' => '#ffffff',
                    'foreground' => '#0f172a',
                    'heading' => 'Inter',
                    'body' => 'Inter',
                ],
            ]
        );
    }

    private function seedCoreBlocks(): void
    {
        $blocks = [
            ['slug' => 'section', 'name' => 'Section', 'category' => 'layout', 'icon' => 'LayoutTemplate', 'is_core' => true, 'source' => 'core'],
            ['slug' => 'grid', 'name' => 'Grille', 'category' => 'layout', 'icon' => 'Grid3X3', 'is_core' => true, 'source' => 'core'],
            ['slug' => 'spacer', 'name' => 'Espacement', 'category' => 'layout', 'icon' => 'MoveVertical', 'is_core' => true, 'source' => 'core'],
            ['slug' => 'divider', 'name' => 'Séparateur', 'category' => 'layout', 'icon' => 'Minus', 'is_core' => true, 'source' => 'core'],
            ['slug' => 'heading', 'name' => 'Titre', 'category' => 'content', 'icon' => 'Heading', 'is_core' => true, 'source' => 'core'],
            ['slug' => 'text', 'name' => 'Texte', 'category' => 'content', 'icon' => 'Type', 'is_core' => true, 'source' => 'core'],
            ['slug' => 'image', 'name' => 'Image', 'category' => 'content', 'icon' => 'Image', 'is_core' => true, 'source' => 'core'],
            ['slug' => 'video', 'name' => 'Vidéo', 'category' => 'content', 'icon' => 'Play', 'is_core' => true, 'source' => 'core'],
            ['slug' => 'button', 'name' => 'Bouton', 'category' => 'content', 'icon' => 'MousePointerClick', 'is_core' => true, 'source' => 'core'],
            ['slug' => 'hero-section', 'name' => 'Hero', 'category' => 'content', 'icon' => 'Sparkles', 'is_core' => true, 'source' => 'core'],
            ['slug' => 'html', 'name' => 'HTML', 'category' => 'content', 'icon' => 'Code', 'is_core' => true, 'source' => 'core'],
        ];

        foreach ($blocks as $block) {
            Block::updateOrCreate(
                ['slug' => $block['slug']],
                array_merge($block, [
                    'schema' => json_encode(['type' => 'object', 'properties' => []]),
                    'default_props' => json_encode([]),
                ])
            );
        }
    }

    private function createHomepage(): void
    {
        $admin = User::whereHas('role', fn ($q) => $q->where('slug', 'admin'))->first();
        if (!$admin) {
            return;
        }

        $homepage = Page::updateOrCreate(
            ['slug' => 'accueil'],
            [
                'title' => 'Bienvenue',
                'slug' => 'accueil',
                'content' => [
                    'blocks' => [
                        [
                            'id' => Str::uuid()->toString(),
                            'type' => 'section',
                            'props' => ['background' => 'transparent', 'padding' => '80px 0', 'maxWidth' => '1200px'],
                            'children' => [
                                [
                                    'id' => Str::uuid()->toString(),
                                    'type' => 'heading',
                                    'props' => ['text' => 'Bienvenue sur votre site', 'level' => 1, 'align' => 'center'],
                                    'children' => [],
                                ],
                                [
                                    'id' => Str::uuid()->toString(),
                                    'type' => 'text',
                                    'props' => ['html' => '<p style="text-align: center;">Votre site ArtisanCMS est prêt. Rendez-vous dans le <strong>tableau de bord</strong> pour commencer à créer votre contenu.</p>'],
                                    'children' => [],
                                ],
                            ],
                        ],
                    ],
                ],
                'status' => 'published',
                'template' => 'default',
                'meta_title' => 'Accueil',
                'meta_description' => "Page d'accueil du site.",
                'created_by' => $admin->id,
                'published_at' => now(),
            ]
        );

        Setting::updateOrCreate(
            ['group' => 'content', 'key' => 'homepage_id'],
            ['value' => (string) $homepage->id, 'type' => 'number', 'is_public' => false]
        );
    }

    private function createDirectories(): void
    {
        $directories = [
            base_path('content'),
            base_path('content/themes'),
            base_path('content/themes/default'),
            base_path('content/plugins'),
            storage_path('app/public/media'),
            storage_path('app/public/media/thumbnails'),
        ];

        foreach ($directories as $dir) {
            if (!is_dir($dir)) {
                mkdir($dir, 0755, true);
            }
        }
    }
}
