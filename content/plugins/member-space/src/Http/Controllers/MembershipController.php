<?php

declare(strict_types=1);

namespace MemberSpace\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use MemberSpace\Http\Controllers\Concerns\HasMemberSettings;
use MemberSpace\Http\Controllers\Concerns\HasThemeAndMenus;
use MemberSpace\Models\MembershipPlan;
use MemberSpace\Services\MembershipService;

class MembershipController extends Controller
{
    use HasMemberSettings, HasThemeAndMenus;

    public function __construct(
        private readonly MembershipService $membershipService,
    ) {}

    public function plans(): Response
    {
        return Inertia::render('Front/Members/Plans', array_merge($this->themeAndMenus(), [
            'plans' => $this->membershipService->getActivePlans(),
            'currentMembership' => auth()->check()
                ? $this->membershipService->getUserMembership(auth()->user())
                : null,
            'settings' => $this->getSettings(),
        ]));
    }

    public function accountMembership(): Response
    {
        $user = auth()->user();

        return Inertia::render('Front/Members/Account/Membership', array_merge($this->themeAndMenus(), [
            'membership' => $this->membershipService->getUserMembership($user),
            'plans' => $this->membershipService->getActivePlans(),
            'settings' => $this->getSettings(),
        ]));
    }

    public function subscribe(Request $request, MembershipPlan $plan): RedirectResponse
    {
        $user = auth()->user();

        if ($plan->isFree()) {
            $this->membershipService->subscribe($user, $plan);
            return redirect('/members/account/membership')
                ->with('success', "Abonnement {$plan->name} active.");
        }

        try {
            $url = $this->membershipService->createCheckoutSession($user, $plan);
            return redirect()->away($url);
        } catch (\RuntimeException $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function cancel(): RedirectResponse
    {
        $user = auth()->user();
        $membership = $this->membershipService->getUserMembership($user);

        if ($membership && $membership->isActive()) {
            $this->membershipService->cancel($membership);
        }

        return redirect('/members/account/membership')
            ->with('success', 'Abonnement annule.');
    }

    public function webhook(Request $request): \Illuminate\Http\JsonResponse
    {
        $payload = $request->all();
        $settings = $this->getSettings();

        $webhookSecret = $settings['stripe']['webhook_secret'] ?? '';
        $signature = $request->header('Stripe-Signature', '');

        if ($webhookSecret && $signature) {
            try {
                $sigParts = collect(explode(',', $signature))
                    ->mapWithKeys(function ($part) {
                        [$key, $value] = explode('=', $part, 2);
                        return [$key => $value];
                    });

                $timestamp = $sigParts->get('t', '');
                $expectedSig = $sigParts->get('v1', '');
                $computedSig = hash_hmac('sha256', "{$timestamp}.{$request->getContent()}", $webhookSecret);

                if (!hash_equals($computedSig, $expectedSig)) {
                    return response()->json(['error' => 'Invalid signature'], 403);
                }
            } catch (\Throwable) {
                return response()->json(['error' => 'Invalid signature'], 403);
            }
        }

        $this->membershipService->handleWebhook($payload);

        return response()->json(['ok' => true]);
    }
}
