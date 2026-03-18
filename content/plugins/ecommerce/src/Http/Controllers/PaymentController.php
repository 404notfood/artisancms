<?php

declare(strict_types=1);

namespace Ecommerce\Http\Controllers;

use App\Http\Controllers\Controller;
use Ecommerce\Http\Controllers\Concerns\HasThemeAndMenus;
use Ecommerce\Models\Order;
use Ecommerce\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PaymentController extends Controller
{
    use HasThemeAndMenus;

    public function __construct(
        private readonly PaymentService $paymentService,
    ) {}

    public function process(Request $request, Order $order): JsonResponse|RedirectResponse
    {
        $this->authorizeOrder($order);

        $validated = $request->validate([
            'method' => 'required|string',
            'success_url' => 'nullable|url',
            'cancel_url' => 'nullable|url',
        ]);

        $result = $this->paymentService->processPayment($order, $validated['method'], $validated);

        if (!$result->success) {
            return $request->wantsJson()
                ? response()->json(['success' => false, 'error' => $result->error], 422)
                : redirect()->back()->with('error', $result->error ?? 'Erreur lors du paiement.');
        }

        if ($result->requiresRedirect()) {
            return $request->wantsJson()
                ? response()->json([
                    'success' => true,
                    'redirect_url' => $result->redirectUrl,
                    'transaction_id' => $result->transactionId,
                ])
                : redirect()->away($result->redirectUrl);
        }

        if ($result->requiresClientConfirmation()) {
            return response()->json([
                'success' => true,
                'client_secret' => $result->clientSecret,
                'transaction_id' => $result->transactionId,
            ]);
        }

        return $request->wantsJson()
            ? response()->json(['success' => true, 'transaction_id' => $result->transactionId])
            : redirect()->route('shop.payment.success', $order)
                ->with('success', 'Paiement effectue avec succes.');
    }

    /**
     * Handle payment provider webhook (no auth, CSRF excluded, signature verified by driver).
     */
    public function webhook(Request $request, string $driver): JsonResponse
    {
        $result = $this->paymentService->handleWebhook($driver, $request);

        return response()->json(
            ['success' => $result->success, ...($result->success ? ['status' => $result->status] : ['error' => $result->error])],
            $result->success ? 200 : 400,
        );
    }

    public function success(Order $order): Response
    {
        $this->authorizeOrder($order);

        return Inertia::render('Ecommerce/Payment/Success', array_merge($this->themeAndMenus(), [
            'order' => $order->load('items'),
        ]));
    }

    public function cancel(Order $order): Response
    {
        $this->authorizeOrder($order);

        return Inertia::render('Ecommerce/Payment/Cancel', array_merge($this->themeAndMenus(), [
            'order' => $order,
        ]));
    }

    private function authorizeOrder(Order $order): void
    {
        if ($order->user_id !== auth()->id()) {
            abort(403);
        }
    }
}
