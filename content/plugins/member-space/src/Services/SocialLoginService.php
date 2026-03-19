<?php

declare(strict_types=1);

namespace MemberSpace\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use MemberSpace\Models\SocialAccount;

class SocialLoginService
{
    private const SUPPORTED_PROVIDERS = ['google', 'facebook', 'github'];

    public function getSupportedProviders(): array
    {
        return self::SUPPORTED_PROVIDERS;
    }

    public function findOrCreateUser(string $provider, object $socialUser): User
    {
        $socialAccount = SocialAccount::where('provider', $provider)
            ->where('provider_id', $socialUser->getId())
            ->first();

        if ($socialAccount) {
            $this->updateSocialAccount($socialAccount, $socialUser);
            return $socialAccount->user;
        }

        $user = User::where('email', $socialUser->getEmail())->first();

        if (!$user) {
            $user = User::create([
                'name' => $socialUser->getName() ?? $socialUser->getNickname() ?? 'Utilisateur',
                'email' => $socialUser->getEmail(),
                'password' => Hash::make(Str::random(32)),
                'email_verified_at' => now(),
            ]);
        }

        $this->createSocialAccount($user, $provider, $socialUser);

        return $user;
    }

    public function getUserAccounts(int $userId): \Illuminate\Database\Eloquent\Collection
    {
        return SocialAccount::where('user_id', $userId)->get();
    }

    public function linkAccount(User $user, string $provider, object $socialUser): SocialAccount
    {
        $existing = SocialAccount::where('provider', $provider)
            ->where('provider_id', $socialUser->getId())
            ->first();

        if ($existing && $existing->user_id !== $user->id) {
            throw new \RuntimeException('Ce compte social est deja lie a un autre utilisateur.');
        }

        return SocialAccount::updateOrCreate(
            ['user_id' => $user->id, 'provider' => $provider],
            [
                'provider_id' => $socialUser->getId(),
                'provider_email' => $socialUser->getEmail(),
                'provider_name' => $socialUser->getName(),
                'provider_avatar' => $socialUser->getAvatar(),
                'access_token' => $socialUser->token ?? null,
                'refresh_token' => $socialUser->refreshToken ?? null,
                'token_expires_at' => isset($socialUser->expiresIn)
                    ? now()->addSeconds($socialUser->expiresIn)
                    : null,
            ]
        );
    }

    public function unlinkAccount(User $user, string $provider): void
    {
        SocialAccount::where('user_id', $user->id)
            ->where('provider', $provider)
            ->delete();
    }

    private function createSocialAccount(User $user, string $provider, object $socialUser): SocialAccount
    {
        return SocialAccount::create([
            'user_id' => $user->id,
            'provider' => $provider,
            'provider_id' => $socialUser->getId(),
            'provider_email' => $socialUser->getEmail(),
            'provider_name' => $socialUser->getName(),
            'provider_avatar' => $socialUser->getAvatar(),
            'access_token' => $socialUser->token ?? null,
            'refresh_token' => $socialUser->refreshToken ?? null,
            'token_expires_at' => isset($socialUser->expiresIn)
                ? now()->addSeconds($socialUser->expiresIn)
                : null,
        ]);
    }

    private function updateSocialAccount(SocialAccount $account, object $socialUser): void
    {
        $account->update([
            'provider_email' => $socialUser->getEmail(),
            'provider_name' => $socialUser->getName(),
            'provider_avatar' => $socialUser->getAvatar(),
            'access_token' => $socialUser->token ?? null,
            'refresh_token' => $socialUser->refreshToken ?? null,
            'token_expires_at' => isset($socialUser->expiresIn)
                ? now()->addSeconds($socialUser->expiresIn)
                : null,
        ]);
    }
}
