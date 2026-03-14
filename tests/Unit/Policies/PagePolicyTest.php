<?php

declare(strict_types=1);

namespace Tests\Unit\Policies;

use App\Models\Page;
use App\Models\Role;
use App\Models\User;
use App\Policies\PagePolicy;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PagePolicyTest extends TestCase
{
    use RefreshDatabase;

    private PagePolicy $policy;

    protected function setUp(): void
    {
        parent::setUp();
        $this->policy = new PagePolicy();
    }

    public function test_view_any_allowed_with_pages_read_permission(): void
    {
        $role = Role::factory()->withPermissions(['pages.read'])->create();
        $user = User::factory()->create(['role_id' => $role->id]);

        $this->assertTrue($this->policy->viewAny($user));
    }

    public function test_view_any_denied_without_permission(): void
    {
        $role = Role::factory()->withPermissions([])->create();
        $user = User::factory()->create(['role_id' => $role->id]);

        $this->assertFalse($this->policy->viewAny($user));
    }

    public function test_create_allowed_with_pages_create_permission(): void
    {
        $role = Role::factory()->withPermissions(['pages.create'])->create();
        $user = User::factory()->create(['role_id' => $role->id]);

        $this->assertTrue($this->policy->create($user));
    }

    public function test_create_denied_without_permission(): void
    {
        $role = Role::factory()->withPermissions(['pages.read'])->create();
        $user = User::factory()->create(['role_id' => $role->id]);

        $this->assertFalse($this->policy->create($user));
    }

    public function test_update_allowed_with_pages_update_permission(): void
    {
        $role = Role::factory()->withPermissions(['pages.update'])->create();
        $user = User::factory()->create(['role_id' => $role->id]);

        $otherUser = User::factory()->create();
        $page = Page::factory()->create(['created_by' => $otherUser->id]);

        $this->assertTrue($this->policy->update($user, $page));
    }

    public function test_update_own_page_allowed_with_update_own_permission(): void
    {
        $role = Role::factory()->withPermissions(['pages.update.own'])->create();
        $user = User::factory()->create(['role_id' => $role->id]);

        $page = Page::factory()->create(['created_by' => $user->id]);

        $this->assertTrue($this->policy->update($user, $page));
    }

    public function test_update_others_page_denied_with_only_update_own_permission(): void
    {
        $role = Role::factory()->withPermissions(['pages.update.own'])->create();
        $user = User::factory()->create(['role_id' => $role->id]);

        $otherUser = User::factory()->create();
        $page = Page::factory()->create(['created_by' => $otherUser->id]);

        $this->assertFalse($this->policy->update($user, $page));
    }

    public function test_update_denied_without_any_update_permission(): void
    {
        $role = Role::factory()->withPermissions(['pages.read'])->create();
        $user = User::factory()->create(['role_id' => $role->id]);

        $page = Page::factory()->create(['created_by' => $user->id]);

        $this->assertFalse($this->policy->update($user, $page));
    }

    public function test_delete_allowed_with_pages_delete_permission(): void
    {
        $role = Role::factory()->withPermissions(['pages.delete'])->create();
        $user = User::factory()->create(['role_id' => $role->id]);

        $page = Page::factory()->create();

        $this->assertTrue($this->policy->delete($user, $page));
    }

    public function test_delete_denied_without_permission(): void
    {
        $role = Role::factory()->withPermissions(['pages.read'])->create();
        $user = User::factory()->create(['role_id' => $role->id]);

        $page = Page::factory()->create();

        $this->assertFalse($this->policy->delete($user, $page));
    }

    public function test_force_delete_allowed_only_for_admin(): void
    {
        $adminRole = Role::factory()->admin()->create();
        $admin = User::factory()->create(['role_id' => $adminRole->id]);

        $page = Page::factory()->create();

        $this->assertTrue($this->policy->forceDelete($admin, $page));
    }

    public function test_force_delete_denied_for_non_admin(): void
    {
        $editorRole = Role::factory()->editor()->create();
        $editor = User::factory()->create(['role_id' => $editorRole->id]);

        $page = Page::factory()->create();

        $this->assertFalse($this->policy->forceDelete($editor, $page));
    }

    public function test_restore_allowed_with_pages_delete_permission(): void
    {
        $role = Role::factory()->withPermissions(['pages.delete'])->create();
        $user = User::factory()->create(['role_id' => $role->id]);

        $page = Page::factory()->create();

        $this->assertTrue($this->policy->restore($user, $page));
    }

    public function test_restore_denied_without_permission(): void
    {
        $role = Role::factory()->withPermissions(['pages.read'])->create();
        $user = User::factory()->create(['role_id' => $role->id]);

        $page = Page::factory()->create();

        $this->assertFalse($this->policy->restore($user, $page));
    }

    public function test_view_allowed_with_pages_read_permission(): void
    {
        $role = Role::factory()->withPermissions(['pages.read'])->create();
        $user = User::factory()->create(['role_id' => $role->id]);

        $page = Page::factory()->create();

        $this->assertTrue($this->policy->view($user, $page));
    }

    public function test_admin_can_do_everything(): void
    {
        $adminRole = Role::factory()->admin()->create();
        $admin = User::factory()->create(['role_id' => $adminRole->id]);

        $page = Page::factory()->create();

        $this->assertTrue($this->policy->viewAny($admin));
        $this->assertTrue($this->policy->view($admin, $page));
        $this->assertTrue($this->policy->create($admin));
        $this->assertTrue($this->policy->update($admin, $page));
        $this->assertTrue($this->policy->delete($admin, $page));
        $this->assertTrue($this->policy->forceDelete($admin, $page));
        $this->assertTrue($this->policy->restore($admin, $page));
    }
}
