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
use MemberSpace\Services\ProfileService;
use MemberSpace\Services\TwoFactorService;

class TwoFactorController extends Controller
{
    use HasMemberSettings, HasThemeAndMenus;

    public function __construct(
        private readonly TwoFactorService $twoFactorService,
        private readonly ProfileService $profileService,
    ) {}

    public function show(): Response
    {
        $user = auth()->user();
        $isEnabled = $this->twoFactorService->isEnabled($user);

        return Inertia::render('Front/Members/Account/Security', array_merge($this->themeAndMenus(), [
            'twoFactorEnabled' => $isEnabled,
            'recoveryCodes' => $isEnabled ? $this->twoFactorService->getRecoveryCodes($user) : [],
            'settings' => $this->getSettings(),
        ]));
    }

    public function enable(Request $request): RedirectResponse
    {
        $user = auth()->user();
        $setup = $this->twoFactorService->enable($user);

        $request->session()->put('2fa_setup', $setup);

        return redirect()->back()->with('2fa_setup', $setup);
    }

    public function confirm(Request $request): RedirectResponse
    {
        $request->validate([
            'code' => 'required|string|size:6',
        ]);

        $user = auth()->user();

        if (!$this->twoFactorService->confirm($user, $request->input('code'))) {
            return redirect()->back()->withErrors(['code' => 'Code invalide. Veuillez reessayer.']);
        }

        $this->profileService->logActivity($user->id, '2fa_enabled', '2FA active');

        return redirect()->route('members.account.security')
            ->with('success', 'Authentification a deux facteurs activee.');
    }

    public function disable(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => 'required|current_password',
        ]);

        $user = auth()->user();
        $this->twoFactorService->disable($user);
        $this->profileService->logActivity($user->id, '2fa_disabled', '2FA desactive');

        return redirect()->route('members.account.security')
            ->with('success', 'Authentification a deux facteurs desactivee.');
    }

    public function regenerateCodes(): RedirectResponse
    {
        $user = auth()->user();
        $codes = $this->twoFactorService->regenerateRecoveryCodes($user);

        return redirect()->back()->with('recovery_codes', $codes);
    }
}
