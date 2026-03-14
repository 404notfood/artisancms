<?php

declare(strict_types=1);

namespace Ecommerce\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\CmsPlugin;
use Ecommerce\Models\CustomerAddress;
use Ecommerce\Models\Order;
use Ecommerce\Services\CustomerService;
use Ecommerce\Services\WishlistService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomerAccountController extends Controller
{
    public function __construct(
        private readonly CustomerService $customerService,
        private readonly WishlistService $wishlistService,
    ) {}

    /**
     * Customer dashboard with recent orders and stats.
     */
    public function dashboard(Request $request): Response
    {
        /** @var int $userId */
        $userId = (int) auth()->id();

        $recentOrders = Order::where('user_id', $userId)
            ->with('items')
            ->recent()
            ->limit(5)
            ->get();

        $totalOrders = Order::where('user_id', $userId)->count();
        $totalSpent = (float) Order::where('user_id', $userId)
            ->where('payment_status', 'paid')
            ->sum('total');
        $pendingOrders = Order::where('user_id', $userId)
            ->whereIn('status', ['pending', 'processing'])
            ->count();
        $wishlistCount = $this->wishlistService->count($userId);

        $settings = $this->getSettings();

        return Inertia::render('Front/Shop/Account/Dashboard', [
            'recentOrders' => $recentOrders,
            'stats' => [
                'total_orders' => $totalOrders,
                'total_spent' => $totalSpent,
                'pending_orders' => $pendingOrders,
                'wishlist_count' => $wishlistCount,
            ],
            'settings' => $settings,
        ]);
    }

    /**
     * List saved addresses.
     */
    public function addresses(): Response
    {
        /** @var int $userId */
        $userId = (int) auth()->id();

        $addresses = $this->customerService->getAddresses($userId);
        $settings = $this->getSettings();

        return Inertia::render('Front/Shop/Account/Addresses', [
            'addresses' => $addresses,
            'settings' => $settings,
        ]);
    }

    /**
     * Store a new address.
     */
    public function storeAddress(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'label' => 'required|string|max:100',
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'address' => 'required|string|max:255',
            'address2' => 'nullable|string|max:255',
            'city' => 'required|string|max:100',
            'postal_code' => 'required|string|max:20',
            'country' => 'required|string|max:2',
            'phone' => 'nullable|string|max:30',
            'is_default_shipping' => 'boolean',
            'is_default_billing' => 'boolean',
        ]);

        /** @var int $userId */
        $userId = (int) auth()->id();

        $this->customerService->createAddress($userId, $validated);

        return redirect()
            ->route('shop.account.addresses')
            ->with('success', 'Adresse ajoutee avec succes.');
    }

    /**
     * Update an existing address.
     */
    public function updateAddress(Request $request, CustomerAddress $customerAddress): RedirectResponse
    {
        if ($customerAddress->user_id !== (int) auth()->id()) {
            abort(403);
        }

        $validated = $request->validate([
            'label' => 'required|string|max:100',
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'address' => 'required|string|max:255',
            'address2' => 'nullable|string|max:255',
            'city' => 'required|string|max:100',
            'postal_code' => 'required|string|max:20',
            'country' => 'required|string|max:2',
            'phone' => 'nullable|string|max:30',
            'is_default_shipping' => 'boolean',
            'is_default_billing' => 'boolean',
        ]);

        $this->customerService->updateAddress($customerAddress, $validated);

        return redirect()
            ->route('shop.account.addresses')
            ->with('success', 'Adresse mise a jour avec succes.');
    }

    /**
     * Delete an address.
     */
    public function destroyAddress(CustomerAddress $customerAddress): RedirectResponse
    {
        if ($customerAddress->user_id !== (int) auth()->id()) {
            abort(403);
        }

        $this->customerService->deleteAddress($customerAddress);

        return redirect()
            ->route('shop.account.addresses')
            ->with('success', 'Adresse supprimee avec succes.');
    }

    /**
     * Order history listing.
     */
    public function orders(Request $request): Response
    {
        /** @var int $userId */
        $userId = (int) auth()->id();

        $filters = $request->only(['status', 'per_page']);
        $orders = $this->customerService->getOrderHistory($userId, $filters);

        $settings = $this->getSettings();

        return Inertia::render('Front/Shop/Account/Orders', [
            'orders' => $orders,
            'filters' => $filters,
            'settings' => $settings,
        ]);
    }

    /**
     * Order detail (verify ownership).
     */
    public function orderShow(Order $order): Response
    {
        if ($order->user_id !== (int) auth()->id()) {
            abort(403);
        }

        $order->load('items');

        $settings = $this->getSettings();

        return Inertia::render('Front/Shop/Account/OrderShow', [
            'order' => $order,
            'settings' => $settings,
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
