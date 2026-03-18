<?php

declare(strict_types=1);

namespace Ecommerce\Http\Controllers;

use App\Http\Controllers\Controller;
use Ecommerce\Http\Controllers\Concerns\HasEcommerceSettings;
use Ecommerce\Http\Controllers\Concerns\HasThemeAndMenus;
use Ecommerce\Models\Order;
use Ecommerce\Services\CartService;
use Ecommerce\Services\CouponService;
use Ecommerce\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CheckoutController extends Controller
{
    use HasEcommerceSettings;
    use HasThemeAndMenus;

    public function __construct(
        private readonly CartService $cartService,
        private readonly OrderService $orderService,
        private readonly CouponService $couponService,
    ) {}

    public function index(Request $request): Response
    {
        $items = $this->cartService->getItems();
        $settings = $this->getSettings();

        if ($items->isEmpty()) {
            return $this->renderCheckout([], $settings);
        }

        $couponCode = $request->session()->get('coupon_code');
        $totals = $this->orderService->calculateTotals($items, $settings, $couponCode);

        $couponData = $totals['coupon'] ? [
            'code' => $totals['coupon']->code,
            'type' => $totals['coupon']->type,
            'value' => $totals['coupon']->value,
        ] : null;

        $cartItems = $items->map(fn ($item) => [
            'id' => $item->id,
            'product_id' => $item->product_id,
            'variant_id' => $item->variant_id,
            'name' => $item->product->name,
            'variant_name' => $item->variant?->name,
            'price' => $item->getPrice(),
            'quantity' => $item->quantity,
            'total' => $item->getTotal(),
            'featured_image' => $item->product->featured_image,
        ]);

        return Inertia::render('Front/Shop/Checkout', array_merge($this->themeAndMenus(), [
            'cartItems' => $cartItems,
            'subtotal' => $totals['subtotal'],
            'tax' => $totals['tax'],
            'shipping' => $totals['shipping'],
            'discount' => $totals['discount'],
            'total' => $totals['total'],
            'settings' => $settings,
            'coupon' => $couponData,
        ]));
    }

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
            return redirect()->route('shop.cart')->with('error', 'Votre panier est vide.');
        }

        $stockError = $this->orderService->checkStock($items);
        if ($stockError) {
            return redirect()->route('shop.cart')->with('error', $stockError);
        }

        $settings = $this->getSettings();
        $couponCode = $request->session()->get('coupon_code');
        $totals = $this->orderService->calculateTotals($items, $settings, $couponCode);

        $order = $this->orderService->createFromCart($validated, $items, $totals);

        $request->session()->forget('coupon_code');

        return redirect()
            ->route('shop.checkout.confirmation', $order)
            ->with('success', 'Votre commande a ete enregistree avec succes.');
    }

    public function confirmation(Order $order): Response
    {
        $this->authorizeOrder($order);

        $order->load('items');

        return Inertia::render('Front/Shop/Confirmation', array_merge($this->themeAndMenus(), [
            'order' => $order,
            'settings' => $this->getSettings(),
        ]));
    }

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
        $discount = $this->orderService->calculateCouponDiscount($coupon, $subtotal);

        if ($discount === 0.0 && $coupon->min_order !== null) {
            return response()->json([
                'success' => false,
                'message' => 'Le montant minimum de commande pour ce code promo est de '
                    . number_format((float) $coupon->min_order, 2, ',', ' ') . ' EUR.',
            ], 422);
        }

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

    private function renderCheckout(array $cartItems, array $settings): Response
    {
        return Inertia::render('Front/Shop/Checkout', array_merge($this->themeAndMenus(), [
            'cartItems' => $cartItems,
            'subtotal' => 0,
            'tax' => 0,
            'shipping' => 0,
            'discount' => 0,
            'total' => 0,
            'settings' => $settings,
            'coupon' => null,
        ]));
    }

    private function authorizeOrder(Order $order): void
    {
        if ($order->user_id !== auth()->id()) {
            abort(403);
        }
    }
}
