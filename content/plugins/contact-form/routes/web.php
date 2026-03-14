<?php

declare(strict_types=1);

use ContactForm\Http\Controllers\FormController;
use Illuminate\Support\Facades\Route;

// Public route for form submission
Route::post('/contact/submit', [FormController::class, 'submit'])
    ->middleware(['web', 'throttle:10,1'])
    ->name('contact-form.submit');

// Admin routes for managing submissions
Route::middleware(['web', 'auth', 'cms.admin'])
    ->prefix('admin/plugins/contact-form')
    ->name('admin.plugins.contact-form.')
    ->group(function (): void {
        Route::get('/submissions', [FormController::class, 'index'])
            ->name('submissions.index');

        Route::get('/submissions/{submission}', [FormController::class, 'show'])
            ->name('submissions.show');

        Route::delete('/submissions/{submission}', [FormController::class, 'destroy'])
            ->name('submissions.destroy');
    });
