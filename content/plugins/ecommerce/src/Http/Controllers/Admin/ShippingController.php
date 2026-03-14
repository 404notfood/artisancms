<?php

declare(strict_types=1);

namespace Ecommerce\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Ecommerce\Models\ShippingMethod;
use Ecommerce\Models\ShippingZone;
use Ecommerce\Services\ShippingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ShippingController extends Controller
{
    public function __construct(
        private readonly ShippingService $shippingService,
    ) {}

    /**
     * Display shipping zones with their methods.
     */
    public function index(): Response
    {
        $zones = $this->shippingService->getZones();

        return Inertia::render('Admin/Ecommerce/Shipping/Index', [
            'zones' => $zones,
        ]);
    }

    /**
     * Create a new shipping zone.
     */
    public function storeZone(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'countries' => 'required|array|min:1',
            'countries.*' => 'string|size:2',
            'is_default' => 'boolean',
        ]);

        $validated['is_default'] = $validated['is_default'] ?? false;

        $this->shippingService->createZone($validated);

        return redirect()
            ->route('admin.shop.shipping.index')
            ->with('success', 'Zone de livraison creee avec succes.');
    }

    /**
     * Update an existing shipping zone.
     */
    public function updateZone(Request $request, ShippingZone $shippingZone): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'countries' => 'required|array|min:1',
            'countries.*' => 'string|size:2',
            'is_default' => 'boolean',
        ]);

        $this->shippingService->updateZone($shippingZone, $validated);

        return redirect()
            ->route('admin.shop.shipping.index')
            ->with('success', 'Zone de livraison mise a jour avec succes.');
    }

    /**
     * Delete a shipping zone and its methods.
     */
    public function destroyZone(ShippingZone $shippingZone): RedirectResponse
    {
        $this->shippingService->deleteZone($shippingZone);

        return redirect()
            ->route('admin.shop.shipping.index')
            ->with('success', 'Zone de livraison supprimee avec succes.');
    }

    /**
     * Create a new shipping method for a zone.
     */
    public function storeMethod(Request $request, ShippingZone $shippingZone): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:flat,free,weight_based,price_based',
            'cost' => 'required|numeric|min:0',
            'min_order_amount' => 'nullable|numeric|min:0',
            'min_weight' => 'nullable|numeric|min:0',
            'max_weight' => 'nullable|numeric|min:0',
            'active' => 'boolean',
            'order' => 'integer|min:0',
        ]);

        $validated['active'] = $validated['active'] ?? true;
        $validated['order'] = $validated['order'] ?? 0;

        $this->shippingService->createMethod($shippingZone, $validated);

        return redirect()
            ->route('admin.shop.shipping.index')
            ->with('success', 'Methode de livraison creee avec succes.');
    }

    /**
     * Update an existing shipping method.
     */
    public function updateMethod(Request $request, ShippingMethod $shippingMethod): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:flat,free,weight_based,price_based',
            'cost' => 'required|numeric|min:0',
            'min_order_amount' => 'nullable|numeric|min:0',
            'min_weight' => 'nullable|numeric|min:0',
            'max_weight' => 'nullable|numeric|min:0',
            'active' => 'boolean',
            'order' => 'integer|min:0',
        ]);

        $this->shippingService->updateMethod($shippingMethod, $validated);

        return redirect()
            ->route('admin.shop.shipping.index')
            ->with('success', 'Methode de livraison mise a jour avec succes.');
    }

    /**
     * Delete a shipping method.
     */
    public function destroyMethod(ShippingMethod $shippingMethod): RedirectResponse
    {
        $this->shippingService->deleteMethod($shippingMethod);

        return redirect()
            ->route('admin.shop.shipping.index')
            ->with('success', 'Methode de livraison supprimee avec succes.');
    }
}
