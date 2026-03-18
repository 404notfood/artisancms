<?php

declare(strict_types=1);

namespace Ecommerce\Http\Controllers;

use App\Http\Controllers\Controller;
use Ecommerce\Http\Controllers\Concerns\HasEcommerceSettings;
use Ecommerce\Http\Controllers\Concerns\HasThemeAndMenus;
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
    use HasEcommerceSettings;
    use HasThemeAndMenus;

    public function __construct(
        private readonly CustomerService $customerService,
        private readonly WishlistService $wishlistService,
    ) {}

    public function dashboard(): Response
    {
        $userId = $this->userId();

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

        return Inertia::render('Front/Shop/Account/Dashboard', array_merge($this->themeAndMenus(), [
            'recentOrders' => $recentOrders,
            'stats' => [
                'total_orders' => $totalOrders,
                'total_spent' => $totalSpent,
                'pending_orders' => $pendingOrders,
                'wishlist_count' => $this->wishlistService->count($userId),
            ],
            'settings' => $this->getSettings(),
        ]));
    }

    public function addresses(): Response
    {
        return Inertia::render('Front/Shop/Account/Addresses', array_merge($this->themeAndMenus(), [
            'addresses' => $this->customerService->getAddresses($this->userId()),
            'settings' => $this->getSettings(),
        ]));
    }

    public function storeAddress(Request $request): RedirectResponse
    {
        $validated = $request->validate($this->addressRules());

        $this->customerService->createAddress($this->userId(), $validated);

        return redirect()
            ->route('shop.account.addresses')
            ->with('success', 'Adresse ajoutee avec succes.');
    }

    public function updateAddress(Request $request, CustomerAddress $address): RedirectResponse
    {
        $this->authorizeAddress($address);

        $validated = $request->validate($this->addressRules());

        $this->customerService->updateAddress($address, $validated);

        return redirect()
            ->route('shop.account.addresses')
            ->with('success', 'Adresse mise a jour avec succes.');
    }

    public function destroyAddress(CustomerAddress $address): RedirectResponse
    {
        $this->authorizeAddress($address);

        $this->customerService->deleteAddress($address);

        return redirect()
            ->route('shop.account.addresses')
            ->with('success', 'Adresse supprimee avec succes.');
    }

    public function orders(Request $request): Response
    {
        $filters = $request->only(['status', 'per_page']);

        return Inertia::render('Front/Shop/Account/Orders', array_merge($this->themeAndMenus(), [
            'orders' => $this->customerService->getOrderHistory($this->userId(), $filters),
            'filters' => $filters,
            'settings' => $this->getSettings(),
        ]));
    }

    public function orderShow(Order $order): Response
    {
        $this->authorizeOrder($order);

        $order->load('items');

        return Inertia::render('Front/Shop/Account/OrderShow', array_merge($this->themeAndMenus(), [
            'order' => $order,
            'settings' => $this->getSettings(),
        ]));
    }

    private function userId(): int
    {
        return (int) auth()->id();
    }

    private function authorizeAddress(CustomerAddress $address): void
    {
        if ($address->user_id !== $this->userId()) {
            abort(403);
        }
    }

    private function authorizeOrder(Order $order): void
    {
        if ($order->user_id !== $this->userId()) {
            abort(403);
        }
    }

    private function addressRules(): array
    {
        return [
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
        ];
    }
}
