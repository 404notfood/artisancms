<?php

use App\Http\Controllers\Front\BlogController;
use App\Http\Controllers\Front\ErrorController;
use App\Http\Controllers\Front\RssController;
use App\Http\Controllers\Front\SearchController as FrontSearchController;
use App\Http\Controllers\FrontController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\NewsletterSubscribeController;
use App\Http\Controllers\PublicCommentController;
use App\Http\Controllers\SearchController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Front Routes
|--------------------------------------------------------------------------
*/

Route::get('/', [FrontController::class, 'home'])->name('front.home');

/*
|--------------------------------------------------------------------------
| Admin Routes (loaded from routes/admin.php)
|--------------------------------------------------------------------------
*/

Route::prefix('admin')
    ->middleware(['web', 'auth'])
    ->group(base_path('routes/admin.php'));

/*
|--------------------------------------------------------------------------
| Auth Routes (Breeze)
|--------------------------------------------------------------------------
*/

Route::get('/dashboard', function () {
    return redirect('/admin');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';

/*
|--------------------------------------------------------------------------
| Install Routes (loaded from routes/install.php)
|--------------------------------------------------------------------------
*/

require __DIR__.'/install.php';

/*
|--------------------------------------------------------------------------
| Public API Routes
|--------------------------------------------------------------------------
*/

Route::get('/api/search', [SearchController::class, 'search'])
    ->middleware('throttle:60,1')
    ->name('search');

/*
|--------------------------------------------------------------------------
| RSS Feed Routes
|--------------------------------------------------------------------------
*/

Route::get('feed', [RssController::class, 'feed'])->name('feed.rss');
Route::get('feed/category/{term:slug}', [RssController::class, 'categoryFeed'])->name('feed.category');

/*
|--------------------------------------------------------------------------
| Blog Routes
|--------------------------------------------------------------------------
*/

Route::get('/blog', [BlogController::class, 'index'])->name('blog.index');
Route::get('/blog/category/{slug}', [BlogController::class, 'category'])->name('blog.category');
Route::get('/blog/tag/{slug}', [BlogController::class, 'tag'])->name('blog.tag');
Route::get('/blog/archive/{year}/{month?}', [BlogController::class, 'archive'])
    ->name('blog.archive')
    ->where(['year' => '[0-9]{4}', 'month' => '[0-9]{1,2}']);
Route::get('/blog/{slug}', [BlogController::class, 'show'])->name('blog.show');
Route::post('/blog/{slug}/comments', [BlogController::class, 'storeComment'])
    ->middleware('throttle:10,1')
    ->name('blog.comment.store');

/*
|--------------------------------------------------------------------------
| Front-end Search
|--------------------------------------------------------------------------
*/

Route::get('/search', [FrontSearchController::class, 'index'])->name('front.search');

/*
|--------------------------------------------------------------------------
| Error Pages
|--------------------------------------------------------------------------
*/

Route::get('/maintenance', [ErrorController::class, 'maintenance'])->name('front.maintenance');

/*
|--------------------------------------------------------------------------
| Public Comments
|--------------------------------------------------------------------------
*/

Route::post('/comments', [PublicCommentController::class, 'store'])
    ->middleware('throttle:10,1')
    ->name('comments.store');

/*
|--------------------------------------------------------------------------
| Newsletter (Public)
|--------------------------------------------------------------------------
*/

Route::post('newsletter/subscribe', [NewsletterSubscribeController::class, 'subscribe'])
    ->middleware('throttle:5,1')
    ->name('newsletter.subscribe');

Route::get('newsletter/unsubscribe/{token}', [NewsletterSubscribeController::class, 'unsubscribe'])
    ->name('newsletter.unsubscribe');

/*
|--------------------------------------------------------------------------
| Preview Routes
|--------------------------------------------------------------------------
*/

Route::get('/preview/{token}', [FrontController::class, 'preview'])->name('preview');

/*
|--------------------------------------------------------------------------
| Front Catch-All Route (must be LAST)
|--------------------------------------------------------------------------
*/

Route::get('/{slug}', [FrontController::class, 'show'])
    ->name('front.page')
    ->where('slug', '(?!admin(?:/|$))(?!api(?:/|$))(?!shop(?:/|$))(?!cart(?:/|$))(?!checkout(?:/|$))(?!payment(?:/|$))(?!account(?:/|$))(?!wishlist(?:/|$))[a-zA-Z0-9\-\/]+');
