<?php

declare(strict_types=1);

namespace Ecommerce\Http\Controllers;

use App\Http\Controllers\Controller;
use Ecommerce\Models\Coupon;
use Ecommerce\Services\CouponService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CouponController extends Controller
{
    public function __construct(
        private readonly CouponService $couponService,
    ) {}

    /**
     * Display the list of coupons.
     */
    public function index(): Response
    {
        $coupons = $this->couponService->all();

        return Inertia::render('Admin/Ecommerce/Coupons/Index', [
            'coupons' => $coupons,
        ]);
    }

    /**
     * Show the form for creating a new coupon.
     */
    public function create(): Response
    {
        return Inertia::render('Admin/Ecommerce/Coupons/Create');
    }

    /**
     * Store a newly created coupon.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:coupons,code',
            'type' => 'required|in:percentage,fixed',
            'value' => 'required|numeric|min:0',
            'min_order' => 'nullable|numeric|min:0',
            'max_uses' => 'nullable|integer|min:1',
            'starts_at' => 'nullable|date',
            'expires_at' => 'nullable|date|after_or_equal:starts_at',
            'active' => 'boolean',
        ]);

        $validated['active'] = $validated['active'] ?? true;

        $this->couponService->create($validated);

        return redirect()
            ->route('admin.shop.coupons.index')
            ->with('success', 'Coupon cree avec succes.');
    }

    /**
     * Show the form for editing a coupon.
     */
    public function edit(Coupon $coupon): Response
    {
        return Inertia::render('Admin/Ecommerce/Coupons/Create', [
            'coupon' => $coupon,
        ]);
    }

    /**
     * Update the specified coupon.
     */
    public function update(Request $request, Coupon $coupon): RedirectResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:coupons,code,' . $coupon->id,
            'type' => 'required|in:percentage,fixed',
            'value' => 'required|numeric|min:0',
            'min_order' => 'nullable|numeric|min:0',
            'max_uses' => 'nullable|integer|min:1',
            'starts_at' => 'nullable|date',
            'expires_at' => 'nullable|date|after_or_equal:starts_at',
            'active' => 'boolean',
        ]);

        $this->couponService->update($coupon, $validated);

        return redirect()
            ->route('admin.shop.coupons.index')
            ->with('success', 'Coupon mis a jour avec succes.');
    }

    /**
     * Delete the specified coupon.
     */
    public function destroy(Coupon $coupon): RedirectResponse
    {
        $this->couponService->delete($coupon);

        return redirect()
            ->route('admin.shop.coupons.index')
            ->with('success', 'Coupon supprime avec succes.');
    }
}
