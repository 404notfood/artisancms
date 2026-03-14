<?php

declare(strict_types=1);

use AiAssistant\Http\Controllers\AiController;
use Illuminate\Support\Facades\Route;

Route::middleware(['web', 'auth', 'ai.rate_limit'])->prefix('api/ai')->group(function () {
    // AI generation actions
    Route::post('/generate', [AiController::class, 'generate'])->name('api.ai.generate');
    Route::post('/improve', [AiController::class, 'improve'])->name('api.ai.improve');
    Route::post('/seo', [AiController::class, 'seo'])->name('api.ai.seo');
    Route::post('/alt-text', [AiController::class, 'altText'])->name('api.ai.alt-text');
    Route::post('/translate', [AiController::class, 'translate'])->name('api.ai.translate');
    Route::post('/summarize', [AiController::class, 'summarize'])->name('api.ai.summarize');

    // Usage information
    Route::get('/usage', [AiController::class, 'usage'])->name('api.ai.usage');
    Route::get('/estimate', [AiController::class, 'estimate'])->name('api.ai.estimate');
});
