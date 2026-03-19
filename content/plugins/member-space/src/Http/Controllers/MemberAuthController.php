<?php

declare(strict_types=1);

namespace MemberSpace\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;
use MemberSpace\Http\Controllers\Concerns\HasMemberSettings;
use MemberSpace\Http\Controllers\Concerns\HasThemeAndMenus;
use MemberSpace\Services\CustomFieldService;
use MemberSpace\Services\ProfileService;
use MemberSpace\Services\TwoFactorService;

class MemberAuthController extends Controller
{
    use HasMemberSettings, HasThemeAndMenus;

    public function __construct(
        private readonly ProfileService $profileService,
        private readonly CustomFieldService $customFieldService,
        private readonly TwoFactorService $twoFactorService,
    ) {}

    public function showRegister(): Response
    {
        $customFields = [];
        if ($this->isModuleEnabled('custom_fields')) {
            $customFields = $this->customFieldService->getFields('registration');
        }

        return Inertia::render('Front/Members/Auth/Register', array_merge($this->themeAndMenus(), [
            'customFields' => $customFields,
            'modules' => $this->getSettings()['modules'] ?? [],
            'settings' => $this->getSettings(),
        ]));
    }

    public function register(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);

        $settings = $this->getSettings();

        if ($settings['registration']['auto_create_profile'] ?? true) {
            $this->profileService->getOrCreateProfile($user);
        }

        if ($this->isModuleEnabled('custom_fields') && $request->has('custom_fields')) {
            $this->customFieldService->saveFieldValues($user->id, $request->input('custom_fields', []));
        }

        $this->profileService->logActivity($user->id, 'registered', 'Inscription');

        Auth::login($user);

        return redirect('/members/account');
    }

    public function showLogin(): Response
    {
        return Inertia::render('Front/Members/Auth/Login', array_merge($this->themeAndMenus(), [
            'modules' => $this->getSettings()['modules'] ?? [],
            'settings' => $this->getSettings(),
        ]));
    }

    public function login(Request $request): RedirectResponse
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if (!Auth::attempt($credentials, $request->boolean('remember'))) {
            return redirect()->back()
                ->withErrors(['email' => 'Identifiants invalides.'])
                ->withInput($request->only('email'));
        }

        $user = Auth::user();

        // Check if 2FA is enabled
        if ($this->isModuleEnabled('two_factor') && $this->twoFactorService->isEnabled($user)) {
            Auth::logout();
            $request->session()->put('2fa.user_id', $user->id);
            $request->session()->put('2fa.remember', $request->boolean('remember'));

            return redirect('/members/auth/two-factor');
        }

        $request->session()->regenerate();
        $this->profileService->touchLastActive($user->id);
        $this->profileService->logActivity($user->id, 'login', 'Connexion');

        return redirect()->intended('/members/account');
    }

    public function showTwoFactor(): Response|RedirectResponse
    {
        if (!session('2fa.user_id')) {
            return redirect('/members/auth/login');
        }

        return Inertia::render('Front/Members/Auth/TwoFactor', array_merge($this->themeAndMenus(), [
            'settings' => $this->getSettings(),
        ]));
    }

    public function verifyTwoFactor(Request $request): RedirectResponse
    {
        $request->validate([
            'code' => 'required|string',
        ]);

        $userId = session('2fa.user_id');
        $remember = session('2fa.remember', false);

        if (!$userId) {
            return redirect('/members/auth/login');
        }

        $user = User::find($userId);
        if (!$user) {
            return redirect('/members/auth/login');
        }

        if (!$this->twoFactorService->verify($user, $request->input('code'))) {
            return redirect()->back()->withErrors(['code' => 'Code invalide.']);
        }

        $request->session()->forget(['2fa.user_id', '2fa.remember']);
        Auth::login($user, $remember);
        $request->session()->regenerate();

        $this->profileService->touchLastActive($user->id);
        $this->profileService->logActivity($user->id, 'login', 'Connexion (2FA)');

        return redirect()->intended('/members/account');
    }
}
