<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;

class CreatePluginCommand extends Command
{
    protected $signature = 'cms:plugin:create {slug : The plugin slug (kebab-case)}';

    protected $description = 'Créer un nouveau plugin ArtisanCMS';

    public function handle(): int
    {
        $slug = $this->argument('slug');

        // Validate slug is kebab-case
        if (!preg_match('/^[a-z0-9]+(-[a-z0-9]+)*$/', $slug)) {
            $this->components->error("Le slug « {$slug} » est invalide. Utilisez le format kebab-case (ex: mon-plugin).");
            return self::FAILURE;
        }

        $pluginPath = base_path("content/plugins/{$slug}");

        // Check directory doesn't already exist
        if (is_dir($pluginPath)) {
            $this->components->error("Le plugin « {$slug} » existe déjà dans {$pluginPath}.");
            return self::FAILURE;
        }

        // Derive names from slug
        $name = ucwords(str_replace('-', ' ', $slug));
        $pascalName = str_replace(' ', '', $name);
        $namespace = $pascalName;

        // Create directories
        $directories = [
            "{$pluginPath}/src",
            "{$pluginPath}/routes",
            "{$pluginPath}/database/migrations",
        ];

        foreach ($directories as $dir) {
            if (!mkdir($dir, 0755, true)) {
                $this->components->error("Impossible de créer le répertoire : {$dir}");
                return self::FAILURE;
            }
        }

        // Create artisan-plugin.json manifest
        $manifest = [
            'name' => $name,
            'slug' => $slug,
            'version' => '1.0.0',
            'description' => "Plugin {$name} pour ArtisanCMS",
            'author' => [
                'name' => 'ArtisanCMS',
            ],
            'license' => 'MIT',
            'requires' => [
                'cms' => '>=1.0.0',
                'php' => '>=8.3',
            ],
            'providers' => [
                "{$namespace}\\{$pascalName}ServiceProvider",
            ],
            'routes' => false,
            'settings' => (object) [],
        ];

        file_put_contents(
            "{$pluginPath}/artisan-plugin.json",
            json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . "\n"
        );

        // Create ServiceProvider
        $serviceProviderContent = <<<PHP
<?php

declare(strict_types=1);

namespace {$namespace};

use Illuminate\Support\ServiceProvider;

class {$pascalName}ServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        //
    }
}
PHP;

        file_put_contents("{$pluginPath}/src/{$pascalName}ServiceProvider.php", $serviceProviderContent . "\n");

        $this->components->info("Plugin « {$name} » créé avec succès !");
        $this->components->twoColumnDetail('Chemin', $pluginPath);
        $this->components->twoColumnDetail('Service Provider', "src/{$pascalName}ServiceProvider.php");
        $this->components->twoColumnDetail('Manifeste', 'artisan-plugin.json');

        return self::SUCCESS;
    }
}
