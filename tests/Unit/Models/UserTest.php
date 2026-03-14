<?php

declare(strict_types=1);

namespace Tests\Unit\Models;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserTest extends TestCase
{
    use RefreshDatabase;

    public function test_has_permission_with_exact_match(): void
    {
        $role = Role::factory()->withPermissions(['pages.create', 'pages.read'])->create();
        $user = User::factory()->create(['role_id' => $role->id]);

        $this->assertTrue($user->hasPermission('pages.create'));
        $this->assertTrue($user->hasPermission('pages.read'));
        $this->assertFalse($user->hasPermission('pages.delete'));
    }

    public function test_has_permission_with_wildcard(): void
    {
        $role = Role::factory()->withPermissions(['pages.*'])->create();
        $user = User::factory()->create(['role_id' => $role->id]);

        $this->assertTrue($user->hasPermission('pages.create'));
        $this->assertTrue($user->hasPermission('pages.read'));
        $this->assertTrue($user->hasPermission('pages.update'));
        $this->assertTrue($user->hasPermission('pages.delete'));
        $this->assertFalse($user->hasPermission('posts.create'));
    }

    public function test_has_permission_with_super_wildcard(): void
    {
        $role = Role::factory()->admin()->create();
        $user = User::factory()->create(['role_id' => $role->id]);

        $this->assertTrue($user->hasPermission('pages.create'));
        $this->assertTrue($user->hasPermission('posts.delete'));
        $this->assertTrue($user->hasPermission('media.upload'));
        $this->assertTrue($user->hasPermission('settings.update'));
        $this->assertTrue($user->hasPermission('anything.at.all'));
    }

    public function test_has_permission_returns_false_when_role_has_no_permissions(): void
    {
        $role = Role::factory()->withPermissions([])->create();
        $user = User::factory()->create(['role_id' => $role->id]);

        $this->assertFalse($user->hasPermission('pages.create'));
        $this->assertFalse($user->hasPermission('posts.read'));
    }

    public function test_has_permission_returns_false_when_role_is_null(): void
    {
        $user = User::factory()->create(['role_id' => null]);

        $this->assertFalse($user->hasPermission('pages.create'));
    }

    public function test_is_admin_returns_true_for_admin_role(): void
    {
        $role = Role::factory()->admin()->create();
        $user = User::factory()->create(['role_id' => $role->id]);

        $this->assertTrue($user->isAdmin());
    }

    public function test_is_admin_returns_false_for_non_admin_role(): void
    {
        $role = Role::factory()->editor()->create();
        $user = User::factory()->create(['role_id' => $role->id]);

        $this->assertFalse($user->isAdmin());
    }

    public function test_is_admin_returns_false_for_subscriber_role(): void
    {
        $role = Role::factory()->subscriber()->create();
        $user = User::factory()->create(['role_id' => $role->id]);

        $this->assertFalse($user->isAdmin());
    }

    public function test_is_admin_returns_false_when_no_role(): void
    {
        $user = User::factory()->create(['role_id' => null]);

        $this->assertFalse($user->isAdmin());
    }

    public function test_user_belongs_to_role(): void
    {
        $role = Role::factory()->create();
        $user = User::factory()->create(['role_id' => $role->id]);

        $this->assertNotNull($user->role);
        $this->assertEquals($role->id, $user->role->id);
    }

    public function test_wildcard_permission_does_not_match_other_groups(): void
    {
        $role = Role::factory()->withPermissions(['pages.*'])->create();
        $user = User::factory()->create(['role_id' => $role->id]);

        $this->assertTrue($user->hasPermission('pages.create'));
        $this->assertFalse($user->hasPermission('posts.create'));
        $this->assertFalse($user->hasPermission('media.upload'));
    }
}
