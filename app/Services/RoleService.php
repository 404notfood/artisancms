<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Role;
use Illuminate\Database\Eloquent\Collection;

class RoleService
{
    public function __construct(
        private readonly ActivityLogService $activityLogService,
    ) {}

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
        $role = Role::create([
            'name' => $data['name'],
            'slug' => $data['slug'],
            'permissions' => $data['permissions'] ?? [],
            'is_system' => false,
        ]);

        $this->activityLogService->logRoleEvent('role_created', (int) $role->id, [
            'new' => [
                'name' => $role->name,
                'slug' => $role->slug,
                'permissions' => $role->permissions,
            ],
        ]);

        return $role;
    }

    /**
     * @param array<string, mixed> $data
     */
    public function update(Role $role, array $data): Role
    {
        $oldValues = $role->only(['name', 'slug', 'permissions']);
        $updateData = ['permissions' => $data['permissions'] ?? []];

        if (!$role->is_system) {
            $updateData['name'] = $data['name'];
            $updateData['slug'] = $data['slug'];
        }

        $role->update($updateData);

        $freshRole = $role->fresh() ?? $role;

        $this->activityLogService->logRoleEvent('role_updated', (int) $freshRole->id, [
            'old' => $oldValues,
            'new' => $freshRole->only(['name', 'slug', 'permissions']),
        ]);

        return $freshRole;
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

        $roleId = (int) $role->id;
        $oldValues = $role->only(['name', 'slug', 'permissions']);
        $deleted = (bool) $role->delete();

        if ($deleted) {
            $this->activityLogService->logRoleEvent('role_deleted', $roleId, [
                'old' => $oldValues,
                'fallback_role' => $defaultRole?->slug,
            ]);
        }

        return $deleted;
    }
}
