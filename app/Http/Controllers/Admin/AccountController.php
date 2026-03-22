<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\AccountUpdateRequest;
use App\Services\AvatarService;
use App\Services\RoleService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class AccountController extends Controller
{
    public function __construct(
        private readonly AvatarService $avatarService,
        private readonly RoleService $roleService,
    ) {}

    public function edit(): Response
    {
        $user = Auth::user();
        $roles = $this->roleService->getOptions();

        return Inertia::render('Admin/Account/Edit', [
            'user' => $user,
            'roles' => $roles,
        ]);
    }

    public function update(AccountUpdateRequest $request): RedirectResponse
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        $user->update($request->validated());

        return redirect()->back()->with('success', __('cms.account.updated'));
    }

    public function updatePassword(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', Password::defaults(), 'confirmed'],
        ]);

        /** @var \App\Models\User $user */
        $user = Auth::user();
        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        return redirect()->back()->with('success', __('cms.account.password_updated'));
    }

    public function uploadAvatar(Request $request): RedirectResponse
    {
        $request->validate([
            'avatar' => ['required', 'image', 'max:2048'],
        ]);

        /** @var \App\Models\User $user */
        $user = Auth::user();
        $this->avatarService->upload($user, $request->file('avatar'));

        return redirect()->back()->with('success', __('cms.account.avatar_updated'));
    }

    public function removeAvatar(): RedirectResponse
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        $this->avatarService->remove($user);

        return redirect()->back()->with('success', __('cms.account.avatar_removed'));
    }

    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        /** @var \App\Models\User $user */
        $user = Auth::user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
