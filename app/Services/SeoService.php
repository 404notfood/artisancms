<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Page;
use App\Models\Post;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class SeoService
{
    public function __construct(
        private readonly SettingService $settings,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function metaFor(Model $entity): array
    {
        $title = (string) ($entity->meta_title ?: $entity->title);
        $description = (string) ($entity->meta_description ?: $this->settings->get('seo.meta_description', ''));
        $suffix = (string) $this->settings->get('seo.meta_title_suffix', '');
        $siteName = (string) $this->settings->get('general.site_name', config('app.name', 'ArtisanCMS'));
        $url = $this->urlFor($entity);
        $robots = (string) ($entity->meta_robots ?: ((bool) $this->settings->get('seo.robots_index', true) ? 'index, follow' : 'noindex, nofollow'));
        $canonical = $entity->canonical_url ?: ((bool) $this->settings->get('seo.canonical_enabled', true) ? $url : null);

        return [
            'title' => Str::endsWith($title, $suffix) ? $title : $title . $suffix,
            'meta_title_raw' => $title,
            'meta_description' => $description,
            'meta_robots' => $robots,
            'canonical' => $canonical,
            'focus_keyword' => $entity->focus_keyword ?? null,
            'og_title' => $title,
            'og_description' => $description,
            'og_image' => $entity->og_image ?? $entity->featured_image ?? null,
            'og_type' => $entity instanceof Post ? 'article' : 'website',
            'og_site_name' => $siteName,
            'og_url' => $url,
            'twitter_card' => ($entity->og_image ?? $entity->featured_image ?? null) ? 'summary_large_image' : 'summary',
            'twitter_title' => $title,
            'twitter_description' => $description,
            'twitter_image' => $entity->og_image ?? $entity->featured_image ?? null,
            'article_published_time' => $entity instanceof Post ? $entity->published_at?->toIso8601String() : null,
            'article_modified_time' => $entity->updated_at?->toIso8601String(),
            'article_author' => $entity->author?->name ?? null,
            'google_site_verification' => $this->settings->get('seo.google_site_verification'),
            'bing_site_verification' => $this->settings->get('seo.bing_site_verification'),
            'json_ld' => [$this->jsonLdFor($entity, $url, $siteName, $description)],
        ];
    }

    /**
     * @return array{summary: array<string, int>, items: array<int, array<string, mixed>>}
     */
    public function audit(): array
    {
        $items = [];

        foreach ($this->auditablePages() as $page) {
            $items[] = $this->auditEntity($page, 'page', '/' . ltrim($page->slug, '/'));
        }

        foreach ($this->auditablePosts() as $post) {
            $items[] = $this->auditEntity($post, 'post', '/blog/' . ltrim($post->slug, '/'));
        }

        return [
            'summary' => [
                'total' => count($items),
                'good' => count(array_filter($items, fn ($item) => $item['score'] >= 80)),
                'warning' => count(array_filter($items, fn ($item) => $item['score'] >= 50 && $item['score'] < 80)),
                'bad' => count(array_filter($items, fn ($item) => $item['score'] < 50)),
            ],
            'items' => $items,
        ];
    }

    /**
     * @return array<int, array{loc: string, lastmod: string|null, priority: string, changefreq: string}>
     */
    public function sitemapUrls(): array
    {
        $urls = [[
            'loc' => url('/'),
            'lastmod' => now()->toDateString(),
            'priority' => '1.0',
            'changefreq' => 'daily',
        ]];

        foreach ($this->auditablePages() as $page) {
            $urls[] = [
                'loc' => $this->urlFor($page),
                'lastmod' => $page->updated_at?->toDateString(),
                'priority' => '0.8',
                'changefreq' => 'weekly',
            ];
        }

        foreach ($this->auditablePosts() as $post) {
            $urls[] = [
                'loc' => $this->urlFor($post),
                'lastmod' => $post->updated_at?->toDateString(),
                'priority' => '0.7',
                'changefreq' => 'monthly',
            ];
        }

        return $urls;
    }

    public function robotsTxt(): string
    {
        $allowIndex = (bool) $this->settings->get('seo.robots_index', true);
        $lines = [
            'User-agent: *',
            $allowIndex ? 'Allow: /' : 'Disallow: /',
            'Disallow: /' . trim((string) $this->settings->get('security.admin_prefix', 'admin'), '/') . '/',
        ];

        if ((bool) $this->settings->get('seo.sitemap_enabled', true)) {
            $lines[] = 'Sitemap: ' . url('/sitemap.xml');
        }

        return implode("\n", $lines) . "\n";
    }

    private function urlFor(Model $entity): string
    {
        if ($entity instanceof Post) {
            return route('blog.show', $entity->slug);
        }

        if ($entity instanceof Page) {
            return $entity->slug === 'home' || $entity->slug === 'accueil'
                ? url('/')
                : route('front.page', $entity->slug);
        }

        return url('/');
    }

    /**
     * @return Collection<int, Page>
     */
    private function auditablePages(): Collection
    {
        return Page::query()->published()->orderBy('updated_at', 'desc')->get();
    }

    /**
     * @return Collection<int, Post>
     */
    private function auditablePosts(): Collection
    {
        return Post::query()->published()->with('author')->orderBy('updated_at', 'desc')->get();
    }

    /**
     * @return array<string, mixed>
     */
    private function auditEntity(Model $entity, string $type, string $path): array
    {
        $issues = [];
        $title = (string) ($entity->meta_title ?: $entity->title);
        $description = (string) ($entity->meta_description ?? '');

        if ($title === '') $issues[] = 'Titre SEO manquant';
        if (mb_strlen($title) > 65) $issues[] = 'Titre SEO trop long';
        if ($description === '') $issues[] = 'Meta description manquante';
        if ($description !== '' && (mb_strlen($description) < 70 || mb_strlen($description) > 160)) {
            $issues[] = 'Meta description hors longueur ideale';
        }
        if (empty($entity->og_image) && empty($entity->featured_image)) $issues[] = 'Image Open Graph manquante';
        if (($entity->meta_robots ?? '') === 'noindex, nofollow') $issues[] = 'Page en noindex';

        return [
            'id' => $entity->id,
            'type' => $type,
            'title' => $entity->title,
            'path' => $path,
            'status' => $entity->status,
            'score' => max(0, 100 - (count($issues) * 20)),
            'issues' => $issues,
            'updated_at' => $entity->updated_at?->toISOString(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function jsonLdFor(Model $entity, string $url, string $siteName, string $description): array
    {
        return [
            '@context' => 'https://schema.org',
            '@type' => $entity instanceof Post ? 'Article' : 'WebPage',
            'headline' => (string) ($entity->meta_title ?: $entity->title),
            'description' => $description,
            'url' => $url,
            'isPartOf' => [
                '@type' => 'WebSite',
                'name' => $siteName,
                'url' => url('/'),
            ],
            'datePublished' => $entity->published_at instanceof Carbon ? $entity->published_at->toIso8601String() : null,
            'dateModified' => $entity->updated_at?->toIso8601String(),
        ];
    }
}
