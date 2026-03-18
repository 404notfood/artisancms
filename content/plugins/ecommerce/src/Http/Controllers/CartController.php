<?php

declare(strict_types=1);

namespace Ecommerce\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\CmsPlugin;
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
    use HasThemeAndMenus;

    public function __construct(
        private readonly CartService $cartService,
    ) {}

    /**
     * Display the cart page.
     */
    public function index(): Response
    {
        $items = $this->cartService->getItems();

        $cartItems = $items->map(function ($item) {
            return [
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
            ];
        });

        $subtotal = $items->sum(fn ($item) => $item->getTotal());

        $settings = $this->getSettings();
        $shippingCost = (float) ($settings['shipping_cost'] ?? 5.99);
        $freeShippingThreshold = (float) ($settings['free_shipping_threshold'] ?? 50);
        $shipping = $subtotal >= $freeShippingThreshold ? 0 : $shippingCost;
        $taxRate = (float) ($settings['tax_rate'] ?? 20);
        $tax = round($subtotal * $taxRate / 100, 2);

        return Inertia::render('Front/Shop/Cart', array_merge($this->themeAndMenus(), [
            'cartItems' => $cartItems,
            'subtotal' => $subtotal,
            'tax' => $tax,
            'shipping' => $shipping,
            'total' => $subtotal + $tax + $shipping,
            'settings' => $settings,
        ]));
    }

    /**
     * Add an item to the cart.
     */
    public function add(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'variant_id' => 'nullable|exists:product_variants,id',
            'quantity' => 'integer|min:1',
        ]);

        $this->cartService->addItem($validated);

        return redirect()
            ->back()
            ->with('success', 'Produit ajoute au panier.');
    }

    /**
     * Update the quantity of a cart item.
     */
    public function update(Request $request, CartItem $cartItem): RedirectResponse
    {
        $validated = $request->validate([
            'quantity' => 'required|integer|min:1',
        ]);

        $this->cartService->updateQuantity($cartItem, $validated['quantity']);

        return redirect()
            ->back()
            ->with('success', 'Panier mis a jour.');
    }

    /**
     * Remove a cart item.
     */
    public function remove(CartItem $cartItem): RedirectResponse
    {
        $this->cartService->removeItem($cartItem);

        return redirect()
            ->back()
            ->with('success', 'Produit retire du panier.');
    }

    /**
     * API: add item (JSON response for block renderers).
     */
    public function apiAdd(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'variant_id' => 'nullable|exists:product_variants,id',
            'quantity'   => 'integer|min:1',
        ]);

        $this->cartService->addItem($validated);
        $count = $this->cartService->getItems()->sum('quantity');

        return response()->json(['success' => true, 'cart_count' => $count]);
    }

    /**
     * API: get cart count/total (JSON response).
     */
    public function apiGet(): JsonResponse
    {
        $items = $this->cartService->getItems();
        $count = $items->sum('quantity');
        $total = $items->sum(fn ($item) => $item->getTotal());

        return response()->json(['count' => $count, 'total' => round($total, 2)]);
    }

    /**
     * Clear the cart.
     */
    public function clear(): RedirectResponse
    {
        $this->cartService->clear();

        return redirect()
            ->back()
            ->with('success', 'Panier vide.');
    }

    /**
     * Get current e-commerce settings with defaults.
     *
     * @return array<string, mixed>
     */
    private function getSettings(): array
    {
        $defaults = [
            'store_name' => 'Ma Boutique',
            'currency' => 'EUR',
            'currency_symbol' => "\u{20AC}",
            'tax_rate' => 20,
            'shipping_cost' => 5.99,
            'free_shipping_threshold' => 50,
        ];

        $plugin = CmsPlugin::where('slug', 'ecommerce')->first();

        if (!$plugin || empty($plugin->settings)) {
            return $defaults;
        }

        $resolved = [];
        foreach ($plugin->settings as $key => $value) {
            if (is_array($value) && isset($value['default'])) {
                $resolved[$key] = $value['default'];
            } else {
                $resolved[$key] = $value;
            }
        }

        return array_merge($defaults, $resolved);
    }
}
