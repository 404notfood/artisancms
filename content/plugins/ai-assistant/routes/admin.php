<?php

declare(strict_types=1);

use AiAssistant\Http\Controllers\AiSettingsController;
use Illuminate\Support\Facades\Route;

Route::middleware(['web', 'auth', 'cms.admin'])->prefix('admin/ai')->group(function () {
    Route::get('/settings', [AiSettingsController::class, 'index'])->name('admin.ai.settings');
    Route::put('/settings', [AiSettingsController::class, 'update'])->name('admin.ai.settings.update');
});
