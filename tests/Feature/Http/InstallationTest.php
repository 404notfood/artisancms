<?php

declare(strict_types=1);

namespace Tests\Feature\Http;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InstallationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Override the base TestCase setUp to NOT create the .installed sentinel,
     * so we can test the uninstalled state by default.
     */
    protected function setUp(): void
    {
        parent::setUp();

        // Remove the sentinel file created by parent setUp
        $this->removeInstalledFile();
    }

    protected function tearDown(): void
    {
        $this->removeInstalledFile();
        parent::tearDown();
    }

    private function removeInstalledFile(): void
    {
        $path = storage_path('.installed');
        if (file_exists($path)) {
            unlink($path);
        }
    }

    private function createInstalledFile(): void
    {
        file_put_contents(storage_path('.installed'), json_encode([
            'version' => '1.0.0',
            'installed_at' => now()->toIso8601String(),
        ]));
    }

    // ------------------------------------------------------------------
    // REDIRECTS WHEN NOT INSTALLED
    // ------------------------------------------------------------------

    public function test_redirects_to_install_when_not_installed(): void
    {
        $response = $this->get('/');

        $response->assertRedirect('/install');
    }

    public function test_admin_redirects_to_install_when_not_installed(): void
    {
        $response = $this->get('/admin');

        $response->assertRedirect('/install');
    }

    // ------------------------------------------------------------------
    // INSTALL BLOCKED WHEN ALREADY INSTALLED
    // ------------------------------------------------------------------

    public function test_blocks_install_when_already_installed(): void
    {
        $this->createInstalledFile();

        $response = $this->get('/install');

        $response->assertStatus(404);
    }

    public function test_blocks_install_subroutes_when_already_installed(): void
    {
        $this->createInstalledFile();

        $this->get('/install/license')->assertStatus(404);
        $this->get('/install/requirements')->assertStatus(404);
        $this->get('/install/database')->assertStatus(404);
        $this->get('/install/configuration')->assertStatus(404);
        $this->get('/install/execute')->assertStatus(404);
    }

    // ------------------------------------------------------------------
    // INSTALL PAGES LOAD
    // ------------------------------------------------------------------

    public function test_install_page_loads(): void
    {
        $response = $this->get('/install');

        $response->assertStatus(200);
    }

    public function test_install_license_page_loads(): void
    {
        $response = $this->get('/install/license');

        $response->assertStatus(200);
    }

    public function test_install_requirements_page_loads(): void
    {
        $response = $this->get('/install/requirements');

        $response->assertStatus(200);
    }

    // ------------------------------------------------------------------
    // WELCOME FORM (locale selection)
    // ------------------------------------------------------------------

    public function test_welcome_store_sets_locale(): void
    {
        $response = $this->post('/install/welcome', [
            'locale' => 'fr',
        ]);

        $response->assertRedirect(route('install.license'));
        $response->assertSessionHas('install.locale', 'fr');
    }

    public function test_welcome_store_rejects_invalid_locale(): void
    {
        $response = $this->post('/install/welcome', [
            'locale' => 'zz',
        ]);

        $response->assertSessionHasErrors('locale');
    }

    // ------------------------------------------------------------------
    // NORMAL ROUTES WORK WHEN INSTALLED
    // ------------------------------------------------------------------

    public function test_home_accessible_when_installed(): void
    {
        $this->createInstalledFile();

        $response = $this->get('/');

        // Should not redirect to /install (any status besides redirect to /install is OK)
        $this->assertNotEquals(
            '/install',
            $response->headers->get('Location')
        );
    }
}
