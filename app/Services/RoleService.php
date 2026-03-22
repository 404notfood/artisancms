<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Role;
use Illuminate\Database\Eloquent\Collection;

class RoleService
{
    /**
     * @return Collection<int, Role>
     */
    public function all(): Collection
    {
        return Role::withCount('users')
            ->orderByDesc('is_system')
            ->orderBy('name')
            ->get();
    }

    /**
     * @return Collection<int, Role>
     */
    public function getOptions(): Collection
    {
        return Role::orderBy('name')->get(['id', 'name', 'slug']);
    }

    public function find(int $id): Role
    {
        return Role::withCount('users')->findOrFail($id);
    }

    /**
     * @param array<string, mixed> $data
     */
    public function create(array $data): Role
    {
        return Role::create([
            'name' => $data['name'],
            'slug' => $data['slug'],
            'permissions' => $data['permissions'] ?? [],
            'is_system' => false,
        ]);
    }

    /**
     * @param array<string, mixed> $data
     */
    public function update(Role $role, array $data): Role
    {
        $updateData = ['permissions' => $data['permissions'] ?? []];

        if (!$role->is_system) {
            $updateData['name'] = $data['name'];
            $updateData['slug'] = $data['slug'];
        }

        $role->update($updateData);

        return $role->fresh() ?? $role;
    }

    public function delete(Role $role): bool
    {
        if ($role->is_system) {
            return false;
        }

        $defaultRole = Role::where('slug', 'subscriber')->first();
        if ($defaultRole) {
            $role->users()->update(['role_id' => $defaultRole->id]);
        }

        return (bool) $role->delete();
    }
}
