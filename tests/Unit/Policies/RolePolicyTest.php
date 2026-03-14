<?php

declare(strict_types=1);

namespace Tests\Unit\Policies;

use App\Models\Role;
use App\Models\User;
use App\Policies\RolePolicy;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RolePolicyTest extends TestCase
{
    use RefreshDatabase;

    private RolePolicy $policy;

    protected function setUp(): void
    {
        parent::setUp();
        $this->policy = new RolePolicy();
    }

    public function test_cannot_update_system_role(): void
    {
        $adminRole = Role::factory()->admin()->create();
        $admin = User::factory()->create(['role_id' => $adminRole->id]);

        $systemRole = Role::factory()->system()->create([
            'name' => 'System Role',
            'slug' => 'system-role',
            'permissions' => ['pages.read'],
        ]);

        $this->assertFalse($this->policy->update($admin, $systemRole));
    }

    public function test_cannot_delete_system_role(): void
    {
        $adminRole = Role::factory()->admin()->create();
        $admin = User::factory()->create(['role_id' => $adminRole->id]);

        $systemRole = Role::factory()->system()->create([
            'name' => 'System Role',
            'slug' => 'system-role',
            'permissions' => ['pages.read'],
        ]);

        $this->assertFalse($this->policy->delete($admin, $systemRole));
    }

    public function test_can_update_custom_role_with_permission(): void
    {
        $role = Role::factory()->withPermissions(['roles.update'])->create();
        $user = User::factory()->create(['role_id' => $role->id]);

        $customRole = Role::factory()->create([
            'name' => 'Custom Role',
            'slug' => 'custom-role',
            'is_system' => false,
        ]);

        $this->assertTrue($this->policy->update($user, $customRole));
    }

    public function test_can_delete_custom_role_with_permission(): void
    {
        $role = Role::factory()->withPermissions(['roles.delete'])->create();
        $user = User::factory()->create(['role_id' => $role->id]);

        $customRole = Role::factory()->create([
            'name' => 'Custom Role',
            'slug' => 'custom-role',
            'is_system' => false,
        ]);

        $this->assertTrue($this->policy->delete($user, $customRole));
    }

    public function test_cannot_update_custom_role_without_permission(): void
    {
        $role = Role::factory()->withPermissions(['pages.read'])->create();
        $user = User::factory()->create(['role_id' => $role->id]);

        $customRole = Role::factory()->create([
            'is_system' => false,
        ]);

        $this->assertFalse($this->policy->update($user, $customRole));
    }

    public function test_cannot_delete_custom_role_without_permission(): void
    {
        $role = Role::factory()->withPermissions(['pages.read'])->create();
        $user = User::factory()->create(['role_id' => $role->id]);

        $customRole = Role::factory()->create([
            'is_system' => false,
        ]);

        $this->assertFalse($this->policy->delete($user, $customRole));
    }

    public function test_view_any_allowed_with_roles_read_permission(): void
    {
        $role = Role::factory()->withPermissions(['roles.read'])->create();
        $user = User::factory()->create(['role_id' => $role->id]);

        $this->assertTrue($this->policy->viewAny($user));
    }

    public function test_view_any_denied_without_permission(): void
    {
        $role = Role::factory()->withPermissions([])->create();
        $user = User::factory()->create(['role_id' => $role->id]);

        $this->assertFalse($this->policy->viewAny($user));
    }

    public function test_view_allowed_with_roles_read_permission(): void
    {
        $role = Role::factory()->withPermissions(['roles.read'])->create();
        $user = User::factory()->create(['role_id' => $role->id]);

        $targetRole = Role::factory()->create();

        $this->assertTrue($this->policy->view($user, $targetRole));
    }

    public function test_create_allowed_with_roles_create_permission(): void
    {
        $role = Role::factory()->withPermissions(['roles.create'])->create();
        $user = User::factory()->create(['role_id' => $role->id]);

        $this->assertTrue($this->policy->create($user));
    }

    public function test_create_denied_without_permission(): void
    {
        $role = Role::factory()->withPermissions([])->create();
        $user = User::factory()->create(['role_id' => $role->id]);

        $this->assertFalse($this->policy->create($user));
    }

    public function test_cannot_update_admin_system_role(): void
    {
        $adminRole = Role::factory()->admin()->create();
        $admin = User::factory()->create(['role_id' => $adminRole->id]);

        // Even admin cannot update a system role via the policy
        $this->assertFalse($this->policy->update($admin, $adminRole));
    }

    public function test_cannot_delete_editor_system_role(): void
    {
        $adminRole = Role::factory()->admin()->create();
        $admin = User::factory()->create(['role_id' => $adminRole->id]);

        $editorRole = Role::factory()->editor()->create();

        $this->assertFalse($this->policy->delete($admin, $editorRole));
    }
}
