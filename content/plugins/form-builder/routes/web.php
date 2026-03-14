<?php

declare(strict_types=1);

use FormBuilder\Http\Controllers\PublicFormController;
use Illuminate\Support\Facades\Route;

Route::post('/forms/{form:slug}/submit', [PublicFormController::class, 'submit'])
    ->middleware(['web', 'throttle:10,1'])
    ->name('forms.submit');
