<?php

declare(strict_types=1);

namespace Ecommerce\Http\Controllers;

use App\Http\Controllers\Controller;
use Ecommerce\Http\Controllers\Concerns\HasEcommerceSettings;
use Ecommerce\Http\Controllers\Concerns\HasThemeAndMenus;
use Ecommerce\Models\Order;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Legacy customer controller kept for backward compatibility.
 * Prefer using CustomerAccountController for new features.
 */
class CustomerController extends Controller
{
    use HasEcommerceSettings;
    use HasThemeAndMenus;

    public function orders(): Response
    {
        $orders = Order::where('user_id', auth()->id())
            ->recent()
            ->paginate(10);

        return Inertia::render('Front/Shop/Account/Orders', array_merge($this->themeAndMenus(), [
            'orders' => $orders,
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

    private function authorizeOrder(Order $order): void
    {
        if ($order->user_id !== auth()->id()) {
            abort(403);
        }
    }
}
