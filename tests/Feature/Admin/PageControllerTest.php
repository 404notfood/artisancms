<?php

declare(strict_types=1);

namespace Tests\Feature\Admin;

use App\Models\Page;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PageControllerTest extends TestCase
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

    public function test_admin_can_view_pages_index(): void
    {
        Page::factory()->count(3)->create();

        $response = $this->actingAs($this->admin)->get(route('admin.pages.index'));

        $response->assertStatus(200);
    }

    public function test_admin_can_view_create_page_form(): void
    {
        $response = $this->actingAs($this->admin)->get(route('admin.pages.create'));

        $response->assertStatus(200);
    }

    public function test_admin_can_create_a_page(): void
    {
        $response = $this->actingAs($this->admin)->post(route('admin.pages.store'), [
            'title' => 'Test Page',
            'slug' => 'test-page',
            'status' => 'draft',
            'template' => 'default',
        ]);

        $response->assertRedirect(route('admin.pages.index'));

        $this->assertDatabaseHas('pages', [
            'title' => 'Test Page',
            'slug' => 'test-page',
            'status' => 'draft',
        ]);
    }

    public function test_admin_can_update_a_page(): void
    {
        $page = Page::factory()->create(['created_by' => $this->admin->id]);

        $response = $this->actingAs($this->admin)->put(route('admin.pages.update', $page), [
            'title' => 'Updated Title',
            'slug' => $page->slug,
            'status' => 'draft',
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('pages', [
            'id' => $page->id,
            'title' => 'Updated Title',
        ]);
    }

    public function test_admin_can_delete_a_page(): void
    {
        $page = Page::factory()->create(['created_by' => $this->admin->id]);

        $response = $this->actingAs($this->admin)->delete(route('admin.pages.destroy', $page));

        $response->assertRedirect(route('admin.pages.index'));

        $this->assertSoftDeleted('pages', ['id' => $page->id]);
    }

    public function test_unauthenticated_user_cannot_access_admin_pages(): void
    {
        $response = $this->get(route('admin.pages.index'));

        $response->assertRedirect(route('login'));
    }

    public function test_unauthenticated_user_cannot_create_page(): void
    {
        $response = $this->post(route('admin.pages.store'), [
            'title' => 'Test Page',
            'slug' => 'test-page',
        ]);

        $response->assertRedirect(route('login'));
    }

    public function test_unauthenticated_user_cannot_delete_page(): void
    {
        $page = Page::factory()->create();

        $response = $this->delete(route('admin.pages.destroy', $page));

        $response->assertRedirect(route('login'));
    }

    public function test_page_creation_requires_title(): void
    {
        $response = $this->actingAs($this->admin)->post(route('admin.pages.store'), [
            'slug' => 'test-page',
            'status' => 'draft',
        ]);

        $response->assertSessionHasErrors('title');
    }

    public function test_page_slug_must_be_unique(): void
    {
        Page::factory()->create(['slug' => 'existing-slug']);

        $response = $this->actingAs($this->admin)->post(route('admin.pages.store'), [
            'title' => 'Another Page',
            'slug' => 'existing-slug',
            'status' => 'draft',
        ]);

        $response->assertSessionHasErrors('slug');
    }

    public function test_admin_can_view_edit_page_form(): void
    {
        $page = Page::factory()->create(['created_by' => $this->admin->id]);

        $response = $this->actingAs($this->admin)->get(route('admin.pages.edit', $page));

        $response->assertStatus(200);
    }
}
