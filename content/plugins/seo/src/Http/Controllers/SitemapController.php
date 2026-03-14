<?php

declare(strict_types=1);

namespace Seo\Http\Controllers;

use App\Models\Page;
use App\Models\Post;
use Illuminate\Http\Response;
use Illuminate\Routing\Controller;

class SitemapController extends Controller
{
    /**
     * Generate and return the XML sitemap.
     */
    public function index(): Response
    {
        $pages = Page::published()
            ->select(['slug', 'updated_at'])
            ->orderBy('updated_at', 'desc')
            ->get();

        $posts = Post::published()
            ->select(['slug', 'updated_at'])
            ->orderBy('updated_at', 'desc')
            ->get();

        $xml = $this->buildSitemapXml($pages, $posts);

        return response($xml, 200, [
            'Content-Type' => 'application/xml; charset=utf-8',
            'X-Robots-Tag' => 'noindex',
        ]);
    }

    /**
     * Build the XML sitemap string.
     *
     * @param \Illuminate\Database\Eloquent\Collection<int, Page> $pages
     * @param \Illuminate\Database\Eloquent\Collection<int, Post> $posts
     */
    private function buildSitemapXml(mixed $pages, mixed $posts): string
    {
        $baseUrl = rtrim(config('app.url', 'http://localhost'), '/');

        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

        // Homepage
        $xml .= $this->buildUrlEntry($baseUrl . '/', now()->toW3cString(), 'daily', '1.0');

        // Pages
        foreach ($pages as $page) {
            $url = $baseUrl . '/' . ltrim($page->slug ?? '', '/');
            $lastmod = $page->updated_at?->toW3cString() ?? now()->toW3cString();
            $xml .= $this->buildUrlEntry($url, $lastmod, 'weekly', '0.8');
        }

        // Posts
        foreach ($posts as $post) {
            $url = $baseUrl . '/blog/' . ltrim($post->slug ?? '', '/');
            $lastmod = $post->updated_at?->toW3cString() ?? now()->toW3cString();
            $xml .= $this->buildUrlEntry($url, $lastmod, 'weekly', '0.6');
        }

        $xml .= '</urlset>';

        return $xml;
    }

    /**
     * Build a single <url> entry for the sitemap.
     */
    private function buildUrlEntry(string $loc, string $lastmod, string $changefreq, string $priority): string
    {
        return <<<XML
    <url>
        <loc>{$this->escapeXml($loc)}</loc>
        <lastmod>{$lastmod}</lastmod>
        <changefreq>{$changefreq}</changefreq>
        <priority>{$priority}</priority>
    </url>

XML;
    }

    /**
     * Escape special XML characters.
     */
    private function escapeXml(string $value): string
    {
        return htmlspecialchars($value, ENT_XML1 | ENT_QUOTES, 'UTF-8');
    }
}
