<?php

declare(strict_types=1);

namespace Ecommerce\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\CmsPlugin;
use Ecommerce\Models\Order;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    /**
     * List the authenticated customer's orders.
     */
    public function orders(Request $request): Response
    {
        $orders = Order::where('user_id', auth()->id())
            ->recent()
            ->paginate(10);

        $settings = $this->getSettings();

        return Inertia::render('Front/Shop/Account/Orders', [
            'orders' => $orders,
            'settings' => $settings,
        ]);
    }

    /**
     * Show a single order detail (must belong to the authenticated user).
     */
    public function orderShow(Order $order): Response
    {
        if ($order->user_id !== auth()->id()) {
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
