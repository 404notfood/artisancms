<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Services\SearchService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function __construct(
        private readonly SearchService $searchService,
    ) {}

    /**
     * Public search API endpoint.
     */
    public function search(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'q' => ['required', 'string', 'min:2', 'max:200'],
            'type' => ['nullable', 'string', 'in:all,pages,posts'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $results = $this->searchService->search(
            $validated['q'],
            $validated['per_page'] ?? 20,
            $validated['type'] ?? null,
        );

        return response()->json($results);
    }
}
