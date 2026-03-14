<?php

declare(strict_types=1);

namespace Ecommerce\Http\Controllers;

use App\Http\Controllers\Controller;
use Ecommerce\Models\Order;
use Ecommerce\Services\OrderService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function __construct(
        private readonly OrderService $orderService,
    ) {}

    /**
     * Display a paginated list of orders.
     */
    public function index(Request $request): Response
    {
        $filters = $request->only(['status', 'search', 'per_page']);

        $orders = $this->orderService->all($filters);

        return Inertia::render('Admin/Ecommerce/Orders/Index', [
            'orders' => $orders,
            'filters' => $filters,
        ]);
    }

    /**
     * Display the details of an order.
     */
    public function show(Order $order): Response
    {
        $order->load(['items', 'user']);

        return Inertia::render('Admin/Ecommerce/Orders/Show', [
            'order' => $order,
        ]);
    }

    /**
     * Update the status of an order.
     */
    public function updateStatus(Request $request, Order $order): RedirectResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,processing,shipped,completed,cancelled,refunded',
            'tracking_number' => 'nullable|string|max:255',
        ]);

        $this->orderService->updateStatus(
            $order,
            $validated['status'],
            $validated['tracking_number'] ?? null,
        );

        return redirect()
            ->back()
            ->with('success', 'Statut de la commande mis a jour.');
    }
}
