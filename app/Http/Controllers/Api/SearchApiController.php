<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SearchLog;
use App\Services\SearchService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchApiController extends Controller
{
    private const MAX_RESULTS = 10;

    public function __construct(
        private readonly SearchService $searchService,
    ) {}

    public function search(Request $request): JsonResponse
    {
        $query = trim($request->input('q', ''));

        if (mb_strlen($query) < 2) {
            return response()->json(['results' => []]);
        }

        $searchResults = $this->searchService->searchAll($query, self::MAX_RESULTS);

        SearchLog::create([
            'query' => $query,
            'results_count' => $searchResults['total'],
            'user_id' => auth()->id(),
            'ip_address' => $request->ip(),
            'source' => 'front',
        ]);

        return response()->json(['results' => $searchResults['results']]);
    }
}
