<?php

declare(strict_types=1);

namespace App\Http\Controllers\Front;

use App\CMS\Themes\ThemeManager;
use App\Http\Controllers\Controller;
use App\Models\Menu;
use App\Services\SearchService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SearchController extends Controller
{
    public function __construct(
        private readonly SearchService $searchService,
        private readonly ThemeManager $themeManager,
    ) {}

    /**
     * Display front-end search results page.
     */
    public function index(Request $request): Response
    {
        $query = $request->input('q', '');
        $type = $request->input('type');
        $page = (int) $request->input('page', 1);
        $perPage = 15;

        $results = [];
        $total = 0;

        if (is_string($query) && mb_strlen($query) >= 2) {
            $searchResults = $this->searchService->search($query, $perPage * $page, $type);
            $allResults = $searchResults['results'];
            $total = $searchResults['total'];

            // Manual pagination for the search service results
            $offset = ($page - 1) * $perPage;
            $results = array_slice($allResults, $offset, $perPage);
        }

        $menus = Menu::with(['items' => function ($q): void {
            $q->orderBy('order');
        }])->get()->keyBy('location');

        $theme = $this->themeManager->getActive();
        $themeConfig = $theme ? $this->themeManager->getThemeConfig($theme->slug) : [];

        return Inertia::render('Front/Search', [
            'menus' => $menus,
            'theme' => [
                'customizations' => $theme?->customizations ?? [],
                'layouts' => $themeConfig['layouts'] ?? [],
            ],
            'query' => $query,
            'type' => $type,
            'results' => $results,
            'total' => $total,
            'pagination' => [
                'current_page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'last_page' => $total > 0 ? (int) ceil($total / $perPage) : 1,
            ],
        ]);
    }
}
