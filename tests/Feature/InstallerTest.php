<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Role;
use App\Models\Setting;
use App\Models\User;
use App\Services\InstallerService;
use App\Services\RequirementsChecker;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InstallerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Ensure the .installed file does NOT exist for install route tests
        $installedFile = storage_path('.installed');
        if (file_exists($installedFile)) {
            unlink($installedFile);
        }
    }

    protected function tearDown(): void
    {
        // Always clean up the sentinel file
        $installedFile = storage_path('.installed');
        if (file_exists($installedFile)) {
            unlink($installedFile);
        }

        parent::tearDown();
    }

    public function test_install_routes_accessible_when_not_installed(): void
    {
        $response = $this->get('/install');

        $response->assertStatus(200);
    }

    public function test_install_license_route_accessible_when_not_installed(): void
    {
        $response = $this->get('/install/license');

        $response->assertStatus(200);
    }

    public function test_install_requirements_route_accessible_when_not_installed(): void
    {
        $response = $this->get('/install/requirements');

        $response->assertStatus(200);
    }

    public function test_install_routes_blocked_when_already_installed(): void
    {
        file_put_contents(storage_path('.installed'), json_encode([
            'version' => '1.0.0',
            'installed_at' => now()->toIso8601String(),
        ]));

        $response = $this->get('/install');

        $response->assertStatus(404);
    }

    public function test_install_license_route_blocked_when_already_installed(): void
    {
        file_put_contents(storage_path('.installed'), json_encode([
            'version' => '1.0.0',
            'installed_at' => now()->toIso8601String(),
        ]));

        $response = $this->get('/install/license');

        $response->assertStatus(404);
    }

    public function test_install_requirements_route_blocked_when_already_installed(): void
    {
        file_put_contents(storage_path('.installed'), json_encode([
            'version' => '1.0.0',
            'installed_at' => now()->toIso8601String(),
        ]));

        $response = $this->get('/install/requirements');

        $response->assertStatus(404);
    }

    public function test_requirements_checker_returns_expected_structure(): void
    {
        $checker = new RequirementsChecker();
        $results = $checker->check();

        $this->assertArrayHasKey('passed', $results);
        $this->assertArrayHasKey('requirements', $results);
        $this->assertIsBool($results['passed']);
        $this->assertIsArray($results['requirements']);

        // Verify known requirement keys exist
        $this->assertArrayHasKey('php_version', $results['requirements']);
        $this->assertArrayHasKey('ext_pdo', $results['requirements']);
        $this->assertArrayHasKey('ext_mbstring', $results['requirements']);
        $this->assertArrayHasKey('ext_json', $results['requirements']);

        // Each requirement should have the expected structure
        $phpReq = $results['requirements']['php_version'];
        $this->assertArrayHasKey('label', $phpReq);
        $this->assertArrayHasKey('required', $phpReq);
        $this->assertArrayHasKey('passed', $phpReq);
        $this->assertArrayHasKey('current', $phpReq);
        $this->assertArrayHasKey('message', $phpReq);
    }

    public function test_requirements_checker_php_version_passes(): void
    {
        $checker = new RequirementsChecker();
        $results = $checker->check();

        // Since we are running tests with PHP 8.2+, this must pass
        $this->assertTrue($results['requirements']['php_version']['passed']);
    }

    public function test_installer_service_creates_roles(): void
    {
        $installer = app(InstallerService::class);

        // Use reflection to call the private seedRoles method
        $reflection = new \ReflectionClass($installer);
        $method = $reflection->getMethod('seedRoles');
        $method->setAccessible(true);
        $method->invoke($installer);

        $this->assertDatabaseHas('roles', ['slug' => 'admin', 'is_system' => true]);
        $this->assertDatabaseHas('roles', ['slug' => 'editor', 'is_system' => true]);
        $this->assertDatabaseHas('roles', ['slug' => 'author', 'is_system' => true]);
        $this->assertDatabaseHas('roles', ['slug' => 'subscriber', 'is_system' => true]);

        // Verify admin role has wildcard permission
        $adminRole = Role::where('slug', 'admin')->first();
        $this->assertNotNull($adminRole);
        $this->assertContains('*', $adminRole->permissions);
    }

    public function test_installer_service_creates_admin_user(): void
    {
        $installer = app(InstallerService::class);

        // First create roles (admin user depends on admin role)
        $reflection = new \ReflectionClass($installer);

        $seedRoles = $reflection->getMethod('seedRoles');
        $seedRoles->setAccessible(true);
        $seedRoles->invoke($installer);

        $createAdmin = $reflection->getMethod('createAdmin');
        $createAdmin->setAccessible(true);
        $createAdmin->invoke($installer, [
            'admin_name' => 'Admin User',
            'admin_email' => 'admin@example.com',
            'admin_password' => 'secure-password-123',
        ]);

        $this->assertDatabaseHas('users', [
            'name' => 'Admin User',
            'email' => 'admin@example.com',
        ]);

        $admin = User::where('email', 'admin@example.com')->first();
        $this->assertNotNull($admin);
        $this->assertTrue($admin->isAdmin());
        $this->assertNotNull($admin->email_verified_at);
    }

    public function test_installer_service_seeds_settings(): void
    {
        $installer = app(InstallerService::class);

        $reflection = new \ReflectionClass($installer);
        $method = $reflection->getMethod('seedSettings');
        $method->setAccessible(true);
        $method->invoke($installer, [
            'site_name' => 'My Test Site',
            'site_description' => 'A test site',
            'site_url' => 'http://localhost',
            'locale' => 'en',
            'timezone' => 'UTC',
            'admin_email' => 'admin@test.com',
        ]);

        $this->assertDatabaseHas('settings', [
            'group' => 'general',
            'key' => 'site_name',
        ]);

        $this->assertDatabaseHas('settings', [
            'group' => 'general',
            'key' => 'locale',
        ]);

        $this->assertDatabaseHas('settings', [
            'group' => 'seo',
            'key' => 'meta_title_suffix',
        ]);

        $this->assertDatabaseHas('settings', [
            'group' => 'mail',
            'key' => 'from_email',
        ]);
    }

    public function test_installer_service_steps_constant_has_all_steps(): void
    {
        $expectedSteps = ['env', 'migrations', 'roles', 'admin', 'settings', 'theme', 'blocks', 'homepage', 'site', 'directories', 'finalize'];

        foreach ($expectedSteps as $step) {
            $this->assertArrayHasKey($step, InstallerService::STEPS);
            $this->assertArrayHasKey('label', InstallerService::STEPS[$step]);
            $this->assertArrayHasKey('weight', InstallerService::STEPS[$step]);
        }
    }

    public function test_non_install_routes_redirect_to_install_when_not_installed(): void
    {
        // When the .installed file does not exist, non-install routes should redirect to /install
        $response = $this->get('/');

        $response->assertRedirect('/install');
    }

    public function test_welcome_store_sets_locale_in_session(): void
    {
        $response = $this->post('/install/welcome', [
            'locale' => 'en',
        ]);

        $response->assertRedirect(route('install.license'));
        $response->assertSessionHas('install.locale', 'en');
    }

    public function test_welcome_store_accepts_valid_locales(): void
    {
        foreach (['fr', 'en', 'es', 'de'] as $locale) {
            $response = $this->post('/install/welcome', [
                'locale' => $locale,
            ]);

            $response->assertRedirect(route('install.license'));
        }
    }

    public function test_welcome_store_rejects_invalid_locale(): void
    {
        $response = $this->post('/install/welcome', [
            'locale' => 'xx',
        ]);

        $response->assertSessionHasErrors('locale');
    }

    public function test_configuration_store_validates_site_and_admin(): void
    {
        $response = $this->post('/install/configuration', [
            'site_name' => 'My Test Site',
            'site_description' => 'A test description',
            'site_url' => 'http://localhost',
            'timezone' => 'Europe/Paris',
            'admin_name' => 'Admin',
            'admin_email' => 'admin@test.com',
            'admin_password' => 'Password123',
            'admin_password_confirmation' => 'Password123',
        ]);

        $response->assertRedirect(route('install.execute'));
        $response->assertSessionHas('install.site_name', 'My Test Site');
        $response->assertSessionHas('install.admin_email', 'admin@test.com');
    }

    public function test_configuration_store_rejects_short_password(): void
    {
        $response = $this->post('/install/configuration', [
            'site_name' => 'My Site',
            'site_url' => 'http://localhost',
            'timezone' => 'Europe/Paris',
            'admin_name' => 'Admin',
            'admin_email' => 'admin@test.com',
            'admin_password' => 'short',
            'admin_password_confirmation' => 'short',
        ]);

        $response->assertSessionHasErrors('admin_password');
    }

    public function test_configuration_store_rejects_mismatched_passwords(): void
    {
        $response = $this->post('/install/configuration', [
            'site_name' => 'My Site',
            'site_url' => 'http://localhost',
            'timezone' => 'Europe/Paris',
            'admin_name' => 'Admin',
            'admin_email' => 'admin@test.com',
            'admin_password' => 'Password123',
            'admin_password_confirmation' => 'DifferentPassword123',
        ]);

        $response->assertSessionHasErrors('admin_password');
    }
}
