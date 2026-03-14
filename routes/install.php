<?php

declare(strict_types=1);

use App\Http\Controllers\InstallController;
use Illuminate\Support\Facades\Route;

Route::prefix('install')->group(function () {
    // Step 1: Stack selection
    Route::get('/', [InstallController::class, 'showStack'])->name('install.stack');
    Route::post('/stack', [InstallController::class, 'storeStack'])->name('install.stack.store');

    // Step 2: Language
    Route::get('/language', [InstallController::class, 'showLanguage'])->name('install.language');
    Route::post('/language', [InstallController::class, 'storeLanguage'])->name('install.language.store');

    // Step 3: Requirements
    Route::get('/requirements', [InstallController::class, 'showRequirements'])->name('install.requirements');

    // Step 4: Database
    Route::get('/database', [InstallController::class, 'showDatabase'])->name('install.database');
    Route::post('/database/test', [InstallController::class, 'testDatabase'])->name('install.database.test');
    Route::post('/database', [InstallController::class, 'storeDatabase'])->name('install.database.store');

    // Step 5: Site info
    Route::get('/site', [InstallController::class, 'showSite'])->name('install.site');
    Route::post('/site', [InstallController::class, 'storeSite'])->name('install.site.store');

    // Step 6: Admin account
    Route::get('/admin', [InstallController::class, 'showAdmin'])->name('install.admin');
    Route::post('/admin', [InstallController::class, 'storeAdmin'])->name('install.admin.store');

    // Step 7: Execute installation
    Route::get('/execute', [InstallController::class, 'showExecute'])->name('install.execute');
    Route::post('/execute', [InstallController::class, 'execute'])->name('install.execute.run');

    // Complete
    Route::get('/complete', [InstallController::class, 'complete'])->name('install.complete');
});
