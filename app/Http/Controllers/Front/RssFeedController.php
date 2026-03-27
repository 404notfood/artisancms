<?php

declare(strict_types=1);

namespace App\Http\Controllers\Front;

use App\CMS\Blocks\BlockTextExtractor;
use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\Setting;
use App\Models\TaxonomyTerm;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class RssFeedController extends Controller
{
    private const int FEED_LIMIT = 20;

    private const int CACHE_TTL_SECONDS = 3600;

    /**
     * Main RSS feed with the last 20 published posts.
     */
    public function posts(): Response
    {
        $data = Cache::remember('rss:posts', self::CACHE_TTL_SECONDS, function (): array {
            $posts = Post::published()
                ->with('author')
                ->orderByDesc('published_at')
                ->limit(self::FEED_LIMIT)
                ->get();

            return [
                'title' => (string) Setting::get('general.site_name', 'ArtisanCMS'),
                'description' => (string) Setting::get('general.site_description', ''),
                'posts' => $posts,
            ];
        });

        return $this->renderFeed(
            $data['title'],
            $data['description'],
            $data['posts'],
        );
    }

    /**
     * RSS feed filtered by a specific category term.
     */
    public function category(TaxonomyTerm $term): Response
    {
        $cacheKey = 'rss:category:' . $term->id;

        $data = Cache::remember($cacheKey, self::CACHE_TTL_SECONDS, function () use ($term): array {
            $posts = $term->posts()
                ->where('status', 'published')
                ->where('published_at', '<=', now())
                ->with('author')
                ->orderByDesc('published_at')
                ->limit(self::FEED_LIMIT)
                ->get();

            $siteName = (string) Setting::get('general.site_name', 'ArtisanCMS');

            return [
                'title' => $siteName . ' - ' . $term->name,
                'description' => $term->description ?? (string) Setting::get('general.site_description', ''),
                'posts' => $posts,
            ];
        });

        return $this->renderFeed(
            $data['title'],
            $data['description'],
            $data['posts'],
        );
    }

    /**
     * Render the RSS XML response.
     *
     * @param \Illuminate\Support\Collection<int, Post> $posts
     */
    private function renderFeed(string $title, string $description, mixed $posts): Response
    {
        $items = $posts->map(fn (Post $post): array => [
            'title' => $post->title,
            'link' => url('/blog/' . $post->slug),
            'description' => $post->excerpt ?? Str::limit(BlockTextExtractor::extract($post->content), 300),
            'contentEncoded' => BlockTextExtractor::extract($post->content),
            'pubDate' => $post->published_at->toRfc2822String(),
            'creator' => $post->author?->name ?? '',
            'guid' => url('/blog/' . $post->slug),
        ]);

        return response()
            ->view('rss.feed', [
                'title' => $title,
                'description' => $description,
                'siteUrl' => config('app.url'),
                'language' => app()->getLocale(),
                'lastBuildDate' => $posts->first()?->published_at?->toRfc2822String() ?? now()->toRfc2822String(),
                'items' => $items,
            ])
            ->header('Content-Type', 'application/rss+xml; charset=UTF-8');
    }
}
