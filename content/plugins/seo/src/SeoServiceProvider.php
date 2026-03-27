<?php

declare(strict_types=1);

namespace Seo;

use App\CMS\Facades\CMS;
use App\CMS\Traits\ReadsPluginSettings;
use App\Models\Post;
use Illuminate\Support\ServiceProvider;

class SeoServiceProvider extends ServiceProvider
{
    use ReadsPluginSettings;

    protected function pluginSlug(): string
    {
        return 'seo';
    }

    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        $this->loadRoutesFrom(__DIR__ . '/../routes/web.php');

        $this->registerMetaTagsFilter();
        $this->registerJsonLdHook();
    }

    /**
     * Enrich page/post head meta tags with SEO data.
     * Passes a complete seo array to the frontend for rendering.
     */
    private function registerMetaTagsFilter(): void
    {
        CMS::filter('page.head', function (array $meta, mixed $page): array {
            $separator = $this->getPluginSetting('site_title_separator', ' | ');
            $siteName = config('app.name', 'ArtisanCMS');
            $defaultDescription = $this->getPluginSetting('default_meta_description', '');
            $defaultOgImage = $this->getPluginSetting('default_og_image', '');
            $twitterHandle = $this->getPluginSetting('social_twitter_handle', '');
            $googleVerification = $this->getPluginSetting('google_site_verification', '');
            $bingVerification = $this->getPluginSetting('bing_site_verification', '');

            $isPost = $page instanceof Post;
            $title = $page->meta_title ?? $page->title ?? '';
            $description = $page->meta_description ?? ($isPost ? ($page->excerpt ?? '') : '') ?: $defaultDescription;
            $ogImage = $page->og_image ?? ($isPost ? $page->featured_image : null) ?? $defaultOgImage;
            $canonicalUrl = $page->canonical_url ?? $this->buildCanonicalUrl($page, $isPost);
            $metaRobots = $page->meta_robots ?? 'index, follow';
            $focusKeyword = $page->focus_keyword ?? '';

            return array_merge($meta, [
                // Basic meta
                'title' => $title . $separator . $siteName,
                'meta_title_raw' => $title,
                'meta_description' => $description,
                'meta_robots' => $metaRobots,
                'canonical' => $canonicalUrl,
                'focus_keyword' => $focusKeyword,

                // Open Graph
                'og_title' => $title,
                'og_description' => $description,
                'og_image' => $ogImage ? url($ogImage) : '',
                'og_type' => $isPost ? 'article' : 'website',
                'og_site_name' => $siteName,
                'og_url' => $canonicalUrl,
                'og_locale' => app()->getLocale() . '_' . strtoupper(app()->getLocale()),

                // Twitter Cards
                'twitter_card' => $ogImage ? 'summary_large_image' : 'summary',
                'twitter_title' => $title,
                'twitter_description' => $description,
                'twitter_image' => $ogImage ? url($ogImage) : '',
                'twitter_site' => $twitterHandle,

                // Article specific (for posts)
                'article_published_time' => $isPost && $page->published_at ? $page->published_at->toIso8601String() : '',
                'article_modified_time' => $page->updated_at ? $page->updated_at->toIso8601String() : '',
                'article_author' => $isPost && $page->relationLoaded('author') && $page->author ? $page->author->name : '',

                // Site verification
                'google_site_verification' => $googleVerification,
                'bing_site_verification' => $bingVerification,
            ]);
        }, 10);
    }

    /**
     * Build JSON-LD structured data and pass it to the frontend via the seo array.
     */
    private function registerJsonLdHook(): void
    {
        CMS::filter('page.head', function (array $meta, mixed $page): array {
            $isPost = $page instanceof Post;
            $siteName = config('app.name', 'ArtisanCMS');
            $orgName = $this->getPluginSetting('organization_name', '') ?: $siteName;
            $orgLogo = $this->getPluginSetting('organization_logo', '');
            $baseUrl = rtrim(config('app.url', 'http://localhost'), '/');

            $jsonLd = [];

            // 1. Organization schema
            $organization = [
                '@type' => 'Organization',
                'name' => $orgName,
                'url' => $baseUrl,
            ];
            if ($orgLogo) {
                $organization['logo'] = [
                    '@type' => 'ImageObject',
                    'url' => url($orgLogo),
                ];
            }
            $socialFb = $this->getPluginSetting('social_facebook_url', '');
            $socialTw = $this->getPluginSetting('social_twitter_handle', '');
            $sameAs = array_filter([$socialFb, $socialTw ? "https://x.com/{$socialTw}" : '']);
            if ($sameAs) {
                $organization['sameAs'] = array_values($sameAs);
            }

            // 2. WebSite schema (with SearchAction)
            $jsonLd[] = [
                '@context' => 'https://schema.org',
                '@type' => 'WebSite',
                'name' => $siteName,
                'url' => $baseUrl,
                'publisher' => $organization,
                'potentialAction' => [
                    '@type' => 'SearchAction',
                    'target' => [
                        '@type' => 'EntryPoint',
                        'urlTemplate' => $baseUrl . '/search?q={search_term_string}',
                    ],
                    'query-input' => 'required name=search_term_string',
                ],
            ];

            // 3. Article or WebPage schema
            if ($isPost) {
                $article = [
                    '@context' => 'https://schema.org',
                    '@type' => 'Article',
                    'headline' => $page->meta_title ?? $page->title ?? '',
                    'description' => $page->meta_description ?? $page->excerpt ?? '',
                    'url' => $this->buildCanonicalUrl($page, true),
                    'mainEntityOfPage' => [
                        '@type' => 'WebPage',
                        '@id' => $this->buildCanonicalUrl($page, true),
                    ],
                    'publisher' => $organization,
                ];

                if ($page->og_image || $page->featured_image) {
                    $article['image'] = url($page->og_image ?? $page->featured_image);
                }
                if ($page->published_at) {
                    $article['datePublished'] = $page->published_at->toIso8601String();
                }
                if ($page->updated_at) {
                    $article['dateModified'] = $page->updated_at->toIso8601String();
                }
                if ($page->relationLoaded('author') && $page->author) {
                    $article['author'] = [
                        '@type' => 'Person',
                        'name' => $page->author->name,
                    ];
                }

                $jsonLd[] = $article;
            } else {
                $webPage = [
                    '@context' => 'https://schema.org',
                    '@type' => 'WebPage',
                    'name' => $page->meta_title ?? $page->title ?? '',
                    'description' => $page->meta_description ?? '',
                    'url' => $this->buildCanonicalUrl($page, false),
                ];
                if ($page->og_image) {
                    $webPage['image'] = url($page->og_image);
                }
                if ($page->published_at) {
                    $webPage['datePublished'] = $page->published_at->toIso8601String();
                }
                if ($page->updated_at) {
                    $webPage['dateModified'] = $page->updated_at->toIso8601String();
                }

                $jsonLd[] = $webPage;
            }

            // 4. BreadcrumbList
            $breadcrumbs = [
                [
                    '@type' => 'ListItem',
                    'position' => 1,
                    'name' => 'Accueil',
                    'item' => $baseUrl,
                ],
            ];

            if ($isPost) {
                $breadcrumbs[] = [
                    '@type' => 'ListItem',
                    'position' => 2,
                    'name' => 'Blog',
                    'item' => $baseUrl . '/blog',
                ];
                $breadcrumbs[] = [
                    '@type' => 'ListItem',
                    'position' => 3,
                    'name' => $page->title ?? '',
                ];
            } else {
                $breadcrumbs[] = [
                    '@type' => 'ListItem',
                    'position' => 2,
                    'name' => $page->title ?? '',
                ];
            }

            $jsonLd[] = [
                '@context' => 'https://schema.org',
                '@type' => 'BreadcrumbList',
                'itemListElement' => $breadcrumbs,
            ];

            $meta['json_ld'] = $jsonLd;

            return $meta;
        }, 20);
    }

    private function buildCanonicalUrl(mixed $page, bool $isPost): string
    {
        $baseUrl = rtrim(config('app.url', 'http://localhost'), '/');
        $slug = $page->slug ?? '';

        if ($isPost) {
            return $baseUrl . '/blog/' . ltrim($slug, '/');
        }

        if ($slug === '' || $slug === 'accueil' || $slug === 'home') {
            return $baseUrl;
        }

        return $baseUrl . '/' . ltrim($slug, '/');
    }
}
