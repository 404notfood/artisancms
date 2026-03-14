<?php

declare(strict_types=1);

namespace Seo\Http\Controllers;

use App\Models\CmsPlugin;
use Illuminate\Http\Response;
use Illuminate\Routing\Controller;

class RobotsController extends Controller
{
    /**
     * Return the robots.txt content from plugin settings.
     */
    public function index(): Response
    {
        $content = $this->getRobotsTxtContent();

        // Append sitemap URL if sitemap generation is enabled
        if ($this->isSitemapEnabled()) {
            $sitemapUrl = rtrim(config('app.url', 'http://localhost'), '/') . '/sitemap.xml';
            $content .= "\n\nSitemap: " . $sitemapUrl;
        }

        return response($content, 200, [
            'Content-Type' => 'text/plain; charset=utf-8',
        ]);
    }

    /**
     * Get the robots.txt content from plugin settings.
     */
    private function getRobotsTxtContent(): string
    {
        $plugin = CmsPlugin::where('slug', 'seo')->first();

        if ($plugin === null) {
            return $this->getDefaultContent();
        }

        $settings = $plugin->settings;

        if (!is_array($settings)) {
            return $this->getDefaultContent();
        }

        if (isset($settings['robots_txt']['value'])) {
            return (string) $settings['robots_txt']['value'];
        }

        if (isset($settings['robots_txt']['default'])) {
            return (string) $settings['robots_txt']['default'];
        }

        return $this->getDefaultContent();
    }

    /**
     * Check if sitemap generation is enabled.
     */
    private function isSitemapEnabled(): bool
    {
        $plugin = CmsPlugin::where('slug', 'seo')->first();

        if ($plugin === null) {
            return true;
        }

        $settings = $plugin->settings;

        if (!is_array($settings)) {
            return true;
        }

        return (bool) ($settings['generate_sitemap']['value'] ?? $settings['generate_sitemap']['default'] ?? true);
    }

    /**
     * Get the default robots.txt content.
     */
    private function getDefaultContent(): string
    {
        return "User-agent: *\nAllow: /";
    }
}
