<?php

declare(strict_types=1);

use App\Http\Controllers\Admin\SystemController;
use App\Http\Controllers\Api\BuilderApiController;
use App\Http\Controllers\Api\MediaApiController;
use App\Http\Controllers\Api\SearchApiController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
| JSON-only API routes for the page builder, media management, and admin
| operations. All routes require authentication via the web guard.
*/

// Builder API - rate limited
Route::prefix('builder')
    ->middleware(['web', 'auth', 'throttle:builder-api'])
    ->group(function (): void {
        Route::put('pages/{page}/content', [BuilderApiController::class, 'saveContent'])
            ->name('api.builder.pages.content');

        Route::post('pages/{page}/autosave', [BuilderApiController::class, 'autosave'])
            ->name('api.builder.pages.autosave');

        Route::post('media/upload', [BuilderApiController::class, 'uploadMedia'])
            ->name('api.builder.media.upload');
    });

// Media API
Route::prefix('media')
    ->middleware(['web', 'auth'])
    ->group(function (): void {
        Route::get('/', [MediaApiController::class, 'index'])
            ->name('api.media.index');

        Route::post('/', [MediaApiController::class, 'store'])
            ->name('api.media.store');

        Route::put('{media}', [MediaApiController::class, 'update'])
            ->name('api.media.update');

        Route::delete('{media}', [MediaApiController::class, 'destroy'])
            ->name('api.media.destroy');
    });

// Admin API
Route::prefix('admin')
    ->middleware(['web', 'auth'])
    ->group(function (): void {
        Route::post('pages/{page}/duplicate', [BuilderApiController::class, 'duplicatePage'])
            ->name('api.admin.pages.duplicate');

        Route::post('pages/reorder', [BuilderApiController::class, 'reorderPages'])
            ->name('api.admin.pages.reorder');
    });

// Search API (front-end autocomplete)
Route::get('search', [SearchApiController::class, 'search'])
    ->middleware('web')
    ->name('api.search');

// Health check (public endpoint)
Route::get('/health', [SystemController::class, 'healthCheckApi'])
    ->name('api.health');
