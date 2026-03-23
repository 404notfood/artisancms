<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Services\DatabaseConfigurator;
use App\Services\InstallerService;
use App\Services\RequirementsChecker;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class InstallController
{
    public function __construct(
        private RequirementsChecker $requirementsChecker,
        private DatabaseConfigurator $databaseConfigurator,
        private InstallerService $installer,
    ) {}

    /**
     * Step 1: Welcome + Language selection
     */
    public function showWelcome(): Response
    {
        return Inertia::render('Install/Welcome', [
            'languages' => [
                ['code' => 'fr', 'name' => 'Français', 'flag' => '🇫🇷'],
                ['code' => 'en', 'name' => 'English', 'flag' => '🇬🇧'],
                ['code' => 'es', 'name' => 'Español', 'flag' => '🇪🇸'],
                ['code' => 'de', 'name' => 'Deutsch', 'flag' => '🇩🇪'],
            ],
            'currentLocale' => session('install.locale', 'fr'),
        ]);
    }

    public function storeWelcome(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'locale' => ['required', 'string', 'in:fr,en,es,de'],
        ]);

        session(['install.locale' => $validated['locale']]);
        app()->setLocale($validated['locale']);

        return redirect()->route('install.license');
    }

    /**
     * Step 2: License agreement
     */
    public function showLicense(): Response
    {
        return Inertia::render('Install/License');
    }

    /**
     * Step 3: System requirements
     */
    public function showRequirements(): Response
    {
        $results = $this->requirementsChecker->check();

        return Inertia::render('Install/Requirements', [
            'requirements' => $results['requirements'],
            'allPassed' => $results['passed'],
        ]);
    }

    /**
     * Step 4: Database configuration
     */
    public function showDatabase(): Response
    {
        return Inertia::render('Install/Database', [
            'defaults' => [
                'db_host' => session('install.db_host', '127.0.0.1'),
                'db_port' => session('install.db_port', '3306'),
                'db_database' => session('install.db_database', 'artisan_cms'),
                'db_username' => session('install.db_username', 'root'),
                'db_password' => session('install.db_password', ''),
                'db_prefix' => session('install.db_prefix', ''),
            ],
        ]);
    }

    public function testDatabase(Request $request)
    {
        $validated = $request->validate([
            'db_host' => ['required', 'string'],
            'db_port' => ['required', 'numeric'],
            'db_database' => ['required', 'string'],
            'db_username' => ['required', 'string'],
            'db_password' => ['nullable', 'string'],
            'create_database' => ['boolean'],
        ]);

        $result = $this->databaseConfigurator->testConnection($validated);

        return response()->json($result);
    }

    public function storeDatabase(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'db_host' => ['required', 'string'],
            'db_port' => ['required', 'numeric'],
            'db_database' => ['required', 'string'],
            'db_username' => ['required', 'string'],
            'db_password' => ['nullable', 'string'],
            'db_prefix' => ['nullable', 'string'],
            'create_database' => ['boolean'],
        ]);

        $result = $this->databaseConfigurator->testConnection($validated);

        if (!$result['success']) {
            return back()->withErrors(['db_connection' => $result['message']]);
        }

        session([
            'install.db_host' => $validated['db_host'],
            'install.db_port' => $validated['db_port'],
            'install.db_database' => $validated['db_database'],
            'install.db_username' => $validated['db_username'],
            'install.db_password' => $validated['db_password'] ?? '',
            'install.db_prefix' => $validated['db_prefix'] ?? '',
        ]);

        // Persist config so far (DB step done, will be updated again after Configuration step)
        $this->persistInstallConfig();

        return redirect()->route('install.configuration');
    }

    /**
     * Step 5: Site + Admin configuration (combined)
     */
    public function showConfiguration(): Response
    {
        return Inertia::render('Install/Configuration', [
            'defaults' => [
                'site_name' => session('install.site_name', 'Mon site ArtisanCMS'),
                'site_description' => session('install.site_description', ''),
                'site_url' => session('install.site_url', request()->getSchemeAndHttpHost()),
                'timezone' => session('install.timezone', 'Europe/Paris'),
                'admin_name' => session('install.admin_name', ''),
                'admin_email' => session('install.admin_email', ''),
            ],
            'timezones' => \DateTimeZone::listIdentifiers(),
        ]);
    }

    public function storeConfiguration(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'site_name' => ['required', 'string', 'max:255'],
            'site_description' => ['nullable', 'string', 'max:500'],
            'site_url' => ['required', 'url'],
            'timezone' => ['required', 'string', 'timezone'],
            'admin_name' => ['required', 'string', 'min:2', 'max:255'],
            'admin_email' => ['required', 'email', 'max:255'],
            'admin_password' => ['required', 'string', 'min:8', 'confirmed', Password::defaults()],
        ]);

        session([
            'install.site_name' => $validated['site_name'],
            'install.site_description' => $validated['site_description'] ?? '',
            'install.site_url' => $validated['site_url'],
            'install.timezone' => $validated['timezone'],
            'install.admin_name' => $validated['admin_name'],
            'install.admin_email' => $validated['admin_email'],
            'install.admin_password' => $validated['admin_password'],
        ]);

        // Persist all install config to a temp file so the execute step
        // doesn't depend on session survival across AJAX requests.
        $this->persistInstallConfig();

        return redirect()->route('install.execute');
    }

    /**
     * Step 6: Execute installation
     */
    public function showExecute(): Response
    {
        return Inertia::render('Install/Execute', [
            'steps' => InstallerService::STEPS,
            'siteName' => session('install.site_name', 'ArtisanCMS'),
            'siteUrl' => session('install.site_url', request()->getSchemeAndHttpHost()),
            'adminEmail' => session('install.admin_email', ''),
            'version' => config('cms.version', '1.0.0'),
        ]);
    }

    public function execute(Request $request)
    {
        $step = $request->input('step');
        $validSteps = array_keys(InstallerService::STEPS);

        if (!$step || !in_array($step, $validSteps, true)) {
            return response()->json([
                'success' => false,
                'message' => "Étape invalide : {$step}",
            ], 422);
        }

        // Load config from persisted file first, then session as fallback
        $persisted = $this->loadInstallConfig();

        $config = [
            'locale' => $persisted['locale'] ?? session('install.locale', 'fr'),
            'db_host' => $persisted['db_host'] ?? session('install.db_host', '127.0.0.1'),
            'db_port' => $persisted['db_port'] ?? session('install.db_port', '3306'),
            'db_database' => $persisted['db_database'] ?? session('install.db_database', 'artisan_cms'),
            'db_username' => $persisted['db_username'] ?? session('install.db_username', 'root'),
            'db_password' => $persisted['db_password'] ?? session('install.db_password', ''),
            'db_prefix' => $persisted['db_prefix'] ?? session('install.db_prefix', ''),
            'site_name' => $persisted['site_name'] ?? session('install.site_name', 'ArtisanCMS'),
            'site_description' => $persisted['site_description'] ?? session('install.site_description', ''),
            'site_url' => $persisted['site_url'] ?? session('install.site_url', request()->getSchemeAndHttpHost()),
            'timezone' => $persisted['timezone'] ?? session('install.timezone', 'Europe/Paris'),
            'admin_name' => $persisted['admin_name'] ?? session('install.admin_name', 'Admin'),
            'admin_email' => $persisted['admin_email'] ?? session('install.admin_email', 'admin@artisancms.dev'),
            'admin_password' => $persisted['admin_password'] ?? session('install.admin_password', 'password'),
        ];

        $result = $this->installer->runStep($step, $config);

        if ($result['success'] && $step === 'finalize') {
            $request->session()->forget(
                collect(session()->all())
                    ->keys()
                    ->filter(fn ($key) => str_starts_with($key, 'install.'))
                    ->toArray()
            );
            // Clean up persisted config file
            $this->cleanupInstallConfig();
        }

        return response()->json($result);
    }

    /**
     * Persist all install config to an encrypted temp file.
     * This ensures execute() has access to all values even if
     * the session is lost between sequential AJAX requests.
     */
    private function persistInstallConfig(): void
    {
        $config = [
            'locale' => session('install.locale', 'fr'),
            'db_host' => session('install.db_host', '127.0.0.1'),
            'db_port' => session('install.db_port', '3306'),
            'db_database' => session('install.db_database', 'artisan_cms'),
            'db_username' => session('install.db_username', 'root'),
            'db_password' => session('install.db_password', ''),
            'db_prefix' => session('install.db_prefix', ''),
            'site_name' => session('install.site_name', 'ArtisanCMS'),
            'site_description' => session('install.site_description', ''),
            'site_url' => session('install.site_url', request()->getSchemeAndHttpHost()),
            'timezone' => session('install.timezone', 'Europe/Paris'),
            'admin_name' => session('install.admin_name', 'Admin'),
            'admin_email' => session('install.admin_email', ''),
            'admin_password' => session('install.admin_password', ''),
        ];

        $path = storage_path('.install_config');
        $encrypted = encrypt(json_encode($config));
        file_put_contents($path, $encrypted);
    }

    /**
     * Load persisted install config from the encrypted temp file.
     */
    private function loadInstallConfig(): array
    {
        $path = storage_path('.install_config');

        if (!file_exists($path)) {
            return [];
        }

        try {
            $encrypted = file_get_contents($path);
            return json_decode(decrypt($encrypted), true) ?: [];
        } catch (\Throwable) {
            return [];
        }
    }

    /**
     * Remove the persisted install config file.
     */
    private function cleanupInstallConfig(): void
    {
        $path = storage_path('.install_config');
        if (file_exists($path)) {
            @unlink($path);
        }
    }
}
