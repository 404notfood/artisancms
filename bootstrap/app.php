<?php

use App\Http\Controllers\Front\ErrorController;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            \App\Http\Middleware\EnsureInstalled::class,
            \App\Http\Middleware\CheckMaintenanceMode::class,
            \App\Http\Middleware\HandleRedirects::class,
            \App\Http\Middleware\ResolveSite::class,
            \App\Http\Middleware\SetLocale::class,
            \App\Http\Middleware\SecurityHeaders::class,
            \App\Http\Middleware\ErrorRecoveryMiddleware::class,
            \App\Http\Middleware\InjectBranding::class,
            \App\Http\Middleware\HandleInertiaRequests::class,
            \App\Http\Middleware\TrackPageView::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->alias([
            'cms.admin' => \App\Http\Middleware\EnsureAdmin::class,
            'cms.content.access' => \App\Http\Middleware\CheckContentAccess::class,
            'cms.content.lock' => \App\Http\Middleware\CheckContentLock::class,
        ]);

        $middleware->validateCsrfTokens(except: [
            'install/execute',
            'install/database/test',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->renderable(function (NotFoundHttpException $e, Request $request) {
            if ($request->wantsJson()) {
                return null;
            }

            // Don't use custom 404 page if not installed yet
            if (! file_exists(storage_path('.installed'))) {
                return null;
            }

            try {
                /** @var ErrorController $controller */
                $controller = app(ErrorController::class);

                return $controller->notFound()->toResponse($request)->setStatusCode(404);
            } catch (\Throwable) {
                return null;
            }
        });
    })->create();
