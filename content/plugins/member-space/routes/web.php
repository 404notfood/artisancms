<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use MemberSpace\Http\Controllers\AccountController;
use MemberSpace\Http\Controllers\Admin\ContentRestrictionController;
use MemberSpace\Http\Controllers\Admin\MemberAdminController;
use MemberSpace\Http\Controllers\Admin\MemberFieldController;
use MemberSpace\Http\Controllers\Admin\MemberSettingsController;
use MemberSpace\Http\Controllers\Admin\MembershipPlanController;
use MemberSpace\Http\Controllers\Admin\VerificationController;
use MemberSpace\Http\Controllers\MemberAuthController;
use MemberSpace\Http\Controllers\MemberDirectoryController;
use MemberSpace\Http\Controllers\MembershipController;
use MemberSpace\Http\Controllers\ProfileController;
use MemberSpace\Http\Controllers\SocialAuthController;
use MemberSpace\Http\Controllers\TwoFactorController;

// ---- Admin Routes ----
Route::prefix('admin/member-space')->middleware(['web', 'auth', 'cms.admin'])->group(function () {
    // Settings
    Route::get('settings', [MemberSettingsController::class, 'index'])->name('admin.member-space.settings');
    Route::put('settings', [MemberSettingsController::class, 'update'])->name('admin.member-space.settings.update');

    // Members
    Route::get('members', [MemberAdminController::class, 'index'])->name('admin.member-space.members.index');
    Route::get('members/{user}', [MemberAdminController::class, 'show'])->name('admin.member-space.members.show');

    // Custom Fields
    Route::get('fields', [MemberFieldController::class, 'index'])->name('admin.member-space.fields.index');
    Route::post('fields', [MemberFieldController::class, 'store'])->name('admin.member-space.fields.store');
    Route::put('fields/{field}', [MemberFieldController::class, 'update'])->name('admin.member-space.fields.update');
    Route::delete('fields/{field}', [MemberFieldController::class, 'destroy'])->name('admin.member-space.fields.destroy');
    Route::post('fields/reorder', [MemberFieldController::class, 'reorder'])->name('admin.member-space.fields.reorder');

    // Membership Plans
    Route::get('plans', [MembershipPlanController::class, 'index'])->name('admin.member-space.plans.index');
    Route::get('plans/create', [MembershipPlanController::class, 'create'])->name('admin.member-space.plans.create');
    Route::post('plans', [MembershipPlanController::class, 'store'])->name('admin.member-space.plans.store');
    Route::get('plans/{plan}/edit', [MembershipPlanController::class, 'edit'])->name('admin.member-space.plans.edit');
    Route::put('plans/{plan}', [MembershipPlanController::class, 'update'])->name('admin.member-space.plans.update');
    Route::delete('plans/{plan}', [MembershipPlanController::class, 'destroy'])->name('admin.member-space.plans.destroy');

    // Verifications
    Route::get('verifications', [VerificationController::class, 'index'])->name('admin.member-space.verifications.index');
    Route::post('verifications/{verification}/approve', [VerificationController::class, 'approve'])->name('admin.member-space.verifications.approve');
    Route::post('verifications/{verification}/reject', [VerificationController::class, 'reject'])->name('admin.member-space.verifications.reject');

    // Content Restrictions
    Route::get('restrictions', [ContentRestrictionController::class, 'index'])->name('admin.member-space.restrictions.index');
    Route::post('restrictions', [ContentRestrictionController::class, 'store'])->name('admin.member-space.restrictions.store');
    Route::put('restrictions/{restriction}', [ContentRestrictionController::class, 'update'])->name('admin.member-space.restrictions.update');
    Route::delete('restrictions/{restriction}', [ContentRestrictionController::class, 'destroy'])->name('admin.member-space.restrictions.destroy');
});

// ---- Front-end Auth Routes (public) ----
Route::middleware(['web'])->prefix('members/auth')->group(function () {
    Route::get('register', [MemberAuthController::class, 'showRegister'])->name('members.auth.register');
    Route::post('register', [MemberAuthController::class, 'register'])->name('members.auth.register.store');
    Route::get('login', [MemberAuthController::class, 'showLogin'])->name('members.auth.login');
    Route::post('login', [MemberAuthController::class, 'login'])->name('members.auth.login.store');
    Route::get('two-factor', [MemberAuthController::class, 'showTwoFactor'])->name('members.auth.two-factor');
    Route::post('two-factor', [MemberAuthController::class, 'verifyTwoFactor'])->name('members.auth.two-factor.verify');

    // Social Login
    Route::get('social/{provider}', [SocialAuthController::class, 'redirect'])->name('members.auth.social.redirect');
    Route::get('social/{provider}/callback', [SocialAuthController::class, 'callback'])->name('members.auth.social.callback');
});

// ---- Front-end Member Routes (authenticated) ----
Route::middleware(['web', 'auth'])->prefix('members')->group(function () {
    // Account
    Route::get('account', [AccountController::class, 'dashboard'])->name('members.account');
    Route::get('account/edit-profile', [AccountController::class, 'editProfile'])->name('members.account.edit-profile');
    Route::put('account/profile', [AccountController::class, 'updateProfile'])->name('members.account.update-profile');
    Route::post('account/avatar', [AccountController::class, 'uploadAvatar'])->name('members.account.upload-avatar');
    Route::post('account/cover', [AccountController::class, 'uploadCover'])->name('members.account.upload-cover');
    Route::delete('account/avatar', [AccountController::class, 'deleteAvatar'])->name('members.account.delete-avatar');

    // Security / 2FA
    Route::get('account/security', [TwoFactorController::class, 'show'])->name('members.account.security');
    Route::post('account/security/2fa/enable', [TwoFactorController::class, 'enable'])->name('members.account.2fa.enable');
    Route::post('account/security/2fa/confirm', [TwoFactorController::class, 'confirm'])->name('members.account.2fa.confirm');
    Route::post('account/security/2fa/disable', [TwoFactorController::class, 'disable'])->name('members.account.2fa.disable');
    Route::post('account/security/2fa/regenerate', [TwoFactorController::class, 'regenerateCodes'])->name('members.account.2fa.regenerate');

    // Social Accounts
    Route::get('account/social', function () {
        $socialService = app(\MemberSpace\Services\SocialLoginService::class);
        return \Inertia\Inertia::render('Front/Members/Account/SocialAccounts', array_merge(
            app(\MemberSpace\Http\Controllers\AccountController::class)->themeAndMenus(),
            [
                'accounts' => $socialService->getUserAccounts(auth()->id()),
                'providers' => $socialService->getSupportedProviders(),
            ]
        ));
    })->name('members.account.social');
    Route::delete('account/social/{provider}', [SocialAuthController::class, 'unlink'])->name('members.account.social.unlink');

    // Membership
    Route::get('account/membership', [MembershipController::class, 'accountMembership'])->name('members.account.membership');
    Route::post('membership/subscribe/{plan}', [MembershipController::class, 'subscribe'])->name('members.membership.subscribe');
    Route::post('membership/cancel', [MembershipController::class, 'cancel'])->name('members.membership.cancel');
});

// ---- Front-end Public Routes ----
Route::middleware(['web'])->prefix('members')->group(function () {
    // Directory
    Route::get('/', [MemberDirectoryController::class, 'index'])
        ->middleware('member.module:member_directory')
        ->name('members.directory');

    // Plans (public)
    Route::get('plans', [MembershipController::class, 'plans'])
        ->middleware('member.module:membership_plans')
        ->name('members.plans');

    // Profile
    Route::get('{user}', [ProfileController::class, 'show'])->name('members.profile');
});

// ---- Webhooks (no CSRF) ----
Route::middleware(['web'])
    ->withoutMiddleware([\Illuminate\Http\Middleware\ValidateCsrfToken::class])
    ->group(function () {
        Route::post('members/webhook/stripe', [MembershipController::class, 'webhook'])
            ->name('members.webhook.stripe');
    });
