<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Services\NewsletterService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NewsletterSubscribeController extends Controller
{
    public function __construct(
        private readonly NewsletterService $newsletterService,
    ) {}

    /**
     * Subscribe an email to the newsletter.
     */
    public function subscribe(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email|max:255',
            'name' => 'nullable|string|max:255',
        ]);

        $result = $this->newsletterService->subscribe(
            $validated['email'],
            $validated['name'] ?? null,
            $request->ip()
        );

        return response()->json($result, $result['success'] ? 200 : 422);
    }

    /**
     * Unsubscribe via token (hashed email).
     */
    public function unsubscribe(Request $request, string $token): JsonResponse
    {
        // Decode the token (base64-encoded email)
        $email = base64_decode($token);

        if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return response()->json([
                'success' => false,
                'message' => __('cms.newsletter.invalid_token'),
            ], 400);
        }

        $result = $this->newsletterService->unsubscribe($email);

        if ($result) {
            return response()->json([
                'success' => true,
                'message' => __('cms.newsletter.unsubscribed'),
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => __('cms.newsletter.not_found'),
        ], 404);
    }
}
