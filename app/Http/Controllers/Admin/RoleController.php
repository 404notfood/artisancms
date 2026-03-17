<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Role;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RoleController extends Controller
{
    public function index(): Response
    {
        $roles = Role::withCount('users')
            ->orderByDesc('is_system')
            ->orderBy('name')
            ->get();

        return Inertia::render('Admin/Settings/Roles/Index', [
            'roles' => $roles,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Settings/Roles/Edit', [
            'role' => [
                'name' => '',
                'slug' => '',
                'is_system' => false,
                'permissions' => [],
            ],
            'isNew' => true,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'unique:roles,slug'],
            'permissions' => ['array'],
            'permissions.*' => ['string'],
        ]);

        Role::create([
            'name' => $validated['name'],
            'slug' => $validated['slug'],
            'permissions' => $validated['permissions'] ?? [],
            'is_system' => false,
        ]);

        return redirect()
            ->route('admin.roles.index')
            ->with('success', 'Rôle créé avec succès.');
    }

    public function edit(Role $role): Response
    {
        return Inertia::render('Admin/Settings/Roles/Edit', [
            'role' => $role,
            'isNew' => false,
        ]);
    }

    public function update(Request $request, Role $role): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'unique:roles,slug,' . $role->id],
            'permissions' => ['array'],
            'permissions.*' => ['string'],
        ]);

        $data = ['permissions' => $validated['permissions'] ?? []];

        if (!$role->is_system) {
            $data['name'] = $validated['name'];
            $data['slug'] = $validated['slug'];
        }

        $role->update($data);

        return redirect()
            ->route('admin.roles.index')
            ->with('success', 'Rôle mis à jour.');
    }

    public function destroy(Role $role): RedirectResponse
    {
        if ($role->is_system) {
            return redirect()
                ->route('admin.roles.index')
                ->with('error', 'Les rôles système ne peuvent pas être supprimés.');
        }

        // Reassign users to default role
        $defaultRole = Role::where('slug', 'subscriber')->first();
        if ($defaultRole) {
            $role->users()->update(['role_id' => $defaultRole->id]);
        }

        $role->delete();

        return redirect()
            ->route('admin.roles.index')
            ->with('success', 'Rôle supprimé.');
    }
}
