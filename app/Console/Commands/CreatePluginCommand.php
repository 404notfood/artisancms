<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Block;
use Illuminate\Console\Command;

class CreatePluginCommand extends Command
{
    protected $signature = 'cms:plugin:create {slug? : The plugin slug (kebab-case)}';

    protected $description = 'Créer un nouveau plugin ArtisanCMS (wizard interactif)';

    public function handle(): int
    {
        $this->components->info('🔌 Création d\'un nouveau plugin ArtisanCMS');
        $this->newLine();

        // ─── Slug ────────────────────────────────────────
        $slug = $this->argument('slug') ?? $this->ask('Slug du plugin (kebab-case)', 'mon-plugin');

        if (!preg_match('/^[a-z0-9]+(-[a-z0-9]+)*$/', $slug)) {
            $this->components->error("Le slug « {$slug} » est invalide. Utilisez le format kebab-case (ex: mon-plugin).");
            return self::FAILURE;
        }

        $pluginPath = base_path("content/plugins/{$slug}");

        if (is_dir($pluginPath)) {
            $this->components->error("Le plugin « {$slug} » existe déjà.");
            return self::FAILURE;
        }

        // ─── Basic info ──────────────────────────────────
        $name = $this->ask('Nom du plugin', ucwords(str_replace('-', ' ', $slug)));
        $description = $this->ask('Description', "Plugin {$name} pour ArtisanCMS");
        $authorName = $this->ask('Auteur', 'ArtisanCMS');
        $license = $this->choice('Licence', ['MIT', 'GPL-2.0', 'GPL-3.0', 'Apache-2.0', 'Proprietary'], 0);

        // ─── Features ────────────────────────────────────
        $this->newLine();
        $this->components->info('Fonctionnalités du plugin :');

        $hasRoutes = $this->confirm('Ajouter des routes (web + admin) ?', true);
        $hasMigrations = $this->confirm('Ajouter des migrations de base de données ?', true);
        $hasSettings = $this->confirm('Ajouter des paramètres configurables ?', true);
        $hasBlocks = $this->confirm('Ajouter des blocs pour le page builder ?', false);
        $hasMiddleware = $this->confirm('Ajouter un middleware ?', false);
        $hasEvents = $this->confirm('Utiliser les hooks/events du CMS ?', true);

        // ─── Blocks wizard ───────────────────────────────
        $blocks = [];
        if ($hasBlocks) {
            $this->newLine();
            $this->components->info('📦 Blocs pour le page builder :');

            while (true) {
                $blockSlug = $this->ask('Slug du bloc (kebab-case, vide pour terminer)');
                if (empty($blockSlug)) {
                    break;
                }

                if (!preg_match('/^[a-z0-9]+(-[a-z0-9]+)*$/', $blockSlug)) {
                    $this->components->warn('Slug invalide, réessayez.');
                    continue;
                }

                $blockName = $this->ask('Nom du bloc', ucwords(str_replace('-', ' ', $blockSlug)));
                $blockCategory = $this->choice('Catégorie', ['content', 'layout', 'media', 'data', 'interactive', 'marketing'], 0);
                $blockIcon = $this->ask('Icône Lucide', 'Box');

                // Props
                $props = [];
                $this->line("  Propriétés du bloc (vide pour terminer) :");
                while (true) {
                    $propName = $this->ask('    Nom de la propriété');
                    if (empty($propName)) {
                        break;
                    }
                    $propType = $this->choice('    Type', ['string', 'number', 'boolean', 'color', 'select', 'richtext'], 0);
                    $propDefault = $this->ask('    Valeur par défaut', '');
                    $props[$propName] = ['type' => $propType, 'default' => $this->castDefault($propType, $propDefault)];
                }

                $blocks[] = [
                    'slug' => $blockSlug,
                    'name' => $blockName,
                    'category' => $blockCategory,
                    'icon' => $blockIcon,
                    'props' => $props,
                ];

                $this->components->twoColumnDetail($blockSlug, count($props) . ' propriété(s)');
            }
        }

        // ─── Settings wizard ─────────────────────────────
        $settings = [];
        if ($hasSettings) {
            $this->newLine();
            $this->components->info('⚙️  Paramètres du plugin :');

            while (true) {
                $settingKey = $this->ask('Clé du paramètre (snake_case, vide pour terminer)');
                if (empty($settingKey)) {
                    break;
                }

                $settingType = $this->choice('Type', ['text', 'textarea', 'number', 'boolean', 'password', 'select', 'color'], 0);
                $settingLabel = $this->ask('Label', ucwords(str_replace('_', ' ', $settingKey)));
                $settingDefault = $this->ask('Valeur par défaut', '');

                $settings[$settingKey] = [
                    'type' => $settingType,
                    'label' => $settingLabel,
                    'default' => $settingDefault,
                ];
            }
        }

        // ─── Confirmation ────────────────────────────────
        $this->newLine();
        $this->components->info('Récapitulatif :');
        $this->components->twoColumnDetail('Plugin', "{$name} ({$slug})");
        $this->components->twoColumnDetail('Routes', $hasRoutes ? 'Oui' : 'Non');
        $this->components->twoColumnDetail('Migrations', $hasMigrations ? 'Oui' : 'Non');
        $this->components->twoColumnDetail('Settings', $hasSettings ? count($settings) . ' paramètre(s)' : 'Non');
        $this->components->twoColumnDetail('Blocs', $hasBlocks ? count($blocks) . ' bloc(s)' : 'Non');
        $this->components->twoColumnDetail('Middleware', $hasMiddleware ? 'Oui' : 'Non');
        $this->components->twoColumnDetail('Hooks/Events', $hasEvents ? 'Oui' : 'Non');
        $this->newLine();

        if (!$this->confirm('Créer le plugin ?', true)) {
            $this->components->warn('Annulé.');
            return self::SUCCESS;
        }

        // ─── Generate ────────────────────────────────────
        $pascalName = str_replace(' ', '', ucwords(str_replace('-', ' ', $slug)));
        $namespace = $pascalName;

        $this->scaffold($pluginPath, $slug, $name, $description, $authorName, $license, $namespace, $pascalName, $hasRoutes, $hasMigrations, $hasSettings, $hasBlocks, $hasMiddleware, $hasEvents, $blocks, $settings);

        $this->newLine();
        $this->components->info("✅ Plugin « {$name} » créé avec succès !");
        $this->components->twoColumnDetail('Chemin', $pluginPath);

        if ($hasBlocks && !empty($blocks)) {
            $this->newLine();
            $this->components->warn("N'oubliez pas de créer les fichiers TSX des blocs dans resources/js :");
            foreach ($blocks as $b) {
                $this->line("  • renderers/{$b['slug']}-renderer.tsx");
                $this->line("  • settings/{$b['slug']}-settings.tsx");
            }
        }

        $this->newLine();
        $this->line("Prochaines étapes :");
        $this->line("  1. php artisan migrate (si migrations)");
        $this->line("  2. Activez le plugin dans Admin > Plugins");

        return self::SUCCESS;
    }

    private function scaffold(
        string $path, string $slug, string $name, string $description,
        string $author, string $license, string $namespace, string $pascal,
        bool $hasRoutes, bool $hasMigrations, bool $hasSettings, bool $hasBlocks,
        bool $hasMiddleware, bool $hasEvents, array $blocks, array $settings,
    ): void {
        // Directories
        $dirs = ["{$path}/src"];
        if ($hasRoutes) {
            $dirs[] = "{$path}/routes";
        }
        if ($hasMigrations) {
            $dirs[] = "{$path}/database/migrations";
        }
        if ($hasMiddleware) {
            $dirs[] = "{$path}/src/Http/Middleware";
        }
        if ($hasBlocks) {
            $dirs[] = "{$path}/src/Blocks";
        }
        $dirs[] = "{$path}/config";
        $dirs[] = "{$path}/resources/lang/fr";

        foreach ($dirs as $dir) {
            mkdir($dir, 0755, true);
        }

        // Manifest
        $manifest = [
            'name' => $name,
            'slug' => $slug,
            'version' => '1.0.0',
            'description' => $description,
            'author' => ['name' => $author],
            'license' => $license,
            'requires' => ['cms' => '>=1.0.0', 'php' => '>=8.3'],
            'providers' => ["{$namespace}\\{$pascal}ServiceProvider"],
            'has_routes' => $hasRoutes,
            'has_migrations' => $hasMigrations,
            'has_settings' => $hasSettings,
            'icon' => 'Plug',
            'settings' => empty($settings) ? (object) [] : $settings,
        ];

        $this->writeJson("{$path}/artisan-plugin.json", $manifest);

        // ServiceProvider
        $this->generateServiceProvider($path, $namespace, $pascal, $slug, $hasRoutes, $hasMigrations, $hasBlocks, $hasEvents, $blocks);

        // Config
        $this->generateConfig($path, $slug, $settings);

        // Routes
        if ($hasRoutes) {
            $this->generateRoutes($path, $namespace, $pascal, $slug);
        }

        // Migration
        if ($hasMigrations) {
            $this->generateMigration($path, $slug);
        }

        // Middleware
        if ($hasMiddleware) {
            $this->generateMiddleware($path, $namespace, $pascal);
        }

        // Blocks — PHP registration + TSX stubs
        if ($hasBlocks && !empty($blocks)) {
            $this->generateBlocks($path, $namespace, $slug, $blocks);
        }

        // Language file
        $this->writeFile("{$path}/resources/lang/fr/{$slug}.php", "<?php\n\nreturn [\n    'name' => '{$name}',\n];\n");
    }

    private function generateServiceProvider(string $path, string $ns, string $pascal, string $slug, bool $routes, bool $migrations, bool $blocks, bool $events, array $blockDefs): void
    {
        $bootLines = [];

        if ($migrations) {
            $bootLines[] = "        \$this->loadMigrationsFrom(__DIR__ . '/../database/migrations');";
        }
        if ($routes) {
            $bootLines[] = <<<'PHP'
        if (file_exists(__DIR__ . '/../routes/web.php')) {
            $this->loadRoutesFrom(__DIR__ . '/../routes/web.php');
        }
        if (file_exists(__DIR__ . '/../routes/admin.php')) {
            $this->loadRoutesFrom(__DIR__ . '/../routes/admin.php');
        }
PHP;
        }

        $bootLines[] = "        \$this->loadTranslationsFrom(__DIR__ . '/../resources/lang', '{$slug}');";

        if ($blocks && !empty($blockDefs)) {
            foreach ($blockDefs as $b) {
                $bootLines[] = "        // Bloc: {$b['slug']} — enregistré via BlockSeeder ou dynamiquement";
            }
        }

        if ($events) {
            $bootLines[] = '';
            $bootLines[] = "        // Hooks CMS";
            $bootLines[] = "        // \\App\\CMS\\Facades\\CMS::hook('page.published', function (\$page) { /* ... */ });";
        }

        $bootContent = implode("\n", $bootLines);

        $content = <<<PHP
<?php

declare(strict_types=1);

namespace {$ns};

use Illuminate\Support\ServiceProvider;

class {$pascal}ServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        \$this->mergeConfigFrom(__DIR__ . '/../config/{$slug}.php', '{$slug}');
    }

    public function boot(): void
    {
{$bootContent}
    }
}
PHP;

        $this->writeFile("{$path}/src/{$pascal}ServiceProvider.php", $content . "\n");
    }

    private function generateConfig(string $path, string $slug, array $settings): void
    {
        $lines = [];
        foreach ($settings as $key => $s) {
            $default = var_export($s['default'] ?? '', true);
            $lines[] = "    '{$key}' => env('" . strtoupper(str_replace('-', '_', $slug)) . '_' . strtoupper($key) . "', {$default}),";
        }
        $body = empty($lines) ? '    //' : implode("\n", $lines);

        $content = "<?php\n\nreturn [\n{$body}\n];\n";
        $this->writeFile("{$path}/config/{$slug}.php", $content);
    }

    private function generateRoutes(string $path, string $ns, string $pascal, string $slug): void
    {
        $web = <<<PHP
<?php

use Illuminate\Support\Facades\Route;

// Routes publiques du plugin {$slug}
// Route::get('/{$slug}', function () {
//     return 'Hello from {$slug}!';
// });
PHP;

        $admin = <<<PHP
<?php

use Illuminate\Support\Facades\Route;

// Routes admin du plugin {$slug}
// Route::middleware(['web', 'auth'])->prefix(config('cms.admin.prefix', 'admin'))->group(function () {
//     Route::get('{$slug}', function () { return 'Admin {$slug}'; })->name('admin.{$slug}.index');
// });
PHP;

        $this->writeFile("{$path}/routes/web.php", $web . "\n");
        $this->writeFile("{$path}/routes/admin.php", $admin . "\n");
    }

    private function generateMigration(string $path, string $slug): void
    {
        $table = str_replace('-', '_', $slug);
        $className = 'Create' . str_replace(' ', '', ucwords(str_replace('-', ' ', $slug))) . 'Table';
        $date = date('Y_m_d_His');

        $content = <<<PHP
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('{$table}', function (Blueprint \$table) {
            \$table->id();
            \$table->string('name');
            \$table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('{$table}');
    }
};
PHP;

        $this->writeFile("{$path}/database/migrations/{$date}_create_{$table}_table.php", $content . "\n");
    }

    private function generateMiddleware(string $path, string $ns, string $pascal): void
    {
        $content = <<<PHP
<?php

declare(strict_types=1);

namespace {$ns}\\Http\\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class {$pascal}Middleware
{
    public function handle(Request \$request, Closure \$next): Response
    {
        // Your middleware logic here

        return \$next(\$request);
    }
}
PHP;

        $this->writeFile("{$path}/src/Http/Middleware/{$pascal}Middleware.php", $content . "\n");
    }

    private function generateBlocks(string $path, string $ns, string $slug, array $blocks): void
    {
        foreach ($blocks as $b) {
            $blockPascal = str_replace(' ', '', ucwords(str_replace('-', ' ', $b['slug'])));

            // DB seed data (JSON for reference)
            $schema = ['properties' => []];
            $defaults = [];
            foreach ($b['props'] as $propName => $prop) {
                $schema['properties'][$propName] = ['type' => $prop['type'], 'default' => $prop['default']];
                $defaults[$propName] = $prop['default'];
            }

            $blockData = [
                'slug' => $b['slug'],
                'name' => $b['name'],
                'category' => $b['category'],
                'icon' => $b['icon'],
                'schema' => $schema,
                'default_props' => $defaults,
                'is_core' => false,
                'source' => "plugin:{$slug}",
            ];

            $this->writeJson("{$path}/src/Blocks/{$b['slug']}.json", $blockData);

            // Generate TSX renderer stub
            $propsLines = [];
            foreach ($b['props'] as $propName => $prop) {
                $tsType = match ($prop['type']) {
                    'number' => 'number',
                    'boolean' => 'boolean',
                    default => 'string',
                };
                $propsLines[] = "    const {$propName} = block.props.{$propName} as {$tsType} ?? " . json_encode($prop['default']) . ";";
            }
            $propsCode = implode("\n", $propsLines);

            $rendererTsx = <<<TSX
import type { BlockRendererProps } from '../block-registry';

export default function {$blockPascal}Renderer({ block }: BlockRendererProps) {
{$propsCode}

    return (
        <div className="w-full">
            {/* TODO: Implement {$b['name']} renderer */}
            <p>{$b['name']}</p>
        </div>
    );
}
TSX;

            $settingsTsx = <<<TSX
import type { BlockSettingsProps } from '../block-registry';

export default function {$blockPascal}Settings({ block, onUpdate }: BlockSettingsProps) {
    return (
        <div className="space-y-4">
            {/* TODO: Implement {$b['name']} settings */}
        </div>
    );
}
TSX;

            $this->writeFile("{$path}/src/Blocks/{$b['slug']}-renderer.tsx", $rendererTsx . "\n");
            $this->writeFile("{$path}/src/Blocks/{$b['slug']}-settings.tsx", $settingsTsx . "\n");
        }

        // Generate a seeder class
        $seederClass = str_replace(' ', '', ucwords(str_replace('-', ' ', $slug))) . 'BlockSeeder';
        $insertLines = [];
        foreach ($blocks as $b) {
            $insertLines[] = "            Block::updateOrCreate(['slug' => '{$b['slug']}'], json_decode(file_get_contents(__DIR__ . '/../../src/Blocks/{$b['slug']}.json'), true));";
        }
        $insertCode = implode("\n", $insertLines);

        $seeder = <<<PHP
<?php

declare(strict_types=1);

namespace {$ns};

use App\\Models\\Block;

class {$seederClass}
{
    public static function seed(): void
    {
{$insertCode}
    }
}
PHP;

        $this->writeFile("{$path}/src/Blocks/{$seederClass}.php", $seeder . "\n");
    }

    private function castDefault(string $type, string $value): mixed
    {
        return match ($type) {
            'number' => is_numeric($value) ? (float) $value : 0,
            'boolean' => in_array(strtolower($value), ['true', '1', 'yes', 'oui'], true),
            default => $value,
        };
    }

    private function writeFile(string $path, string $content): void
    {
        file_put_contents($path, $content);
    }

    private function writeJson(string $path, array $data): void
    {
        file_put_contents($path, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . "\n");
    }
}
