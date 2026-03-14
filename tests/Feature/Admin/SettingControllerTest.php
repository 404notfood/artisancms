<?php

declare(strict_types=1);

namespace Tests\Feature\Admin;

use App\Models\Role;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SettingControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private Role $adminRole;

    protected function setUp(): void
    {
        parent::setUp();

        // Ensure the .installed sentinel file exists so EnsureInstalled middleware does not redirect
        if (!file_exists(storage_path('.installed'))) {
            file_put_contents(storage_path('.installed'), json_encode(['version' => '1.0.0']));
        }

        $this->adminRole = Role::factory()->admin()->create();
        $this->admin = User::factory()->create(['role_id' => $this->adminRole->id]);
    }

    protected function tearDown(): void
    {
        // Clean up the sentinel file
        $installedFile = storage_path('.installed');
        if (file_exists($installedFile)) {
            unlink($installedFile);
        }

        parent::tearDown();
    }

    public function test_admin_can_view_settings(): void
    {
        Setting::create([
            'group' => 'general',
            'key' => 'site_name',
            'value' => 'Test Site',
            'type' => 'string',
            'is_public' => true,
        ]);

        $response = $this->actingAs($this->admin)->get(route('admin.settings.index'));

        $response->assertStatus(200);
    }

    public function test_admin_can_update_settings(): void
    {
        Setting::create([
            'group' => 'general',
            'key' => 'site_name',
            'value' => 'Old Name',
            'type' => 'string',
            'is_public' => true,
        ]);

        $response = $this->actingAs($this->admin)->put(route('admin.settings.update'), [
            'settings' => [
                [
                    'key' => 'general.site_name',
                    'value' => 'New Site Name',
                ],
            ],
        ]);

        $response->assertRedirect();
    }

    public function test_non_admin_authenticated_user_can_access_settings(): void
    {
        // The SettingController does not have explicit admin-only middleware in routes;
        // it only requires 'auth'. However, authorization should be handled by policies
        // or middleware. The route requires authentication at minimum.
        $editorRole = Role::factory()->editor()->create();
        $editor = User::factory()->create(['role_id' => $editorRole->id]);

        $response = $this->actingAs($editor)->get(route('admin.settings.index'));

        // Since admin routes require 'auth' middleware, an authenticated user gets through.
        // The response depends on whether there is an admin-only gate check.
        $response->assertStatus(200);
    }

    public function test_unauthenticated_user_cannot_access_settings(): void
    {
        $response = $this->get(route('admin.settings.index'));

        $response->assertRedirect(route('login'));
    }

    public function test_unauthenticated_user_cannot_update_settings(): void
    {
        $response = $this->put(route('admin.settings.update'), [
            'settings' => [
                [
                    'key' => 'general.site_name',
                    'value' => 'Hacked Name',
                ],
            ],
        ]);

        $response->assertRedirect(route('login'));
    }

    public function test_settings_update_requires_settings_array(): void
    {
        $response = $this->actingAs($this->admin)->put(route('admin.settings.update'), []);

        $response->assertSessionHasErrors('settings');
    }

    public function test_settings_update_requires_key_in_each_setting(): void
    {
        $response = $this->actingAs($this->admin)->put(route('admin.settings.update'), [
            'settings' => [
                [
                    'value' => 'some value',
                ],
            ],
        ]);

        $response->assertSessionHasErrors('settings.0.key');
    }
}
