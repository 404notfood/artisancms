<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\UserRequest;
use App\Models\Role;
use App\Models\User;
use App\Services\AvatarService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function __construct(
        private readonly AvatarService $avatarService,
    ) {}

    /**
     * Display a paginated list of users with search and role filter.
     */
    public function index(Request $request): Response
    {
        $filters = $request->only(['search', 'role_id', 'per_page']);

        $query = User::with('role')->withCount(['posts', 'pages']);

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
            'profile_visibility' => $validated['profile_visibility'] ?? 'public',
            'social_links' => $validated['social_links'] ?? null,
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
        $user->load('role')->loadCount(['posts', 'pages']);

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
            'profile_visibility' => $validated['profile_visibility'] ?? $user->profile_visibility,
            'social_links' => $validated['social_links'] ?? $user->social_links,
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
     * Upload an avatar for the specified user.
     */
    public function uploadAvatar(Request $request, User $user): RedirectResponse
    {
        $request->validate([
            'avatar' => ['required', 'image', 'max:2048'],
        ]);

        $this->avatarService->upload($user, $request->file('avatar'));

        return redirect()->back()->with('success', __('cms.users.avatar_updated'));
    }

    /**
     * Remove the avatar of the specified user.
     */
    public function removeAvatar(User $user): RedirectResponse
    {
        $this->avatarService->remove($user);

        return redirect()->back()->with('success', __('cms.users.avatar_removed'));
    }

    /**
     * Delete the specified user.
     */
    public function destroy(User $user): RedirectResponse
    {
        $this->authorize('delete', $user);

        $user->delete();

        return redirect()
            ->route('admin.users.index')
            ->with('success', __('cms.users.deleted'));
    }
}
