<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use Seo\Http\Controllers\RobotsController;
use Seo\Http\Controllers\SitemapController;

Route::get('/sitemap.xml', [SitemapController::class, 'index'])
    ->name('seo.sitemap');

Route::get('/robots.txt', [RobotsController::class, 'index'])
    ->name('seo.robots');
