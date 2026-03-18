<?php

declare(strict_types=1);

namespace Ecommerce\Http\Controllers\Concerns;

use App\Models\CmsPlugin;

trait HasEcommerceSettings
{
    protected function getSettings(): array
    {
        static $cached = null;

        if ($cached !== null) {
            return $cached;
        }

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
            return $cached = $defaults;
        }

        $resolved = [];
        foreach ($plugin->settings as $key => $value) {
            $resolved[$key] = is_array($value) && isset($value['default']) ? $value['default'] : $value;
        }

        return $cached = array_merge($defaults, $resolved);
    }
}
