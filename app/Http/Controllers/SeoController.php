<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Services\SeoService;
use App\Services\SettingService;
use Illuminate\Http\Response;

class SeoController extends Controller
{
    public function __construct(
        private readonly SeoService $seo,
        private readonly SettingService $settings,
    ) {}

    public function sitemap(): Response
    {
        if (! (bool) $this->settings->get('seo.sitemap_enabled', true)) {
            abort(404);
        }

        return response()
            ->view('seo.sitemap', ['urls' => $this->seo->sitemapUrls()])
            ->header('Content-Type', 'application/xml');
    }

    public function robots(): Response
    {
        return response($this->seo->robotsTxt(), 200)
            ->header('Content-Type', 'text/plain');
    }
}
