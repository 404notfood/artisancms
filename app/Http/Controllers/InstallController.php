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

    public function showStack(): Response
    {
        return Inertia::render('Install/Stack', [
            'stacks' => [
                [
                    'id' => 'laravel',
                    'name' => 'Laravel + React',
                    'description' => 'Stack complète et stable pour la production.',
                    'features' => ['Laravel 12 (PHP 8.2+)', 'React 19 + Inertia 2', 'shadcn/ui + Tailwind CSS v4', 'MySQL / MariaDB', 'Auth intégrée'],
                    'available' => true,
                    'recommended' => true,
                    'badge' => 'Recommandé',
                ],
                [
                    'id' => 'nextjs',
                    'name' => 'Next.js',
                    'description' => 'Stack moderne basée sur Next.js App Router.',
                    'features' => ['Next.js App Router', 'React 19', 'better-auth', 'Prisma + MySQL', 'shadcn/ui + Tailwind CSS v4'],
                    'available' => false,
                    'recommended' => false,
                    'badge' => 'Bientôt disponible',
                ],
            ],
            'currentStack' => session('install.stack', 'laravel'),
        ]);
    }

    public function storeStack(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'stack' => ['required', 'string', 'in:laravel,nextjs'],
        ]);

        if ($validated['stack'] === 'nextjs') {
            return back()->withErrors(['stack' => "Le stack Next.js n'est pas encore disponible."]);
        }

        session(['install.stack' => $validated['stack']]);

        return redirect()->route('install.language');
    }

    public function showLanguage(): Response
    {
        return Inertia::render('Install/Language', [
            'languages' => [
                ['code' => 'fr', 'name' => 'Français', 'flag' => '🇫🇷'],
                ['code' => 'en', 'name' => 'English', 'flag' => '🇬🇧'],
            ],
            'currentLocale' => session('install.locale', 'fr'),
        ]);
    }

    public function storeLanguage(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'locale' => ['required', 'string', 'in:fr,en'],
        ]);

        session(['install.locale' => $validated['locale']]);
        app()->setLocale($validated['locale']);

        return redirect()->route('install.requirements');
    }

    public function showRequirements(): Response
    {
        $stack = session('install.stack', 'laravel');
        $results = $this->requirementsChecker->check($stack);

        return Inertia::render('Install/Requirements', [
            'requirements' => $results['requirements'],
            'allPassed' => $results['passed'],
            'stack' => $stack,
        ]);
    }

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

        return redirect()->route('install.site');
    }

    public function showSite(): Response
    {
        return Inertia::render('Install/Site', [
            'defaults' => [
                'site_name' => session('install.site_name', 'Mon site ArtisanCMS'),
                'site_description' => session('install.site_description', ''),
                'site_url' => session('install.site_url', request()->getSchemeAndHttpHost()),
                'timezone' => session('install.timezone', 'Europe/Paris'),
            ],
            'timezones' => \DateTimeZone::listIdentifiers(),
        ]);
    }

    public function storeSite(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'site_name' => ['required', 'string', 'max:255'],
            'site_description' => ['nullable', 'string', 'max:500'],
            'site_url' => ['required', 'url'],
            'timezone' => ['required', 'string', 'timezone'],
        ]);

        session([
            'install.site_name' => $validated['site_name'],
            'install.site_description' => $validated['site_description'] ?? '',
            'install.site_url' => $validated['site_url'],
            'install.timezone' => $validated['timezone'],
        ]);

        return redirect()->route('install.admin');
    }

    public function showAdmin(): Response
    {
        return Inertia::render('Install/Admin', [
            'defaults' => [
                'admin_name' => session('install.admin_name', ''),
                'admin_email' => session('install.admin_email', ''),
            ],
        ]);
    }

    public function storeAdmin(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'admin_name' => ['required', 'string', 'min:2', 'max:255'],
            'admin_email' => ['required', 'email', 'max:255'],
            'admin_password' => ['required', 'string', 'min:8', 'confirmed', Password::defaults()],
        ]);

        session([
            'install.admin_name' => $validated['admin_name'],
            'install.admin_email' => $validated['admin_email'],
            'install.admin_password' => $validated['admin_password'],
        ]);

        return redirect()->route('install.execute');
    }

    public function showExecute(): Response
    {
        return Inertia::render('Install/Execute', [
            'steps' => InstallerService::STEPS,
        ]);
    }

    public function execute(Request $request)
    {
        $config = [
            'stack' => session('install.stack', 'laravel'),
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
            'admin_email' => session('install.admin_email', 'admin@artisancms.dev'),
            'admin_password' => session('install.admin_password', 'password'),
        ];

        $result = $this->installer->install($config);

        if ($result['success']) {
            $request->session()->forget(
                collect(session()->all())
                    ->keys()
                    ->filter(fn ($key) => str_starts_with($key, 'install.'))
                    ->toArray()
            );
        }

        return response()->json($result);
    }

    public function complete(): Response
    {
        return Inertia::render('Install/Complete', [
            'siteName' => session('install.site_name', 'ArtisanCMS'),
            'siteUrl' => session('install.site_url', request()->getSchemeAndHttpHost()),
            'adminEmail' => session('install.admin_email', ''),
            'version' => config('cms.version', '1.0.0'),
        ]);
    }
}
