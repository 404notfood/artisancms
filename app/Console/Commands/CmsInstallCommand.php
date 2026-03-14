<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\DatabaseConfigurator;
use App\Services\InstallerService;
use App\Services\RequirementsChecker;
use Illuminate\Console\Command;
use Illuminate\Validation\Rules\Password;

class CmsInstallCommand extends Command
{
    protected $signature = 'cms:install
                            {--quick : Installation rapide avec valeurs par défaut}
                            {--force : Réinstaller même si déjà installé}';

    protected $description = 'Installer ArtisanCMS';

    public function __construct(
        private RequirementsChecker $requirementsChecker,
        private DatabaseConfigurator $databaseConfigurator,
        private InstallerService $installer,
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $this->components->info('🎨 Installation d\'ArtisanCMS');
        $this->newLine();

        // Check if already installed
        if (file_exists(storage_path('.installed')) && !$this->option('force')) {
            $this->components->error('ArtisanCMS est déjà installé.');
            $this->components->info('Utilisez --force pour réinstaller.');
            return self::FAILURE;
        }

        if ($this->option('force') && file_exists(storage_path('.installed'))) {
            unlink(storage_path('.installed'));
            $this->components->warn('Mode réinstallation activé.');
        }

        // Check requirements
        $this->components->info('Vérification des prérequis...');
        $results = $this->requirementsChecker->check('laravel');

        foreach ($results['requirements'] as $req) {
            if ($req['passed']) {
                $this->components->twoColumnDetail($req['label'], '<fg=green>✓ ' . $req['current'] . '</>');
            } elseif ($req['required']) {
                $this->components->twoColumnDetail($req['label'], '<fg=red>✗ ' . $req['current'] . '</>');
            } else {
                $this->components->twoColumnDetail($req['label'], '<fg=yellow>⚠ ' . $req['current'] . '</>');
            }
        }

        if (!$results['passed']) {
            $this->components->error('Certains prérequis obligatoires ne sont pas satisfaits.');
            return self::FAILURE;
        }

        $this->newLine();

        if ($this->option('quick')) {
            $config = $this->getQuickConfig();
        } else {
            $config = $this->getInteractiveConfig();
        }

        if ($config === null) {
            return self::FAILURE;
        }

        // Execute installation
        $this->newLine();
        $this->components->info('Installation en cours...');
        $this->newLine();

        $result = $this->installer
            ->onProgress(function (string $step, string $status, string $label) {
                if ($status === 'completed') {
                    $this->components->twoColumnDetail($label, '<fg=green>✓</>');
                } elseif ($status === 'running') {
                    // Progress shown via step completion
                }
            })
            ->install($config);

        $this->newLine();

        if ($result['success']) {
            $this->components->info('🎉 ArtisanCMS a été installé avec succès !');
            $this->newLine();
            $this->components->twoColumnDetail('Site', $config['site_name']);
            $this->components->twoColumnDetail('URL', $config['site_url']);
            $this->components->twoColumnDetail('Admin', $config['admin_email']);
            $this->components->twoColumnDetail('Base de données', $config['db_database']);
            $this->newLine();
            $this->components->warn('Notez bien votre mot de passe admin !');

            return self::SUCCESS;
        }

        $this->components->error('L\'installation a échoué.');
        foreach ($result['errors'] as $error) {
            $this->components->error($error);
        }

        return self::FAILURE;
    }

    private function getQuickConfig(): array
    {
        return [
            'stack' => 'laravel',
            'locale' => 'fr',
            'db_host' => env('DB_HOST', '127.0.0.1'),
            'db_port' => env('DB_PORT', '3306'),
            'db_database' => env('DB_DATABASE', 'artisan_cms'),
            'db_username' => env('DB_USERNAME', 'root'),
            'db_password' => env('DB_PASSWORD', ''),
            'db_prefix' => '',
            'create_database' => true,
            'site_name' => 'ArtisanCMS',
            'site_description' => 'Un CMS moderne et performant',
            'site_url' => env('APP_URL', 'http://localhost'),
            'timezone' => 'Europe/Paris',
            'admin_name' => 'Admin',
            'admin_email' => 'admin@artisancms.dev',
            'admin_password' => 'password',
        ];
    }

    private function getInteractiveConfig(): ?array
    {
        // Database
        $this->components->info('Configuration de la base de données');

        $dbHost = $this->ask('Serveur MySQL', env('DB_HOST', '127.0.0.1'));
        $dbPort = $this->ask('Port', env('DB_PORT', '3306'));
        $dbDatabase = $this->ask('Nom de la base de données', 'artisan_cms');
        $dbUsername = $this->ask('Utilisateur', env('DB_USERNAME', 'root'));
        $dbPassword = $this->secret('Mot de passe (laisser vide si aucun)') ?? '';

        // Test connection
        $this->components->info('Test de la connexion...');
        $testResult = $this->databaseConfigurator->testConnection([
            'db_host' => $dbHost,
            'db_port' => $dbPort,
            'db_database' => $dbDatabase,
            'db_username' => $dbUsername,
            'db_password' => $dbPassword,
            'create_database' => true,
        ]);

        if (!$testResult['success']) {
            $this->components->error($testResult['message']);
            return null;
        }

        $this->components->info($testResult['message']);
        $this->newLine();

        // Site info
        $this->components->info('Informations du site');
        $siteName = $this->ask('Nom du site', 'Mon site ArtisanCMS');
        $siteDescription = $this->ask('Description', 'Un site construit avec ArtisanCMS');
        $siteUrl = $this->ask('URL du site', env('APP_URL', 'http://localhost'));
        $timezone = $this->ask('Fuseau horaire', 'Europe/Paris');
        $locale = $this->choice('Langue', ['fr', 'en'], 0);

        $this->newLine();

        // Admin account
        $this->components->info('Compte administrateur');
        $adminName = $this->ask('Nom complet', 'Admin');
        $adminEmail = $this->ask('Adresse e-mail', 'admin@artisancms.dev');
        $adminPassword = $this->secret('Mot de passe (min. 8 caractères)');

        if (strlen($adminPassword) < 8) {
            $this->components->error('Le mot de passe doit contenir au moins 8 caractères.');
            return null;
        }

        return [
            'stack' => 'laravel',
            'locale' => $locale,
            'db_host' => $dbHost,
            'db_port' => $dbPort,
            'db_database' => $dbDatabase,
            'db_username' => $dbUsername,
            'db_password' => $dbPassword,
            'db_prefix' => '',
            'create_database' => true,
            'site_name' => $siteName,
            'site_description' => $siteDescription,
            'site_url' => $siteUrl,
            'timezone' => $timezone,
            'admin_name' => $adminName,
            'admin_email' => $adminEmail,
            'admin_password' => $adminPassword,
        ];
    }
}
