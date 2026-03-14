<?php

declare(strict_types=1);

namespace Ecommerce\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Ecommerce\Services\SalesReportService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function __construct(
        private readonly SalesReportService $reportService,
    ) {}

    /**
     * Sales dashboard with KPIs, charts, and reports.
     */
    public function index(Request $request): Response
    {
        $period = $request->input('period', '30d');

        $kpis = $this->reportService->getKpisWithComparison($period);
        $revenueChart = $this->reportService->getRevenueChart($period);
        $topProducts = $this->reportService->getTopProducts($period);
        $statusDistribution = $this->reportService->getOrderStatusDistribution($period);
        $paymentStats = $this->reportService->getPaymentMethodStats($period);
        $recentOrders = $this->reportService->getRecentOrders();
        $lowStock = $this->reportService->getLowStockProducts();

        return Inertia::render('Admin/Ecommerce/Reports/Index', [
            'period' => $period,
            'kpis' => $kpis,
            'revenueChart' => $revenueChart,
            'topProducts' => $topProducts,
            'statusDistribution' => $statusDistribution,
            'paymentStats' => $paymentStats,
            'recentOrders' => $recentOrders,
            'lowStock' => $lowStock,
        ]);
    }
}
