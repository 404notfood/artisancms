<?php

declare(strict_types=1);

namespace MemberSpace\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use MemberSpace\Services\MemberSettingsService;

class MemberSettingsController extends Controller
{
    public function __construct(
        private readonly MemberSettingsService $settingsService,
    ) {}

    public function index(): Response
    {
        return Inertia::render('Admin/MemberSpace/Settings', [
            'settings' => $this->settingsService->all(),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'modules' => 'required|array',
            'modules.*' => 'boolean',
            'profile' => 'required|array',
            'profile.default_visibility' => 'required|in:public,members_only,private',
            'profile.require_avatar' => 'boolean',
            'profile.max_bio_length' => 'required|integer|min:100|max:5000',
            'profile.enable_cover_photo' => 'boolean',
            'directory' => 'required|array',
            'directory.per_page' => 'required|integer|min:6|max:48',
            'directory.default_sort' => 'required|in:newest,oldest,name,recently_active',
            'directory.show_search' => 'boolean',
            'directory.layout' => 'required|in:grid,list',
            'registration' => 'required|array',
            'registration.enable_custom_registration' => 'boolean',
            'registration.require_email_verification' => 'boolean',
            'registration.auto_create_profile' => 'boolean',
            'registration.default_role' => 'required|string|max:50',
            'social_login' => 'nullable|array',
            'social_login.google_client_id' => 'nullable|string|max:255',
            'social_login.google_client_secret' => 'nullable|string|max:255',
            'social_login.facebook_client_id' => 'nullable|string|max:255',
            'social_login.facebook_client_secret' => 'nullable|string|max:255',
            'social_login.github_client_id' => 'nullable|string|max:255',
            'social_login.github_client_secret' => 'nullable|string|max:255',
            'stripe' => 'nullable|array',
            'stripe.publishable_key' => 'nullable|string|max:255',
            'stripe.secret_key' => 'nullable|string|max:255',
            'stripe.webhook_secret' => 'nullable|string|max:255',
        ]);

        $this->settingsService->save($validated);

        return redirect()
            ->route('admin.member-space.settings')
            ->with('success', 'Parametres mis a jour.');
    }
}
