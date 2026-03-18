<?php

declare(strict_types=1);

use Backup\Http\Controllers\BackupController;
use Illuminate\Support\Facades\Route;

Route::prefix('admin/backups')->middleware(['web', 'auth', 'cms.admin'])->group(function () {
    Route::get('/', [BackupController::class, 'index'])->name('admin.backups.index');
    Route::post('/', [BackupController::class, 'create'])->name('admin.backups.create');
    Route::get('/{backup}/download', [BackupController::class, 'download'])->name('admin.backups.download');
    Route::post('/{backup}/restore', [BackupController::class, 'restore'])->name('admin.backups.restore');
    Route::delete('/{backup}', [BackupController::class, 'destroy'])->name('admin.backups.destroy');
});
