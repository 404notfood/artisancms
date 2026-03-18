<?php

declare(strict_types=1);

namespace Ecommerce\Http\Controllers;

use App\CMS\Facades\CMS;
use App\Http\Controllers\Controller;
use App\Models\CmsPlugin;
use Ecommerce\Models\Coupon;
use Ecommerce\Models\Order;
use Ecommerce\Models\OrderItem;
use Ecommerce\Services\CartService;
use Ecommerce\Services\CouponService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CheckoutController extends Controller
{
    public function __construct(
        private readonly CartService $cartService,
        private readonly CouponService $couponService,
    ) {}

    /**
     * Show the checkout form.
     */
    public function index(Request $request): Response
    {
        $items = $this->cartService->getItems();

        if ($items->isEmpty()) {
            return Inertia::render('Front/Shop/Checkout', [
                'cartItems' => [],
                'subtotal' => 0,
                'tax' => 0,
                'shipping' => 0,
                'discount' => 0,
                'total' => 0,
                'settings' => $this->getSettings(),
                'coupon' => null,
            ]);
        }

        $settings = $this->getSettings();

        $subtotal = $items->sum(fn ($item) => $item->getTotal());
        $taxRate = (float) ($settings['tax_rate'] ?? 20);
        $tax = round($subtotal * $taxRate / 100, 2);
        $shippingCost = (float) ($settings['shipping_cost'] ?? 5.99);
        $freeShippingThreshold = (float) ($settings['free_shipping_threshold'] ?? 50);
        $shipping = $subtotal >= $freeShippingThreshold ? 0 : $shippingCost;

        // Check for coupon in session
        $discount = 0;
        $couponData = null;
        $couponCode = $request->session()->get('coupon_code');
        if ($couponCode) {
            $coupon = $this->couponService->findByCode($couponCode);
            if ($coupon && $coupon->isUsable()) {
                if ($coupon->min_order === null || $subtotal >= (float) $coupon->min_order) {
                    $discount = $coupon->type === 'percentage'
                        ? round($subtotal * (float) $coupon->value / 100, 2)
                        : min((float) $coupon->value, $subtotal);
                    $couponData = [
                        'code' => $coupon->code,
                        'type' => $coupon->type,
                        'value' => $coupon->value,
                    ];
                }
            }
        }

        $total = max(0, $subtotal + $tax + $shipping - $discount);

        $cartItems = $items->map(function ($item) {
            return [
                'id' => $item->id,
                'product_id' => $item->product_id,
                'variant_id' => $item->variant_id,
                'name' => $item->product->name,
                'variant_name' => $item->variant?->name,
                'price' => $item->getPrice(),
                'quantity' => $item->quantity,
                'total' => $item->getTotal(),
                'featured_image' => $item->product->featured_image,
            ];
        });

        return Inertia::render('Front/Shop/Checkout', [
            'cartItems' => $cartItems,
            'subtotal' => $subtotal,
            'tax' => $tax,
            'shipping' => $shipping,
            'discount' => $discount,
            'total' => $total,
            'settings' => $settings,
            'coupon' => $couponData,
        ]);
    }

    /**
     * Process the checkout and create an order.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'shipping_address.first_name' => 'required|string|max:255',
            'shipping_address.last_name' => 'required|string|max:255',
            'shipping_address.address' => 'required|string|max:500',
            'shipping_address.address2' => 'nullable|string|max:500',
            'shipping_address.city' => 'required|string|max:255',
            'shipping_address.postal_code' => 'required|string|max:20',
            'shipping_address.country' => 'required|string|max:255',
            'shipping_address.phone' => 'nullable|string|max:30',
            'billing_same_as_shipping' => 'boolean',
            'billing_address.first_name' => 'required_if:billing_same_as_shipping,false|nullable|string|max:255',
            'billing_address.last_name' => 'required_if:billing_same_as_shipping,false|nullable|string|max:255',
            'billing_address.address' => 'required_if:billing_same_as_shipping,false|nullable|string|max:500',
            'billing_address.address2' => 'nullable|string|max:500',
            'billing_address.city' => 'required_if:billing_same_as_shipping,false|nullable|string|max:255',
            'billing_address.postal_code' => 'required_if:billing_same_as_shipping,false|nullable|string|max:20',
            'billing_address.country' => 'required_if:billing_same_as_shipping,false|nullable|string|max:255',
            'billing_address.phone' => 'nullable|string|max:30',
            'payment_method' => 'required|string|in:cod,card',
            'notes' => 'nullable|string|max:1000',
        ]);

        $items = $this->cartService->getItems();

        if ($items->isEmpty()) {
            return redirect()
                ->route('shop.cart')
                ->with('error', 'Votre panier est vide.');
        }

        $settings = $this->getSettings();

        $subtotal = $items->sum(fn ($item) => $item->getTotal());
        $taxRate = (float) ($settings['tax_rate'] ?? 20);
        $tax = round($subtotal * $taxRate / 100, 2);
        $shippingCost = (float) ($settings['shipping_cost'] ?? 5.99);
        $freeShippingThreshold = (float) ($settings['free_shipping_threshold'] ?? 50);
        $shipping = $subtotal >= $freeShippingThreshold ? 0 : $shippingCost;

        // Apply coupon discount
        $discount = 0;
        $couponCode = $request->session()->get('coupon_code');
        if ($couponCode) {
            $coupon = $this->couponService->findByCode($couponCode);
            if ($coupon && $coupon->isUsable()) {
                if ($coupon->min_order === null || $subtotal >= (float) $coupon->min_order) {
                    $discount = $coupon->type === 'percentage'
                        ? round($subtotal * (float) $coupon->value / 100, 2)
                        : min((float) $coupon->value, $subtotal);

                    // Increment coupon usage
                    $coupon->increment('used_count');
                }
            }
        }

        $total = max(0, $subtotal + $tax + $shipping - $discount);
        $total = (float) CMS::applyFilter('ecommerce.checkout.total', $total, $subtotal, $tax, $shipping, $discount);

        $shippingAddress = $validated['shipping_address'];
        $billingAddress = !empty($validated['billing_same_as_shipping'])
            ? $shippingAddress
            : ($validated['billing_address'] ?? $shippingAddress);

        // Create the order
        $order = Order::create([
            'user_id' => auth()->id(),
            'status' => 'pending',
            'subtotal' => $subtotal,
            'tax' => $tax,
            'shipping' => $shipping,
            'total' => $total,
            'payment_method' => $validated['payment_method'],
            'payment_status' => 'pending',
            'shipping_address' => $shippingAddress,
            'billing_address' => $billingAddress,
            'notes' => $validated['notes'] ?? null,
        ]);

        // Create order items
        foreach ($items as $item) {
            OrderItem::create([
                'order_id' => $order->id,
                'product_id' => $item->product_id,
                'variant_id' => $item->variant_id,
                'name' => $item->product->name . ($item->variant ? ' - ' . $item->variant->name : ''),
                'price' => $item->getPrice(),
                'quantity' => $item->quantity,
                'total' => $item->getTotal(),
            ]);

            // Decrease stock
            if ($item->variant) {
                $item->variant->decrement('stock', $item->quantity);
            } else {
                $item->product->decrement('stock', $item->quantity);
            }
        }

        // Clear cart and coupon session
        $this->cartService->clear();
        $request->session()->forget('coupon_code');

        CMS::fire('ecommerce.order.created', $order);

        return redirect()
            ->route('shop.checkout.confirmation', $order)
            ->with('success', 'Votre commande a ete enregistree avec succes.');
    }

    /**
     * Show the order confirmation page.
     */
    public function confirmation(Order $order): Response
    {
        // Ensure the order belongs to the authenticated user
        if ($order->user_id !== auth()->id()) {
            abort(403);
        }

        $order->load('items');

        $settings = $this->getSettings();

        return Inertia::render('Front/Shop/Confirmation', [
            'order' => $order,
            'settings' => $settings,
        ]);
    }

    /**
     * Apply a coupon code and return the discount as JSON.
     */
    public function applyCoupon(Request $request): JsonResponse
    {
        $request->validate([
            'code' => 'required|string|max:50',
            'subtotal' => 'required|numeric|min:0',
        ]);

        $coupon = $this->couponService->findByCode($request->input('code'));

        if (!$coupon || !$coupon->isUsable()) {
            return response()->json([
                'success' => false,
                'message' => 'Ce code promo n\'est pas valide ou a expire.',
            ], 422);
        }

        $subtotal = (float) $request->input('subtotal');

        if ($coupon->min_order !== null && $subtotal < (float) $coupon->min_order) {
            return response()->json([
                'success' => false,
                'message' => 'Le montant minimum de commande pour ce code promo est de ' . number_format((float) $coupon->min_order, 2, ',', ' ') . ' €.',
            ], 422);
        }

        $discount = $coupon->type === 'percentage'
            ? round($subtotal * (float) $coupon->value / 100, 2)
            : min((float) $coupon->value, $subtotal);

        // Store coupon in session
        $request->session()->put('coupon_code', $coupon->code);

        return response()->json([
            'success' => true,
            'discount' => $discount,
            'coupon' => [
                'code' => $coupon->code,
                'type' => $coupon->type,
                'value' => $coupon->value,
            ],
            'message' => 'Code promo applique avec succes !',
        ]);
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

        return array_merge($defaults, $plugin->settings);
    }
}
