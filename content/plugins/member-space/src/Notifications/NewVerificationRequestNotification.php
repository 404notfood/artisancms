<?php

declare(strict_types=1);

namespace MemberSpace\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use MemberSpace\Models\MemberVerification;

class NewVerificationRequestNotification extends Notification
{
    use Queueable;

    public function __construct(
        public readonly MemberVerification $verification,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'verification_request',
            'message' => "Nouvelle demande de verification de {$this->verification->user?->name}",
            'user_id' => $this->verification->user_id,
            'verification_id' => $this->verification->id,
            'url' => '/admin/member-space/verifications',
        ];
    }
}
