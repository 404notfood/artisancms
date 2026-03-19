<?php

declare(strict_types=1);

namespace MemberSpace\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;
use MemberSpace\Http\Controllers\Concerns\HasMemberSettings;
use MemberSpace\Http\Controllers\Concerns\HasThemeAndMenus;
use MemberSpace\Models\MemberProfile;
use MemberSpace\Services\CustomFieldService;
use MemberSpace\Services\ProfileService;

class ProfileController extends Controller
{
    use HasMemberSettings, HasThemeAndMenus;

    public function __construct(
        private readonly ProfileService $profileService,
        private readonly CustomFieldService $customFieldService,
    ) {}

    public function show(User $user): Response
    {
        $profile = MemberProfile::where('user_id', $user->id)->first();

        if (!$profile) {
            abort(404);
        }

        $viewer = auth()->user();

        // Check visibility
        if ($profile->profile_visibility === 'private' && $user->id !== $viewer?->id && !$viewer?->isAdmin()) {
            abort(403, 'Ce profil est prive.');
        }

        if ($profile->profile_visibility === 'members_only' && !$viewer) {
            abort(403, 'Ce profil est reserve aux membres.');
        }

        $customFields = $this->customFieldService->getFields('profile');
        $fieldValues = $this->customFieldService->getFieldValues($user->id);

        $visibleFields = $customFields->filter(fn ($field) => !$field->admin_only);

        return Inertia::render('Front/Members/Profile', array_merge($this->themeAndMenus(), [
            'member' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $profile->show_email ? $user->email : null,
                ],
                'profile' => $profile,
                'custom_fields' => $visibleFields->map(fn ($field) => [
                    'id' => $field->id,
                    'name' => $field->name,
                    'type' => $field->type,
                    'value' => $fieldValues[$field->id] ?? null,
                ]),
            ],
            'settings' => $this->getSettings(),
        ]));
    }
}
