<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\AnalyticsService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AnalyticsController extends Controller
{
    public function __construct(
        private readonly AnalyticsService $analyticsService,
    ) {}

    /**
     * Afficher le tableau de bord analytique.
     */
    public function index(Request $request): Response
    {
        $period = $request->query('period', '30d');

        // Valider la periode
        $validPeriods = ['7d', '30d', '90d', '1y'];
        if (!in_array($period, $validPeriods, true)) {
            $period = '30d';
        }

        $overview = $this->analyticsService->getOverview($period);

        return Inertia::render('Admin/Analytics', [
            'overview' => $overview,
            'period'   => $period,
            'periods'  => $validPeriods,
        ]);
    }
}
