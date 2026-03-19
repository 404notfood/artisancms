<?php

declare(strict_types=1);

namespace MemberSpace\Services;

use App\Models\User;
use Illuminate\Support\Facades\Http;
use MemberSpace\Models\MembershipPlan;
use MemberSpace\Models\UserMembership;

class MembershipService
{
    public function __construct(
        private readonly MemberSettingsService $settingsService,
        private readonly ProfileService $profileService,
    ) {}

    public function getActivePlans(): \Illuminate\Database\Eloquent\Collection
    {
        return MembershipPlan::active()->ordered()->get();
    }

    public function getUserMembership(User $user): ?UserMembership
    {
        return UserMembership::where('user_id', $user->id)
            ->with('plan')
            ->latest()
            ->first();
    }

    public function subscribe(User $user, MembershipPlan $plan): UserMembership
    {
        if ($plan->isFree()) {
            return $this->createFreeMembership($user, $plan);
        }

        $stripeSettings = $this->settingsService->get('stripe');
        $secretKey = $stripeSettings['secret_key'] ?? '';

        if (empty($secretKey)) {
            throw new \RuntimeException('Stripe non configure.');
        }

        return $this->createPendingMembership($user, $plan);
    }

    public function createCheckoutSession(User $user, MembershipPlan $plan): string
    {
        $stripeSettings = $this->settingsService->get('stripe');
        $secretKey = $stripeSettings['secret_key'] ?? '';

        $response = Http::withHeaders([
            'Authorization' => "Bearer {$secretKey}",
        ])->asForm()->post('https://api.stripe.com/v1/checkout/sessions', [
            'mode' => $plan->billing_period === 'one_time' ? 'payment' : 'subscription',
            'customer_email' => $user->email,
            'line_items' => [
                [
                    'price' => $plan->stripe_price_id,
                    'quantity' => 1,
                ],
            ],
            'success_url' => url('/members/account/membership?success=1'),
            'cancel_url' => url('/members/account/membership?cancelled=1'),
            'metadata' => [
                'user_id' => $user->id,
                'plan_id' => $plan->id,
            ],
        ]);

        if (!$response->successful()) {
            throw new \RuntimeException('Erreur Stripe: ' . ($response->json('error.message') ?? 'Inconnu'));
        }

        return $response->json('url');
    }

    public function handleWebhook(array $payload): void
    {
        $type = $payload['type'] ?? '';
        $data = $payload['data']['object'] ?? [];

        match ($type) {
            'checkout.session.completed' => $this->handleCheckoutCompleted($data),
            'customer.subscription.deleted' => $this->handleSubscriptionCancelled($data),
            'invoice.payment_failed' => $this->handlePaymentFailed($data),
            default => null,
        };
    }

    public function cancel(UserMembership $membership): void
    {
        $membership->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
        ]);

        $this->profileService->logActivity(
            $membership->user_id,
            'membership_cancelled',
            'Abonnement annule'
        );
    }

    public function expireOverdue(): int
    {
        $expired = UserMembership::whereIn('status', ['active', 'trial'])
            ->where(function ($q) {
                $q->where('expires_at', '<', now())
                    ->orWhere(function ($q2) {
                        $q2->where('status', 'trial')
                            ->where('trial_ends_at', '<', now());
                    });
            })
            ->get();

        foreach ($expired as $membership) {
            $membership->update(['status' => 'expired']);
        }

        return $expired->count();
    }

    private function createFreeMembership(User $user, MembershipPlan $plan): UserMembership
    {
        $membership = UserMembership::create([
            'user_id' => $user->id,
            'plan_id' => $plan->id,
            'status' => 'active',
            'starts_at' => now(),
            'expires_at' => $plan->duration_days
                ? now()->addDays($plan->duration_days)
                : null,
            'amount_paid' => 0,
            'payment_method' => 'free',
        ]);

        $this->profileService->logActivity(
            $user->id,
            'membership_started',
            "Abonnement {$plan->name} active"
        );

        return $membership;
    }

    private function createPendingMembership(User $user, MembershipPlan $plan): UserMembership
    {
        return UserMembership::create([
            'user_id' => $user->id,
            'plan_id' => $plan->id,
            'status' => 'pending',
        ]);
    }

    private function handleCheckoutCompleted(array $data): void
    {
        $userId = (int) ($data['metadata']['user_id'] ?? 0);
        $planId = (int) ($data['metadata']['plan_id'] ?? 0);

        if (!$userId || !$planId) {
            return;
        }

        $plan = MembershipPlan::find($planId);
        if (!$plan) {
            return;
        }

        UserMembership::updateOrCreate(
            ['user_id' => $userId, 'plan_id' => $planId, 'status' => 'pending'],
            [
                'status' => $plan->trial_days > 0 ? 'trial' : 'active',
                'starts_at' => now(),
                'expires_at' => $plan->duration_days ? now()->addDays($plan->duration_days) : null,
                'trial_ends_at' => $plan->trial_days > 0 ? now()->addDays($plan->trial_days) : null,
                'stripe_subscription_id' => $data['subscription'] ?? null,
                'stripe_customer_id' => $data['customer'] ?? null,
                'amount_paid' => ($data['amount_total'] ?? 0) / 100,
                'payment_method' => 'stripe',
            ]
        );
    }

    private function handleSubscriptionCancelled(array $data): void
    {
        $membership = UserMembership::where('stripe_subscription_id', $data['id'])->first();

        if ($membership) {
            $membership->update([
                'status' => 'cancelled',
                'cancelled_at' => now(),
            ]);
        }
    }

    private function handlePaymentFailed(array $data): void
    {
        $customerId = $data['customer'] ?? null;
        if (!$customerId) {
            return;
        }

        UserMembership::where('stripe_customer_id', $customerId)
            ->where('status', 'active')
            ->update(['status' => 'pending']);
    }
}
