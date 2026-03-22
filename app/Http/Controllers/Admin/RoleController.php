<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Services\RoleService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RoleController extends Controller
{
    public function __construct(
        private readonly RoleService $roleService,
    ) {}

    public function index(): Response
    {
        return Inertia::render('Admin/Settings/Roles/Index', [
            'roles' => $this->roleService->all(),
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

        $this->roleService->create($validated);

        return redirect()
            ->route('admin.roles.index')
            ->with('success', __('cms.roles.created'));
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

        $this->roleService->update($role, $validated);

        return redirect()
            ->route('admin.roles.index')
            ->with('success', __('cms.roles.updated'));
    }

    public function destroy(Role $role): RedirectResponse
    {
        if ($role->is_system) {
            return redirect()
                ->route('admin.roles.index')
                ->with('error', __('cms.roles.system_cannot_delete'));
        }

        $this->roleService->delete($role);

        return redirect()
            ->route('admin.roles.index')
            ->with('success', __('cms.roles.deleted'));
    }
}
