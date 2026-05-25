<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\SeoService;
use Inertia\Inertia;
use Inertia\Response;

class SeoController extends Controller
{
    public function __construct(
        private readonly SeoService $seo,
    ) {}

    public function index(): Response
    {
        return Inertia::render('Admin/Seo/Index', [
            'audit' => $this->seo->audit(),
            'sitemapUrl' => route('seo.sitemap'),
            'robotsUrl' => route('seo.robots'),
        ]);
    }
}
