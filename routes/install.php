<?php

declare(strict_types=1);

use App\Http\Controllers\InstallController;
use Illuminate\Support\Facades\Route;

Route::prefix('install')->group(function () {
    // Step 1: Welcome + Language
    Route::get('/', [InstallController::class, 'showWelcome'])->name('install.welcome');
    Route::post('/welcome', [InstallController::class, 'storeWelcome'])->name('install.welcome.store');

    // Step 2: License
    Route::get('/license', [InstallController::class, 'showLicense'])->name('install.license');

    // Step 3: Requirements
    Route::get('/requirements', [InstallController::class, 'showRequirements'])->name('install.requirements');

    // Step 4: Database
    Route::get('/database', [InstallController::class, 'showDatabase'])->name('install.database');
    Route::post('/database/test', [InstallController::class, 'testDatabase'])->name('install.database.test');
    Route::post('/database', [InstallController::class, 'storeDatabase'])->name('install.database.store');

    // Step 5: Configuration (Site + Admin)
    Route::get('/configuration', [InstallController::class, 'showConfiguration'])->name('install.configuration');
    Route::post('/configuration', [InstallController::class, 'storeConfiguration'])->name('install.configuration.store');

    // Step 6: Execute installation
    Route::get('/execute', [InstallController::class, 'showExecute'])->name('install.execute');
    Route::post('/execute', [InstallController::class, 'execute'])->name('install.execute.run');
});
