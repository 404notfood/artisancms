<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\ConfirmablePasswordController;
use App\Http\Controllers\Auth\EmailVerificationNotificationController;
use App\Http\Controllers\Auth\EmailVerificationPromptController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\PasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\VerifyEmailController;
use Illuminate\Support\Facades\Route;

// Resolve custom auth paths from DB settings (fallback to config/env)
try {
    $loginPath = \App\Models\Setting::get('security.login_path') ?? config('cms.auth.login_path', 'login');
    $registerPath = \App\Models\Setting::get('security.register_path') ?? config('cms.auth.register_path', 'register');
} catch (\Throwable) {
    $loginPath = config('cms.auth.login_path', 'login');
    $registerPath = config('cms.auth.register_path', 'register');
}

// Ensure clean paths (no leading slash)
$loginPath = ltrim((string) $loginPath, '/');
$registerPath = ltrim((string) $registerPath, '/');

// 301 redirects from default paths if custom ones are set
if ($loginPath !== 'login') {
    Route::get('login', fn () => redirect("/{$loginPath}", 301))->name('login.redirect');
}
if ($registerPath !== 'register') {
    Route::get('register', fn () => redirect("/{$registerPath}", 301))->name('register.redirect');
}

Route::middleware('guest')->group(function () use ($loginPath, $registerPath) {
    Route::get($registerPath, [RegisteredUserController::class, 'create'])
        ->name('register');

    Route::post($registerPath, [RegisteredUserController::class, 'store']);

    Route::get($loginPath, [AuthenticatedSessionController::class, 'create'])
        ->name('login');

    Route::post($loginPath, [AuthenticatedSessionController::class, 'store']);

    Route::get('forgot-password', [PasswordResetLinkController::class, 'create'])
        ->name('password.request');

    Route::post('forgot-password', [PasswordResetLinkController::class, 'store'])
        ->name('password.email');

    Route::get('reset-password/{token}', [NewPasswordController::class, 'create'])
        ->name('password.reset');

    Route::post('reset-password', [NewPasswordController::class, 'store'])
        ->name('password.store');
});

Route::middleware('auth')->group(function () {
    Route::get('verify-email', EmailVerificationPromptController::class)
        ->name('verification.notice');

    Route::get('verify-email/{id}/{hash}', VerifyEmailController::class)
        ->middleware(['signed', 'throttle:6,1'])
        ->name('verification.verify');

    Route::post('email/verification-notification', [EmailVerificationNotificationController::class, 'store'])
        ->middleware('throttle:6,1')
        ->name('verification.send');

    Route::get('confirm-password', [ConfirmablePasswordController::class, 'show'])
        ->name('password.confirm');

    Route::post('confirm-password', [ConfirmablePasswordController::class, 'store']);

    Route::put('password', [PasswordController::class, 'update'])->name('password.update');

    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])
        ->name('logout');
});
