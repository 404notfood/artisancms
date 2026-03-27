<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\WordPressImportService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class WordPressImportController extends Controller
{
    public function __construct(
        private readonly WordPressImportService $importService,
    ) {}

    /**
     * Show the WordPress import page.
     */
    public function index(): Response
    {
        return Inertia::render('Admin/Import/WordPress');
    }

    /**
     * Handle the WXR file upload and run the import.
     */
    public function import(Request $request): RedirectResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:xml', 'max:51200'], // 50 MB max
            'import_pages' => ['boolean'],
            'import_posts' => ['boolean'],
            'import_media' => ['boolean'],
        ]);

        $file = $request->file('file');

        if ($file === null) {
            return back()->with('error', 'Aucun fichier fourni.');
        }

        $path = $file->store('imports/wordpress', 'local');

        if ($path === false) {
            return back()->with('error', 'Impossible de stocker le fichier uploadé.');
        }

        $fullPath = storage_path('app/private/' . $path);

        try {
            $result = $this->importService->import($fullPath, [
                'pages' => $request->boolean('import_pages', true),
                'posts' => $request->boolean('import_posts', true),
                'media' => $request->boolean('import_media', true),
            ]);

            Log::info('WordPress import completed', $result);

            // Clean up the uploaded file
            @unlink($fullPath);

            $hasErrors = count($result['errors']) > 0;
            $message = sprintf(
                'Import terminé : %d pages, %d articles, %d médias, %d catégories, %d tags importés.',
                $result['pages'],
                $result['posts'],
                $result['media'],
                $result['categories'],
                $result['tags'],
            );

            if ($hasErrors) {
                $message .= sprintf(' (%d erreurs)', count($result['errors']));
            }

            return back()->with([
                'success' => $message,
                'import_result' => $result,
            ]);
        } catch (\Throwable $e) {
            Log::error('WordPress import failed', ['exception' => $e->getMessage()]);
            @unlink($fullPath);

            return back()->with('error', 'Erreur lors de l\'import : ' . $e->getMessage());
        }
    }
}
