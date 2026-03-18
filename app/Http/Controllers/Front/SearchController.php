<?php

declare(strict_types=1);

namespace App\Http\Controllers\Front;

use App\Http\Controllers\Concerns\HasFrontData;
use App\Http\Controllers\Controller;
use App\Services\SearchService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SearchController extends Controller
{
    use HasFrontData;

    private const PER_PAGE = 15;

    public function __construct(
        private readonly SearchService $searchService,
    ) {}

    public function index(Request $request): Response
    {
        $query = $request->string('q', '')->toString();
        $type = $request->input('type');
        $page = max(1, $request->integer('page', 1));

        $results = [];
        $total = 0;

        if (mb_strlen($query) >= 2) {
            $searchResults = $this->searchService->search($query, self::PER_PAGE, $type);
            $results = $searchResults['results'];
            $total = $searchResults['total'];
        }

        return Inertia::render('Front/Search', [
            ...$this->frontData(),
            'query' => $query,
            'type' => $type,
            'results' => $results,
            'total' => $total,
            'pagination' => [
                'current_page' => $page,
                'per_page' => self::PER_PAGE,
                'total' => $total,
                'last_page' => $total > 0 ? (int) ceil($total / self::PER_PAGE) : 1,
            ],
        ]);
    }
}
