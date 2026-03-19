<?php

declare(strict_types=1);

namespace MemberSpace\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;
use MemberSpace\Http\Controllers\Concerns\HasMemberSettings;
use MemberSpace\Services\ProfileService;
use MemberSpace\Services\SocialLoginService;

class SocialAuthController extends Controller
{
    use HasMemberSettings;

    public function __construct(
        private readonly SocialLoginService $socialLoginService,
        private readonly ProfileService $profileService,
    ) {}

    public function redirect(string $provider): RedirectResponse
    {
        $this->validateProvider($provider);

        return Socialite::driver($provider)->redirect();
    }

    public function callback(string $provider): RedirectResponse
    {
        $this->validateProvider($provider);

        try {
            $socialUser = Socialite::driver($provider)->user();
        } catch (\Throwable $e) {
            return redirect('/members/auth/login')
                ->with('error', 'Erreur de connexion avec ' . ucfirst($provider) . '.');
        }

        // If user is already logged in, link the account
        if (Auth::check()) {
            try {
                $this->socialLoginService->linkAccount(Auth::user(), $provider, $socialUser);
                $this->profileService->logActivity(Auth::id(), 'social_linked', "Compte {$provider} lie");
            } catch (\RuntimeException $e) {
                return redirect('/members/account/social')
                    ->with('error', $e->getMessage());
            }

            return redirect('/members/account/social')
                ->with('success', ucfirst($provider) . ' lie avec succes.');
        }

        // Otherwise find or create user
        $user = $this->socialLoginService->findOrCreateUser($provider, $socialUser);
        $this->profileService->getOrCreateProfile($user);

        Auth::login($user, true);
        $this->profileService->touchLastActive($user->id);
        $this->profileService->logActivity($user->id, 'social_login', "Connexion via {$provider}");

        return redirect('/members/account');
    }

    public function unlink(string $provider): RedirectResponse
    {
        $this->validateProvider($provider);

        $user = Auth::user();
        $this->socialLoginService->unlinkAccount($user, $provider);
        $this->profileService->logActivity($user->id, 'social_unlinked', "Compte {$provider} delie");

        return redirect('/members/account/social')
            ->with('success', ucfirst($provider) . ' delie avec succes.');
    }

    private function validateProvider(string $provider): void
    {
        if (!in_array($provider, $this->socialLoginService->getSupportedProviders(), true)) {
            abort(404);
        }
    }
}
