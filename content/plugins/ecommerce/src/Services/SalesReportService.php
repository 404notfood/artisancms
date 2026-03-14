<?php

declare(strict_types=1);

namespace Ecommerce\Services;

use Ecommerce\Models\Order;
use Ecommerce\Models\OrderItem;
use Ecommerce\Models\Product;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class SalesReportService
{
    /**
     * Get dashboard KPIs for a given period.
     *
     * @return array{revenue: float, orders_count: int, average_order: float, items_sold: int}
     */
    public function getKpis(string $period = '30d'): array
    {
        $from = $this->periodToDate($period);

        $stats = Order::where('created_at', '>=', $from)
            ->whereNotIn('status', ['cancelled', 'refunded'])
            ->selectRaw('COALESCE(SUM(total), 0) as revenue')
            ->selectRaw('COUNT(*) as orders_count')
            ->selectRaw('COALESCE(AVG(total), 0) as average_order')
            ->first();

        $itemsSold = OrderItem::whereHas('order', function ($q) use ($from) {
            $q->where('created_at', '>=', $from)
              ->whereNotIn('status', ['cancelled', 'refunded']);
        })->sum('quantity');

        return [
            'revenue' => round((float) $stats->revenue, 2),
            'orders_count' => (int) $stats->orders_count,
            'average_order' => round((float) $stats->average_order, 2),
            'items_sold' => (int) $itemsSold,
        ];
    }

    /**
     * Compare KPIs with previous period.
     *
     * @return array{current: array, previous: array, changes: array}
     */
    public function getKpisWithComparison(string $period = '30d'): array
    {
        $from = $this->periodToDate($period);
        $diff = now()->diffInDays($from);
        $previousFrom = (clone $from)->subDays($diff);

        $current = $this->getKpisForRange($from, now());
        $previous = $this->getKpisForRange($previousFrom, $from);

        $changes = [];
        foreach (['revenue', 'orders_count', 'average_order', 'items_sold'] as $key) {
            $prev = $previous[$key] ?? 0;
            $changes[$key] = $prev > 0
                ? round((($current[$key] - $prev) / $prev) * 100, 1)
                : ($current[$key] > 0 ? 100.0 : 0.0);
        }

        return [
            'current' => $current,
            'previous' => $previous,
            'changes' => $changes,
        ];
    }

    /**
     * Revenue chart data grouped by day/week/month.
     *
     * @return array<int, array{date: string, revenue: float, orders: int}>
     */
    public function getRevenueChart(string $period = '30d', string $groupBy = 'day'): array
    {
        $from = $this->periodToDate($period);

        $format = match ($groupBy) {
            'week' => '%x-W%v',
            'month' => '%Y-%m',
            default => '%Y-%m-%d',
        };

        $rows = Order::where('created_at', '>=', $from)
            ->whereNotIn('status', ['cancelled', 'refunded'])
            ->selectRaw("DATE_FORMAT(created_at, '{$format}') as period")
            ->selectRaw('COALESCE(SUM(total), 0) as revenue')
            ->selectRaw('COUNT(*) as orders')
            ->groupBy('period')
            ->orderBy('period')
            ->get();

        return $rows->map(fn ($row) => [
            'date' => $row->period,
            'revenue' => round((float) $row->revenue, 2),
            'orders' => (int) $row->orders,
        ])->toArray();
    }

    /**
     * Top selling products.
     *
     * @return array<int, array{id: int, name: string, sku: string|null, quantity: int, revenue: float}>
     */
    public function getTopProducts(string $period = '30d', int $limit = 10): array
    {
        $from = $this->periodToDate($period);

        return OrderItem::join('orders', 'orders.id', '=', 'order_items.order_id')
            ->where('orders.created_at', '>=', $from)
            ->whereNotIn('orders.status', ['cancelled', 'refunded'])
            ->leftJoin('products', 'products.id', '=', 'order_items.product_id')
            ->selectRaw('order_items.product_id as id')
            ->selectRaw('order_items.name')
            ->selectRaw('products.sku')
            ->selectRaw('SUM(order_items.quantity) as quantity')
            ->selectRaw('SUM(order_items.total) as revenue')
            ->groupBy('order_items.product_id', 'order_items.name', 'products.sku')
            ->orderByDesc('revenue')
            ->limit($limit)
            ->get()
            ->map(fn ($row) => [
                'id' => (int) $row->id,
                'name' => $row->name,
                'sku' => $row->sku,
                'quantity' => (int) $row->quantity,
                'revenue' => round((float) $row->revenue, 2),
            ])
            ->toArray();
    }

    /**
     * Order status distribution.
     *
     * @return array<string, int>
     */
    public function getOrderStatusDistribution(string $period = '30d'): array
    {
        $from = $this->periodToDate($period);

        return Order::where('created_at', '>=', $from)
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();
    }

    /**
     * Payment method distribution.
     *
     * @return array<int, array{method: string, count: int, total: float}>
     */
    public function getPaymentMethodStats(string $period = '30d'): array
    {
        $from = $this->periodToDate($period);

        return Order::where('created_at', '>=', $from)
            ->whereNotIn('status', ['cancelled', 'refunded'])
            ->selectRaw("COALESCE(payment_method, 'unknown') as method")
            ->selectRaw('COUNT(*) as count')
            ->selectRaw('COALESCE(SUM(total), 0) as total')
            ->groupBy('payment_method')
            ->get()
            ->map(fn ($row) => [
                'method' => $row->method,
                'count' => (int) $row->count,
                'total' => round((float) $row->total, 2),
            ])
            ->toArray();
    }

    /**
     * Recent orders list.
     *
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getRecentOrders(int $limit = 10)
    {
        return Order::with('user:id,name,email')
            ->recent()
            ->limit($limit)
            ->get(['id', 'user_id', 'status', 'payment_status', 'total', 'created_at']);
    }

    /**
     * Low stock products.
     */
    public function getLowStockProducts(int $threshold = 5, int $limit = 10): array
    {
        return Product::where('stock', '<=', $threshold)
            ->where('stock', '>', 0)
            ->where('status', 'published')
            ->orderBy('stock')
            ->limit($limit)
            ->get(['id', 'name', 'sku', 'stock', 'price'])
            ->toArray();
    }

    private function getKpisForRange(Carbon $from, Carbon $to): array
    {
        $stats = Order::whereBetween('created_at', [$from, $to])
            ->whereNotIn('status', ['cancelled', 'refunded'])
            ->selectRaw('COALESCE(SUM(total), 0) as revenue')
            ->selectRaw('COUNT(*) as orders_count')
            ->selectRaw('COALESCE(AVG(total), 0) as average_order')
            ->first();

        $itemsSold = OrderItem::whereHas('order', function ($q) use ($from, $to) {
            $q->whereBetween('created_at', [$from, $to])
              ->whereNotIn('status', ['cancelled', 'refunded']);
        })->sum('quantity');

        return [
            'revenue' => round((float) $stats->revenue, 2),
            'orders_count' => (int) $stats->orders_count,
            'average_order' => round((float) $stats->average_order, 2),
            'items_sold' => (int) $itemsSold,
        ];
    }

    private function periodToDate(string $period): Carbon
    {
        return match ($period) {
            '7d' => now()->subDays(7),
            '30d' => now()->subDays(30),
            '90d' => now()->subDays(90),
            '12m' => now()->subMonths(12),
            'year' => now()->startOfYear(),
            'all' => Carbon::createFromDate(2020, 1, 1),
            default => now()->subDays(30),
        };
    }
}
