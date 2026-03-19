<?php

declare(strict_types=1);

namespace MemberSpace\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use MemberSpace\Http\Controllers\Concerns\HasMemberSettings;
use MemberSpace\Http\Controllers\Concerns\HasThemeAndMenus;
use MemberSpace\Services\CustomFieldService;
use MemberSpace\Services\ProfileService;
use MemberSpace\Services\SocialLoginService;

class AccountController extends Controller
{
    use HasMemberSettings, HasThemeAndMenus;

    public function __construct(
        private readonly ProfileService $profileService,
        private readonly CustomFieldService $customFieldService,
        private readonly SocialLoginService $socialLoginService,
    ) {}

    public function dashboard(): Response
    {
        $user = auth()->user();
        $profile = $this->profileService->getOrCreateProfile($user);
        $this->profileService->touchLastActive($user->id);
        $recentActivity = $this->profileService->getRecentActivity($user->id, 10);

        $settings = $this->getSettings();
        $modules = $settings['modules'] ?? [];

        return Inertia::render('Front/Members/Account/Dashboard', array_merge($this->themeAndMenus(), [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
            'profile' => $profile,
            'recentActivity' => $recentActivity,
            'modules' => $modules,
            'settings' => $settings,
        ]));
    }

    public function editProfile(): Response
    {
        $user = auth()->user();
        $profile = $this->profileService->getOrCreateProfile($user);

        $customFields = [];
        $fieldValues = [];

        if ($this->isModuleEnabled('custom_fields')) {
            $customFields = $this->customFieldService->getFields('profile');
            $fieldValues = $this->customFieldService->getFieldValues($user->id);
        }

        return Inertia::render('Front/Members/Account/EditProfile', array_merge($this->themeAndMenus(), [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
            'profile' => $profile,
            'customFields' => $customFields,
            'fieldValues' => $fieldValues,
            'settings' => $this->getSettings(),
        ]));
    }

    public function updateProfile(Request $request): RedirectResponse
    {
        $user = auth()->user();
        $profile = $this->profileService->getOrCreateProfile($user);

        $validated = $request->validate([
            'display_name' => 'required|string|max:100',
            'first_name' => 'nullable|string|max:100',
            'last_name' => 'nullable|string|max:100',
            'bio' => 'nullable|string|max:500',
            'phone' => 'nullable|string|max:30',
            'website' => 'nullable|url|max:255',
            'location' => 'nullable|string|max:100',
            'birth_date' => 'nullable|date',
            'gender' => 'nullable|string|max:20',
            'company' => 'nullable|string|max:100',
            'job_title' => 'nullable|string|max:100',
            'social_links' => 'nullable|array',
            'social_links.*' => 'nullable|url|max:255',
            'profile_visibility' => 'required|in:public,members_only,private',
            'show_in_directory' => 'boolean',
            'show_email' => 'boolean',
            'show_phone' => 'boolean',
        ]);

        $this->profileService->updateProfile($profile, $validated);

        if ($this->isModuleEnabled('custom_fields') && $request->has('custom_fields')) {
            $fieldRules = $this->customFieldService->getValidationRules('profile');
            $request->validate($fieldRules);
            $this->customFieldService->saveFieldValues($user->id, $request->input('custom_fields', []));
        }

        return redirect()
            ->route('members.account.edit-profile')
            ->with('success', 'Profil mis a jour avec succes.');
    }

    public function uploadAvatar(Request $request): RedirectResponse
    {
        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,png,webp|max:2048',
        ]);

        $user = auth()->user();
        $profile = $this->profileService->getOrCreateProfile($user);
        $this->profileService->uploadAvatar($profile, $request->file('avatar'));

        return redirect()->back()->with('success', 'Photo de profil mise a jour.');
    }

    public function uploadCover(Request $request): RedirectResponse
    {
        $request->validate([
            'cover_photo' => 'required|image|mimes:jpeg,png,webp|max:5120',
        ]);

        $user = auth()->user();
        $profile = $this->profileService->getOrCreateProfile($user);
        $this->profileService->uploadCoverPhoto($profile, $request->file('cover_photo'));

        return redirect()->back()->with('success', 'Photo de couverture mise a jour.');
    }

    public function deleteAvatar(): RedirectResponse
    {
        $user = auth()->user();
        $profile = $this->profileService->getOrCreateProfile($user);
        $this->profileService->deleteAvatar($profile);

        return redirect()->back()->with('success', 'Photo de profil supprimee.');
    }

    public function socialAccounts(): Response
    {
        return Inertia::render('Front/Members/Account/SocialAccounts', array_merge($this->themeAndMenus(), [
            'accounts' => $this->socialLoginService->getUserAccounts(auth()->id()),
            'providers' => $this->socialLoginService->getSupportedProviders(),
            'settings' => $this->getSettings(),
        ]));
    }
}
