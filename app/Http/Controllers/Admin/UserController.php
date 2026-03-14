<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\UserRequest;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    /**
     * Display a paginated list of users with search and role filter.
     */
    public function index(Request $request): Response
    {
        $filters = $request->only(['search', 'role_id', 'per_page']);

        $query = User::with('role');

        if (isset($filters['search']) && $filters['search'] !== '') {
            $search = $filters['search'];
            $query->where(function ($q) use ($search): void {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if (isset($filters['role_id']) && $filters['role_id'] !== '') {
            $query->where('role_id', (int) $filters['role_id']);
        }

        $query->orderBy('name', 'asc');

        $perPage = (int) ($filters['per_page'] ?? 15);
        $users = $query->paginate($perPage)->withQueryString();

        $roles = Role::orderBy('name')->get(['id', 'name', 'slug']);

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'roles' => $roles,
            'filters' => $filters,
        ]);
    }

    /**
     * Show the form for creating a new user.
     */
    public function create(): Response
    {
        $roles = Role::orderBy('name')->get(['id', 'name', 'slug']);

        return Inertia::render('Admin/Users/Create', [
            'roles' => $roles,
        ]);
    }

    /**
     * Store a newly created user.
     */
    public function store(UserRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role_id' => $validated['role_id'],
            'bio' => $validated['bio'] ?? null,
        ]);

        return redirect()
            ->route('admin.users.index')
            ->with('success', __('cms.users.created'));
    }

    /**
     * Show the form for editing a user.
     */
    public function edit(User $user): Response
    {
        $user->load('role');

        $roles = Role::orderBy('name')->get(['id', 'name', 'slug']);

        return Inertia::render('Admin/Users/Edit', [
            'user' => $user,
            'roles' => $roles,
        ]);
    }

    /**
     * Update the specified user.
     */
    public function update(UserRequest $request, User $user): RedirectResponse
    {
        $validated = $request->validated();

        $data = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'role_id' => $validated['role_id'],
            'bio' => $validated['bio'] ?? null,
        ];

        if (!empty($validated['password'])) {
            $data['password'] = Hash::make($validated['password']);
        }

        $user->update($data);

        return redirect()
            ->back()
            ->with('success', __('cms.users.updated'));
    }

    /**
     * Delete the specified user.
     */
    public function destroy(Request $request, User $user): RedirectResponse
    {
        $currentUser = $request->user();

        // Prevent deleting self
        if ($currentUser && $currentUser->id === $user->id) {
            return redirect()
                ->back()
                ->with('error', __('cms.users.cannot_delete_self'));
        }

        // Prevent deleting the last admin
        if ($user->isAdmin()) {
            $adminCount = User::whereHas('role', function ($q): void {
                $q->where('slug', 'admin');
            })->count();

            if ($adminCount <= 1) {
                return redirect()
                    ->back()
                    ->with('error', __('cms.users.cannot_delete_last_admin'));
            }
        }

        $user->delete();

        return redirect()
            ->route('admin.users.index')
            ->with('success', __('cms.users.deleted'));
    }
}
