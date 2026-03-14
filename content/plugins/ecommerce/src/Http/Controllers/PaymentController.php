<?php

declare(strict_types=1);

namespace Ecommerce\Http\Controllers;

use App\Http\Controllers\Controller;
use Ecommerce\Models\Order;
use Ecommerce\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PaymentController extends Controller
{
    public function __construct(
        private readonly PaymentService $paymentService,
    ) {}

    /**
     * Initiate payment processing for an order.
     */
    public function process(Request $request, Order $order): JsonResponse|RedirectResponse
    {
        $validated = $request->validate([
            'method' => 'required|string',
            'success_url' => 'nullable|url',
            'cancel_url' => 'nullable|url',
        ]);

        $result = $this->paymentService->processPayment(
            $order,
            $validated['method'],
            $validated,
        );

        if (!$result->success) {
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'error' => $result->error,
                ], 422);
            }

            return redirect()
                ->back()
                ->with('error', $result->error ?? 'Erreur lors du paiement.');
        }

        if ($result->requiresRedirect()) {
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'redirect_url' => $result->redirectUrl,
                    'transaction_id' => $result->transactionId,
                ]);
            }

            return redirect()->away($result->redirectUrl);
        }

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'transaction_id' => $result->transactionId,
            ]);
        }

        return redirect()
            ->route('shop.payment.success', $order)
            ->with('success', 'Paiement effectue avec succes.');
    }

    /**
     * Handle payment provider webhook callback.
     */
    public function webhook(Request $request, string $driver): JsonResponse
    {
        $result = $this->paymentService->handleWebhook($driver, $request);

        if (!$result->success) {
            return response()->json([
                'success' => false,
                'error' => $result->error,
            ], 400);
        }

        return response()->json([
            'success' => true,
            'status' => $result->status,
        ]);
    }

    /**
     * Payment success redirect page.
     */
    public function success(Order $order): Response
    {
        return Inertia::render('Ecommerce/Payment/Success', [
            'order' => $order->load('items'),
        ]);
    }

    /**
     * Payment cancelled redirect page.
     */
    public function cancel(Order $order): Response
    {
        return Inertia::render('Ecommerce/Payment/Cancel', [
            'order' => $order,
        ]);
    }
}
