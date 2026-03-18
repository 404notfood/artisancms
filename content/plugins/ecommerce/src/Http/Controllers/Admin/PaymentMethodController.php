<?php

declare(strict_types=1);

namespace Ecommerce\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Ecommerce\Models\PaymentMethod;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PaymentMethodController extends Controller
{
    /**
     * Create a new payment method.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'driver' => 'required|string|in:stripe,paypal,cod,bank_transfer',
            'active' => 'boolean',
            'config' => 'nullable|array',
            'config.stripe_publishable_key' => 'nullable|string|max:255',
            'config.stripe_secret_key' => 'nullable|string|max:255',
            'config.stripe_webhook_secret' => 'nullable|string|max:255',
            'config.paypal_client_id' => 'nullable|string|max:255',
            'config.paypal_secret' => 'nullable|string|max:255',
            'config.paypal_mode' => 'nullable|string|in:sandbox,live',
            'config.bank_name' => 'nullable|string|max:255',
            'config.bank_iban' => 'nullable|string|max:50',
            'config.bank_bic' => 'nullable|string|max:20',
            'config.bank_holder' => 'nullable|string|max:255',
            'config.instructions' => 'nullable|string|max:1000',
        ]);

        $maxOrder = PaymentMethod::max('order') ?? -1;

        PaymentMethod::create([
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']),
            'driver' => $validated['driver'],
            'active' => $validated['active'] ?? true,
            'config' => $validated['config'] ?? [],
            'order' => $maxOrder + 1,
        ]);

        return redirect()
            ->route('admin.shop.settings')
            ->with('success', 'Mode de paiement cree avec succes.');
    }

    /**
     * Update a payment method.
     */
    public function update(Request $request, PaymentMethod $paymentMethod): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'driver' => 'required|string|in:stripe,paypal,cod,bank_transfer',
            'active' => 'boolean',
            'config' => 'nullable|array',
            'config.stripe_publishable_key' => 'nullable|string|max:255',
            'config.stripe_secret_key' => 'nullable|string|max:255',
            'config.stripe_webhook_secret' => 'nullable|string|max:255',
            'config.paypal_client_id' => 'nullable|string|max:255',
            'config.paypal_secret' => 'nullable|string|max:255',
            'config.paypal_mode' => 'nullable|string|in:sandbox,live',
            'config.bank_name' => 'nullable|string|max:255',
            'config.bank_iban' => 'nullable|string|max:50',
            'config.bank_bic' => 'nullable|string|max:20',
            'config.bank_holder' => 'nullable|string|max:255',
            'config.instructions' => 'nullable|string|max:1000',
        ]);

        $paymentMethod->update([
            'name' => $validated['name'],
            'driver' => $validated['driver'],
            'active' => $validated['active'] ?? true,
            'config' => $validated['config'] ?? [],
        ]);

        return redirect()
            ->route('admin.shop.settings')
            ->with('success', 'Mode de paiement mis a jour avec succes.');
    }

    /**
     * Delete a payment method.
     */
    public function destroy(PaymentMethod $paymentMethod): RedirectResponse
    {
        $paymentMethod->delete();

        return redirect()
            ->route('admin.shop.settings')
            ->with('success', 'Mode de paiement supprime avec succes.');
    }

    /**
     * Toggle active state.
     */
    public function toggle(PaymentMethod $paymentMethod): RedirectResponse
    {
        $paymentMethod->update(['active' => !$paymentMethod->active]);

        return redirect()
            ->route('admin.shop.settings')
            ->with('success', 'Statut mis a jour.');
    }
}
