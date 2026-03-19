<?php

declare(strict_types=1);

namespace MemberSpace\Observers;

use MemberSpace\Mail\VerificationApprovedMail;
use MemberSpace\Mail\VerificationRejectedMail;
use MemberSpace\Models\MemberVerification;
use Illuminate\Support\Facades\Mail;

class MemberVerificationObserver
{
    public function updated(MemberVerification $verification): void
    {
        if (!$verification->wasChanged('status')) {
            return;
        }

        $verification->load('user');
        $user = $verification->user;

        if (!$user) {
            return;
        }

        match ($verification->status) {
            'approved' => Mail::to($user->email)->queue(new VerificationApprovedMail($verification)),
            'rejected' => Mail::to($user->email)->queue(new VerificationRejectedMail($verification)),
            default => null,
        };
    }
}
