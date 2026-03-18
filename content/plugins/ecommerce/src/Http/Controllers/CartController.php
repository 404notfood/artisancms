<?php

declare(strict_types=1);

namespace Ecommerce\Http\Controllers;

use App\Http\Controllers\Controller;
use Ecommerce\Http\Controllers\Concerns\HasEcommerceSettings;
use Ecommerce\Http\Controllers\Concerns\HasThemeAndMenus;
use Ecommerce\Models\CartItem;
use Ecommerce\Services\CartService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CartController extends Controller
{
    use HasEcommerceSettings;
    use HasThemeAndMenus;

    public function __construct(
        private readonly CartService $cartService,
    ) {}

    public function index(): Response
    {
        $items = $this->cartService->getItems();

        $cartItems = $items->map(fn ($item) => [
            'id' => $item->id,
            'product_id' => $item->product_id,
            'variant_id' => $item->variant_id,
            'name' => $item->product->name,
            'variant_name' => $item->variant?->name,
            'variant_attributes' => $item->variant?->attributes,
            'price' => $item->getPrice(),
            'quantity' => $item->quantity,
            'total' => $item->getTotal(),
            'featured_image' => $item->product->featured_image,
            'slug' => $item->product->slug,
            'stock' => $item->variant?->stock ?? $item->product->stock,
        ]);

        $settings = $this->getSettings();
        $subtotal = $items->sum(fn ($item) => $item->getTotal());
        $shipping = $this->calculateShipping($subtotal, $settings);
        $tax = round($subtotal * (float) ($settings['tax_rate'] ?? 20) / 100, 2);

        return Inertia::render('Front/Shop/Cart', array_merge($this->themeAndMenus(), [
            'cartItems' => $cartItems,
            'subtotal' => $subtotal,
            'tax' => $tax,
            'shipping' => $shipping,
            'total' => $subtotal + $tax + $shipping,
            'settings' => $settings,
        ]));
    }

    public function add(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'variant_id' => 'nullable|exists:product_variants,id',
            'quantity' => 'integer|min:1',
        ]);

        $this->cartService->addItem($validated);

        return redirect()->back()->with('success', 'Produit ajoute au panier.');
    }

    public function update(Request $request, CartItem $cartItem): RedirectResponse
    {
        $this->authorizeCartItem($cartItem);

        $validated = $request->validate([
            'quantity' => 'required|integer|min:1',
        ]);

        $this->cartService->updateQuantity($cartItem, $validated['quantity']);

        return redirect()->back()->with('success', 'Panier mis a jour.');
    }

    public function remove(CartItem $cartItem): RedirectResponse
    {
        $this->authorizeCartItem($cartItem);

        $this->cartService->removeItem($cartItem);

        return redirect()->back()->with('success', 'Produit retire du panier.');
    }

    public function clear(): RedirectResponse
    {
        $this->cartService->clear();

        return redirect()->back()->with('success', 'Panier vide.');
    }

    /**
     * JSON: add item (for block renderers / AJAX).
     */
    public function apiAdd(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'variant_id' => 'nullable|exists:product_variants,id',
            'quantity' => 'integer|min:1',
        ]);

        $this->cartService->addItem($validated);
        $count = $this->cartService->getItems()->sum('quantity');

        return response()->json(['success' => true, 'cart_count' => $count]);
    }

    /**
     * JSON: cart summary (count + total).
     */
    public function apiGet(): JsonResponse
    {
        $items = $this->cartService->getItems();

        return response()->json([
            'count' => $items->sum('quantity'),
            'total' => round($items->sum(fn ($item) => $item->getTotal()), 2),
        ]);
    }

    private function authorizeCartItem(CartItem $cartItem): void
    {
        if ($cartItem->user_id !== auth()->id() && $cartItem->session_id !== session()->getId()) {
            abort(403);
        }
    }

    private function calculateShipping(float $subtotal, array $settings): float
    {
        $threshold = (float) ($settings['free_shipping_threshold'] ?? 50);

        return $subtotal >= $threshold ? 0.0 : (float) ($settings['shipping_cost'] ?? 5.99);
    }
}
