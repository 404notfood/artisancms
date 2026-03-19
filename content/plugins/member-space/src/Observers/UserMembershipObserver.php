<?php

declare(strict_types=1);

namespace MemberSpace\Observers;

use MemberSpace\Mail\MembershipWelcomeMail;
use MemberSpace\Models\UserMembership;
use Illuminate\Support\Facades\Mail;

class UserMembershipObserver
{
    public function updated(UserMembership $membership): void
    {
        if ($membership->wasChanged('status')) {
            $oldStatus = $membership->getOriginal('status');
            $newStatus = $membership->status;

            if ($oldStatus === 'pending' && in_array($newStatus, ['active', 'trial'], true)) {
                $membership->load('user', 'plan');
                if ($membership->user) {
                    Mail::to($membership->user->email)
                        ->queue(new MembershipWelcomeMail($membership));
                }
            }
        }
    }
}
