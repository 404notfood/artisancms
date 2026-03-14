<?php

declare(strict_types=1);

namespace Seo;

use App\CMS\Facades\CMS;
use Illuminate\Support\ServiceProvider;

class SeoServiceProvider extends ServiceProvider
{
    /**
     * Register any plugin services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap the SEO plugin.
     */
    public function boot(): void
    {
        $this->loadRoutesFrom(__DIR__ . '/../routes/web.php');

        $this->registerMetaTagsFilter();
        $this->registerJsonLdHook();
    }

    /**
     * Register the filter that enriches page head meta tags.
     */
    private function registerMetaTagsFilter(): void
    {
        CMS::filter('page.head', function (array $meta, mixed $page): array {
            $separator = $this->getPluginSetting('site_title_separator', ' | ');
            $siteName = config('app.name', 'ArtisanCMS');
            $defaultDescription = $this->getPluginSetting('default_meta_description', '');

            $metaTitle = $page->meta_title ?? $page->title ?? '';
            $metaDescription = $page->meta_description ?? $defaultDescription;

            return array_merge($meta, [
                'title' => $metaTitle . $separator . $siteName,
                'meta_description' => $metaDescription,
                'og_title' => $metaTitle,
                'og_description' => $metaDescription,
                'og_image' => $page->og_image ?? '',
                'og_type' => 'website',
                'og_site_name' => $siteName,
                'canonical' => url($page->slug ?? ''),
            ]);
        }, 10);
    }

    /**
     * Register the hook that injects JSON-LD structured data.
     */
    private function registerJsonLdHook(): void
    {
        CMS::hook('page.rendered', function (mixed $page): void {
            $jsonLd = [
                '@context' => 'https://schema.org',
                '@type' => 'WebPage',
                'name' => $page->meta_title ?? $page->title ?? '',
                'description' => $page->meta_description ?? '',
                'url' => url($page->slug ?? ''),
            ];

            if (!empty($page->og_image)) {
                $jsonLd['image'] = $page->og_image;
            }

            if (!empty($page->published_at)) {
                $jsonLd['datePublished'] = $page->published_at->toIso8601String();
            }

            if (!empty($page->updated_at)) {
                $jsonLd['dateModified'] = $page->updated_at->toIso8601String();
            }

            // Share the JSON-LD data so the front-end can inject it into <head>
            CMS::fire('seo.jsonld', $jsonLd);
        }, 10);
    }

    /**
     * Retrieve a plugin setting value from the CMS plugin record.
     */
    private function getPluginSetting(string $key, mixed $default = null): mixed
    {
        $plugin = \App\Models\CmsPlugin::where('slug', 'seo')->first();

        if ($plugin === null) {
            return $default;
        }

        $settings = $plugin->settings;

        if (!is_array($settings)) {
            return $default;
        }

        // Settings may store the schema (with 'default') or direct values
        if (isset($settings[$key]['default'])) {
            return $settings[$key]['value'] ?? $settings[$key]['default'] ?? $default;
        }

        return $settings[$key] ?? $default;
    }
}
