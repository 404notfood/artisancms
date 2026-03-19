<?php

declare(strict_types=1);

namespace MemberSpace\Services;

use App\Models\User;
use Illuminate\Support\Str;
use MemberSpace\Models\TwoFactorAuth;
use PragmaRX\Google2FA\Google2FA;

class TwoFactorService
{
    private Google2FA $google2fa;

    public function __construct()
    {
        $this->google2fa = new Google2FA();
    }

    public function enable(User $user): array
    {
        $secret = $this->google2fa->generateSecretKey();
        $recoveryCodes = $this->generateRecoveryCodes();

        TwoFactorAuth::updateOrCreate(
            ['user_id' => $user->id],
            [
                'secret' => $secret,
                'recovery_codes' => $recoveryCodes,
                'enabled' => false,
                'confirmed_at' => null,
            ]
        );

        $qrUrl = $this->google2fa->getQRCodeUrl(
            config('app.name', 'ArtisanCMS'),
            $user->email,
            $secret
        );

        return [
            'secret' => $secret,
            'qr_url' => $qrUrl,
            'recovery_codes' => $recoveryCodes,
        ];
    }

    public function confirm(User $user, string $code): bool
    {
        $twoFactor = TwoFactorAuth::where('user_id', $user->id)->first();

        if (!$twoFactor) {
            return false;
        }

        $valid = $this->google2fa->verifyKey($twoFactor->secret, $code);

        if ($valid) {
            $twoFactor->update([
                'enabled' => true,
                'confirmed_at' => now(),
            ]);
        }

        return $valid;
    }

    public function verify(User $user, string $code): bool
    {
        $twoFactor = TwoFactorAuth::where('user_id', $user->id)
            ->where('enabled', true)
            ->first();

        if (!$twoFactor) {
            return false;
        }

        if ($this->google2fa->verifyKey($twoFactor->secret, $code)) {
            $twoFactor->update(['last_used_at' => now()]);
            return true;
        }

        return $this->useRecoveryCode($twoFactor, $code);
    }

    public function disable(User $user): void
    {
        TwoFactorAuth::where('user_id', $user->id)->delete();
    }

    public function isEnabled(User $user): bool
    {
        return TwoFactorAuth::where('user_id', $user->id)
            ->where('enabled', true)
            ->exists();
    }

    public function getRecoveryCodes(User $user): array
    {
        $twoFactor = TwoFactorAuth::where('user_id', $user->id)->first();

        return $twoFactor?->recovery_codes ?? [];
    }

    public function regenerateRecoveryCodes(User $user): array
    {
        $twoFactor = TwoFactorAuth::where('user_id', $user->id)->first();

        if (!$twoFactor) {
            return [];
        }

        $codes = $this->generateRecoveryCodes();
        $twoFactor->update(['recovery_codes' => $codes]);

        return $codes;
    }

    private function generateRecoveryCodes(int $count = 8): array
    {
        $codes = [];
        for ($i = 0; $i < $count; $i++) {
            $codes[] = Str::upper(Str::random(4) . '-' . Str::random(4));
        }

        return $codes;
    }

    private function useRecoveryCode(TwoFactorAuth $twoFactor, string $code): bool
    {
        $codes = $twoFactor->recovery_codes ?? [];
        $code = strtoupper($code);

        $index = array_search($code, $codes, true);
        if ($index === false) {
            return false;
        }

        unset($codes[$index]);
        $twoFactor->update([
            'recovery_codes' => array_values($codes),
            'last_used_at' => now(),
        ]);

        return true;
    }
}
