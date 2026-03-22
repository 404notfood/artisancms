<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\UserRequest;
use App\Models\User;
use App\Services\AvatarService;
use App\Services\RoleService;
use App\Services\UserService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function __construct(
        private readonly UserService $userService,
        private readonly RoleService $roleService,
        private readonly AvatarService $avatarService,
    ) {}

    /**
     * Display a paginated list of users with search and role filter.
     */
    public function index(Request $request): Response
    {
        $filters = $request->only(['search', 'role_id', 'per_page']);

        return Inertia::render('Admin/Users/Index', [
            'users' => $this->userService->all($filters),
            'roles' => $this->roleService->getOptions(),
            'filters' => $filters,
        ]);
    }

    /**
     * Show the form for creating a new user.
     */
    public function create(): Response
    {
        return Inertia::render('Admin/Users/Create', [
            'roles' => $this->roleService->getOptions(),
        ]);
    }

    /**
     * Store a newly created user.
     */
    public function store(UserRequest $request): RedirectResponse
    {
        $this->userService->create($request->validated());

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

        return Inertia::render('Admin/Users/Edit', [
            'user' => $user,
            'roles' => $this->roleService->getOptions(),
        ]);
    }

    /**
     * Update the specified user.
     */
    public function update(UserRequest $request, User $user): RedirectResponse
    {
        $this->userService->update($user, $request->validated());

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

        $this->userService->delete($user);

        return redirect()
            ->route('admin.users.index')
            ->with('success', __('cms.users.deleted'));
    }
}
