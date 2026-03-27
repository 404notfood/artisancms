<?php

use App\Http\Controllers\Front\BlogController;
use App\Http\Controllers\Front\ErrorController;
use App\Http\Controllers\Front\RssFeedController;
use App\Http\Controllers\Front\SearchController as FrontSearchController;
use App\Http\Controllers\FrontController;
use App\Http\Controllers\Front\MemberController;
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
| Prefix is dynamique — configurable via Settings > Securite
|--------------------------------------------------------------------------
*/

$adminPrefix = config('cms.admin.prefix', 'admin');
try {
    $dbPrefix = \App\Models\Setting::get('security.admin_prefix');
    if ($dbPrefix && is_string($dbPrefix) && preg_match('/^[a-zA-Z0-9\-_]+$/', $dbPrefix)) {
        $adminPrefix = $dbPrefix;
    }
} catch (\Throwable) {
    // DB not available yet (install wizard, migrations not run)
}

// Store resolved prefix in config for other parts of the app
config(['cms.admin.resolved_prefix' => $adminPrefix]);

Route::prefix($adminPrefix)
    ->middleware(config('cms.admin.middleware', ['web', 'auth']))
    ->group(base_path('routes/admin.php'));

/*
|--------------------------------------------------------------------------
| Auth Routes (Breeze)
|--------------------------------------------------------------------------
*/

Route::get('/dashboard', function () {
    $prefix = config('cms.admin.resolved_prefix', 'admin');
    return redirect("/{$prefix}");
})->middleware(['auth'])->name('dashboard');

Route::middleware('auth')->group(function () {
    $prefix = config('cms.admin.resolved_prefix', 'admin');
    Route::get('/profile', fn () => redirect("/{$prefix}/account"))->name('profile.edit');
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

Route::get('feed', [RssFeedController::class, 'posts'])->name('feed.posts');
Route::get('feed/category/{term:slug}', [RssFeedController::class, 'category'])->name('feed.category');

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
| Members (Annuaire & Profil public)
|--------------------------------------------------------------------------
*/

Route::get('/members', [MemberController::class, 'index'])->name('members.index');
Route::get('/members/{user}', [MemberController::class, 'show'])->name('members.show');

/*
|--------------------------------------------------------------------------
| Front Catch-All Route (must be LAST)
| Excludes dynamic admin prefix and other reserved paths
|--------------------------------------------------------------------------
*/

$escapedAdminPrefix = preg_quote($adminPrefix, '/');
Route::get('/{slug}', [FrontController::class, 'show'])
    ->name('front.page')
    ->where('slug', "(?!{$escapedAdminPrefix}(?:/|$))(?!api(?:/|$))(?!install(?:/|$))(?!login$)(?!register$)(?!forgot-password$)(?!reset-password(?:/|$))(?!password(?:/|$))(?!blog(?:/|$))(?!feed(?:/|$))(?!search$)(?!newsletter(?:/|$))(?!comments$)(?!preview(?:/|$))(?!maintenance$)(?!members(?:/|$))(?!shop(?:/|$))(?!cart(?:/|$))(?!checkout(?:/|$))(?!payment(?:/|$))(?!account(?:/|$))(?!wishlist(?:/|$))(?!up$)(?!dashboard$)(?!profile$)(?!_debugbar(?:/|$))(?!sanctum(?:/|$))[a-zA-Z0-9\\-\\/]+");
