<?php

declare(strict_types=1);

use FormBuilder\Http\Controllers\FormController;
use FormBuilder\Http\Controllers\FormSubmissionController;
use Illuminate\Support\Facades\Route;

Route::prefix('admin/forms')->middleware(['web', 'auth'])->group(function (): void {
    Route::get('/', [FormController::class, 'index'])->name('admin.forms.index');
    Route::get('/create', [FormController::class, 'create'])->name('admin.forms.create');
    Route::post('/', [FormController::class, 'store'])->name('admin.forms.store');
    Route::get('/{form}/edit', [FormController::class, 'edit'])->name('admin.forms.edit');
    Route::put('/{form}', [FormController::class, 'update'])->name('admin.forms.update');
    Route::delete('/{form}', [FormController::class, 'destroy'])->name('admin.forms.destroy');

    Route::get('/{form}/submissions', [FormSubmissionController::class, 'index'])->name('admin.forms.submissions.index');
    Route::get('/submissions/{submission}', [FormSubmissionController::class, 'show'])->name('admin.forms.submissions.show');
    Route::put('/submissions/{submission}/status', [FormSubmissionController::class, 'updateStatus'])->name('admin.forms.submissions.status');
    Route::get('/{form}/export', [FormSubmissionController::class, 'export'])->name('admin.forms.submissions.export');
    Route::delete('/submissions/{submission}', [FormSubmissionController::class, 'destroy'])->name('admin.forms.submissions.destroy');
});
