<?php

declare(strict_types=1);

namespace Seo\Http\Controllers;

use App\Models\Page;
use App\Models\Post;
use App\Models\TaxonomyTerm;
use Illuminate\Http\Response;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Cache;

class SitemapController extends Controller
{
    private const CACHE_KEY = 'seo_sitemap_xml';
    private const CACHE_TTL = 3600; // 1 hour

    /**
     * Generate and return the XML sitemap (cached).
     */
    public function index(): Response
    {
        $xml = Cache::remember(self::CACHE_KEY, self::CACHE_TTL, function () {
            return $this->buildSitemapXml();
        });

        return response($xml, 200, [
            'Content-Type' => 'application/xml; charset=utf-8',
            'X-Robots-Tag' => 'noindex',
            'Cache-Control' => 'public, max-age=3600',
        ]);
    }

    /**
     * Build the complete XML sitemap.
     */
    private function buildSitemapXml(): string
    {
        $baseUrl = rtrim(config('app.url', 'http://localhost'), '/');

        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

        // Homepage
        $xml .= $this->urlEntry($baseUrl . '/', now()->toW3cString(), 'daily', '1.0');

        // Pages (exclude noindex pages)
        $pages = Page::published()
            ->select(['slug', 'updated_at', 'meta_robots'])
            ->orderBy('updated_at', 'desc')
            ->get();

        foreach ($pages as $page) {
            if ($this->isNoIndex($page->meta_robots)) {
                continue;
            }
            $slug = ltrim($page->slug ?? '', '/');
            if ($slug === '' || $slug === 'accueil' || $slug === 'home') {
                continue; // Already added as homepage
            }
            $url = $baseUrl . '/' . $slug;
            $lastmod = $page->updated_at?->toW3cString() ?? now()->toW3cString();
            $xml .= $this->urlEntry($url, $lastmod, 'weekly', '0.8');
        }

        // Posts
        $posts = Post::published()
            ->select(['slug', 'updated_at', 'meta_robots'])
            ->orderBy('updated_at', 'desc')
            ->get();

        foreach ($posts as $post) {
            if ($this->isNoIndex($post->meta_robots)) {
                continue;
            }
            $url = $baseUrl . '/blog/' . ltrim($post->slug ?? '', '/');
            $lastmod = $post->updated_at?->toW3cString() ?? now()->toW3cString();
            $xml .= $this->urlEntry($url, $lastmod, 'weekly', '0.6');
        }

        // Blog index
        $xml .= $this->urlEntry($baseUrl . '/blog', now()->toW3cString(), 'daily', '0.7');

        // Categories
        try {
            $categories = TaxonomyTerm::whereHas('taxonomy', function ($q) {
                $q->where('slug', 'categories');
            })->select(['slug', 'updated_at'])->get();

            foreach ($categories as $cat) {
                $url = $baseUrl . '/blog/category/' . ltrim($cat->slug ?? '', '/');
                $lastmod = $cat->updated_at?->toW3cString() ?? now()->toW3cString();
                $xml .= $this->urlEntry($url, $lastmod, 'weekly', '0.5');
            }
        } catch (\Throwable) {
            // Categories table may not exist yet
        }

        $xml .= '</urlset>';

        return $xml;
    }

    private function urlEntry(string $loc, string $lastmod, string $changefreq, string $priority): string
    {
        $escapedLoc = htmlspecialchars($loc, ENT_XML1 | ENT_QUOTES, 'UTF-8');

        return <<<XML
    <url>
        <loc>{$escapedLoc}</loc>
        <lastmod>{$lastmod}</lastmod>
        <changefreq>{$changefreq}</changefreq>
        <priority>{$priority}</priority>
    </url>

XML;
    }

    private function isNoIndex(?string $metaRobots): bool
    {
        if ($metaRobots === null) {
            return false;
        }

        return str_contains(strtolower($metaRobots), 'noindex');
    }

    /**
     * Invalidate the sitemap cache (called by observers when content changes).
     */
    public static function invalidateCache(): void
    {
        Cache::forget(self::CACHE_KEY);
    }
}
