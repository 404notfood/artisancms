<?php

declare(strict_types=1);

namespace App\CMS\Traits;

use App\Models\CmsPlugin;

/**
 * Provides a convenient method to read plugin settings from the CMS plugin record.
 * Used by plugins that store their configuration in the `cms_plugins.settings` JSON column.
 *
 * Requires the using class to define a `pluginSlug()` method returning the plugin slug.
 */
trait ReadsPluginSettings
{
    /**
     * Return the plugin slug (e.g. 'seo', 'contact-form').
     */
    abstract protected function pluginSlug(): string;

    /**
     * Retrieve a single setting value from the plugin record.
     * Handles both direct values and schema objects with 'default'/'value' keys.
     */
    protected function getPluginSetting(string $key, mixed $default = null): mixed
    {
        $plugin = CmsPlugin::where('slug', $this->pluginSlug())->first();

        if ($plugin === null) {
            return $default;
        }

        $settings = $plugin->settings;

        if (!is_array($settings)) {
            return $default;
        }

        // Schema object with explicit 'value' key
        if (isset($settings[$key]['value'])) {
            return $settings[$key]['value'];
        }

        // Schema object with 'default' key
        if (isset($settings[$key]['default'])) {
            return $settings[$key]['default'];
        }

        return $settings[$key] ?? $default;
    }
}
