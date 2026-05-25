<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Models\User;
use App\Services\ActivityLogService;
use Illuminate\Auth\Events\Failed;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;

class LogAuthenticationActivity
{
    public function __construct(
        private readonly ActivityLogService $activityLogService,
    ) {}

    public function handle(Login|Logout|Failed $event): void
    {
        if ($event instanceof Login) {
            $this->activityLogService->logLogin((int) $event->user->getAuthIdentifier());

            return;
        }

        if ($event instanceof Logout) {
            $this->activityLogService->logLogout();

            return;
        }

        $email = is_array($event->credentials)
            ? (string) ($event->credentials['email'] ?? $event->credentials['login'] ?? '')
            : '';

        if ($event->user instanceof User) {
            $email = $event->user->email;
        }

        $this->activityLogService->logFailedLogin($email);
    }
}
