<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Services\NewsletterService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NewsletterSubscribeController extends Controller
{
    public function __construct(
        private readonly NewsletterService $newsletterService,
    ) {}

    /**
     * Subscribe an email to the newsletter (double opt-in: sends confirmation email).
     */
    public function subscribe(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email|max:255',
            'name'  => 'nullable|string|max:255',
        ]);

        $result = $this->newsletterService->subscribe(
            $validated['email'],
            $validated['name'] ?? null,
            $request->ip(),
        );

        return response()->json($result, $result['success'] ? 200 : 422);
    }

    /**
     * Confirm subscription via token from email.
     */
    public function confirm(string $token): Response
    {
        $confirmed = $this->newsletterService->confirmSubscription($token);

        return Inertia::render('Front/NewsletterConfirm', [
            'confirmed' => $confirmed,
        ]);
    }

    /**
     * Unsubscribe via HMAC-signed token (not the raw email).
     */
    public function unsubscribe(string $token): Response
    {
        $result = $this->newsletterService->unsubscribe($token);

        return Inertia::render('Front/NewsletterUnsubscribe', [
            'success' => $result,
        ]);
    }
}
