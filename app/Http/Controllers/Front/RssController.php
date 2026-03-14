<?php

declare(strict_types=1);

namespace App\Http\Controllers\Front;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\Setting;
use App\Models\TaxonomyTerm;
use Illuminate\Http\Response;

class RssController extends Controller
{
    /**
     * Main RSS feed with the last 20 published posts.
     */
    public function feed(): Response
    {
        $posts = Post::published()
            ->with('author')
            ->orderByDesc('published_at')
            ->limit(20)
            ->get();

        $siteName = Setting::get('general.site_name', 'ArtisanCMS');
        $siteDescription = Setting::get('general.site_description', '');
        $siteUrl = config('app.url');
        $language = app()->getLocale();

        return response()
            ->view('feed.rss', [
                'siteName' => $siteName,
                'siteDescription' => $siteDescription,
                'siteUrl' => $siteUrl,
                'language' => $language,
                'posts' => $posts,
            ])
            ->header('Content-Type', 'application/rss+xml; charset=UTF-8');
    }

    /**
     * RSS feed filtered by a specific category term.
     */
    public function categoryFeed(TaxonomyTerm $term): Response
    {
        $posts = $term->posts()
            ->where('status', 'published')
            ->where('published_at', '<=', now())
            ->with('author')
            ->orderByDesc('published_at')
            ->limit(20)
            ->get();

        $siteName = Setting::get('general.site_name', 'ArtisanCMS');
        $siteDescription = Setting::get('general.site_description', '');
        $siteUrl = config('app.url');
        $language = app()->getLocale();

        return response()
            ->view('feed.rss', [
                'siteName' => $siteName . ' - ' . $term->name,
                'siteDescription' => $term->description ?? $siteDescription,
                'siteUrl' => $siteUrl,
                'language' => $language,
                'posts' => $posts,
            ])
            ->header('Content-Type', 'application/rss+xml; charset=UTF-8');
    }
}
