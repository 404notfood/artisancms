<?php

declare(strict_types=1);

namespace Tests\Traits;

use App\Models\Role;
use App\Models\User;

trait CmsTestHelpers
{
    protected function createAdmin(): User
    {
        $role = Role::factory()->admin()->create();

        return User::factory()->create(['role_id' => $role->id]);
    }

    protected function createEditor(): User
    {
        $role = Role::factory()->editor()->create();

        return User::factory()->create(['role_id' => $role->id]);
    }

    protected function createAuthor(): User
    {
        $role = Role::factory()->author()->create();

        return User::factory()->create(['role_id' => $role->id]);
    }

    protected function createSubscriber(): User
    {
        $role = Role::factory()->subscriber()->create();

        return User::factory()->create(['role_id' => $role->id]);
    }
}
