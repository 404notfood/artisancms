<?php

declare(strict_types=1);

namespace Ecommerce\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\CmsPlugin;
use Ecommerce\Models\PaymentMethod;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EcommerceSettingsController extends Controller
{
    /**
     * Display the e-commerce settings.
     */
    public function index(): Response
    {
        $settings = $this->getSettings();

        $paymentMethods = [];
        try {
            $paymentMethods = PaymentMethod::ordered()->get()->map(fn (PaymentMethod $pm) => [
                'id' => $pm->id,
                'name' => $pm->name,
                'slug' => $pm->slug,
                'driver' => $pm->driver,
                'active' => $pm->active,
                'order' => $pm->order,
                'config' => $pm->config ?? [],
            ])->toArray();
        } catch (\Throwable) {
            // Table may not exist yet
        }

        return Inertia::render('Admin/Ecommerce/Settings', [
            'settings' => $settings,
            'paymentMethods' => $paymentMethods,
        ]);
    }

    /**
     * Update the e-commerce settings.
     */
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'store_name' => 'required|string|max:255',
            'currency' => 'required|string|max:10',
            'currency_symbol' => 'required|string|max:5',
            'tax_rate' => 'required|numeric|min:0|max:100',
            'shipping_cost' => 'required|numeric|min:0',
            'free_shipping_threshold' => 'required|numeric|min:0',
        ]);

        $plugin = CmsPlugin::where('slug', 'ecommerce')->first();

        if ($plugin) {
            $currentSettings = $plugin->settings ?? [];
            $plugin->update([
                'settings' => array_merge($currentSettings, $validated),
            ]);
        }

        return redirect()
            ->back()
            ->with('success', 'Parametres mis a jour avec succes.');
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

        // Filter out schema objects (from artisan-plugin.json) — only merge scalar values
        $flatSettings = [];
        foreach ($plugin->settings as $key => $value) {
            if (is_array($value) && isset($value['default'])) {
                // This is a schema definition, extract the default value
                $flatSettings[$key] = $value['default'];
            } elseif (!is_array($value) && !is_object($value)) {
                $flatSettings[$key] = $value;
            }
        }

        return array_merge($defaults, $flatSettings);
    }
}
