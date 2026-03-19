<?php

declare(strict_types=1);

namespace MemberSpace\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use MemberSpace\Models\UserMembership;

class MembershipExpiringNotification extends Notification
{
    use Queueable;

    public function __construct(
        public readonly UserMembership $membership,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'membership_expiring',
            'message' => "Votre abonnement {$this->membership->plan?->name} expire bientot",
            'plan_id' => $this->membership->plan_id,
            'expires_at' => $this->membership->expires_at?->toISOString(),
            'url' => '/members/account/membership',
        ];
    }
}
