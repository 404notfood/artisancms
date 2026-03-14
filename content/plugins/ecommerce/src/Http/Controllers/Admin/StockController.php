<?php

declare(strict_types=1);

namespace Ecommerce\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Ecommerce\Models\Product;
use Ecommerce\Services\StockService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StockController extends Controller
{
    public function __construct(
        private readonly StockService $stockService,
    ) {}

    /**
     * Display the stock management index page.
     */
    public function index(Request $request): Response
    {
        $filter = $request->input('filter', 'all');

        $query = Product::with('category')
            ->where('track_stock', true);

        if ($filter === 'low') {
            $query->lowStock();
        } elseif ($filter === 'out') {
            $query->outOfStock();
        }

        $query->orderBy('stock');

        $products = $query->paginate(20)->withQueryString();

        $lowStockCount = Product::where('track_stock', true)
            ->whereColumn('stock', '<=', 'low_stock_threshold')
            ->where('stock', '>', 0)
            ->count();

        $outOfStockCount = Product::where('track_stock', true)
            ->where('stock', '<=', 0)
            ->count();

        return Inertia::render('Admin/Ecommerce/Stock/Index', [
            'products' => $products,
            'filter' => $filter,
            'lowStockCount' => $lowStockCount,
            'outOfStockCount' => $outOfStockCount,
        ]);
    }

    /**
     * Manually adjust stock for a product.
     */
    public function adjust(Request $request, Product $product): RedirectResponse
    {
        $validated = $request->validate([
            'quantity' => 'required|integer',
            'reason' => 'nullable|string|max:255',
        ]);

        $type = (int) $validated['quantity'] > 0 ? 'restock' : 'adjustment';

        $this->stockService->recordMovement(
            $product->id,
            null,
            $type,
            (int) $validated['quantity'],
            $validated['reason'] ?? null,
        );

        return redirect()
            ->back()
            ->with('success', 'Stock ajuste avec succes.');
    }

    /**
     * Get stock movement history for a product.
     */
    public function movements(Request $request, Product $product): Response
    {
        $variantId = $request->input('variant_id') ? (int) $request->input('variant_id') : null;

        $movements = $this->stockService->getMovements($product->id, $variantId);

        return Inertia::render('Admin/Ecommerce/Stock/Movements', [
            'product' => $product->load('variants'),
            'movements' => $movements,
            'variantId' => $variantId,
        ]);
    }
}
