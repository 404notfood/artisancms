import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { DollarSign, ShoppingBag, ShoppingCart, Package, CheckCircle } from 'lucide-react';

interface KpiData {
    current: {
        revenue: number;
        orders_count: number;
        average_order: number;
        items_sold: number;
    };
    previous: {
        revenue: number;
        orders_count: number;
        average_order: number;
        items_sold: number;
    };
    changes: {
        revenue: number;
        orders_count: number;
        average_order: number;
        items_sold: number;
    };
}

interface ChartPoint {
    date: string;
    revenue: number;
    orders: number;
}

interface TopProduct {
    id: number;
    name: string;
    sku: string | null;
    quantity: number;
    revenue: number;
}

interface RecentOrder {
    id: number;
    user_id: number | null;
    status: string;
    payment_status: string;
    total: string;
    created_at: string;
    user?: { id: number; name: string; email: string };
}

interface PaymentStat {
    method: string;
    count: number;
    total: number;
}

interface LowStockProduct {
    id: number;
    name: string;
    sku: string | null;
    stock: number;
    price: string;
}

interface ReportsProps {
    period: string;
    kpis: KpiData;
    revenueChart: ChartPoint[];
    topProducts: TopProduct[];
    statusDistribution: Record<string, number>;
    paymentStats: PaymentStat[];
    recentOrders: RecentOrder[];
    lowStock: LowStockProduct[];
}

const PERIODS = [
    { value: '7d', label: '7 jours' },
    { value: '30d', label: '30 jours' },
    { value: '90d', label: '90 jours' },
    { value: '12m', label: '12 mois' },
    { value: 'year', label: 'Cette annee' },
];

const STATUS_LABELS: Record<string, string> = {
    pending: 'En attente',
    processing: 'En cours',
    shipped: 'Expediee',
    completed: 'Terminee',
    cancelled: 'Annulee',
    refunded: 'Remboursee',
};

const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-indigo-100 text-indigo-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-100 text-gray-800',
};

function formatCurrency(amount: number | string): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(num);
}

export default function ReportsIndex({
    period,
    kpis,
    revenueChart,
    topProducts,
    statusDistribution,
    paymentStats,
    recentOrders,
    lowStock,
}: ReportsProps) {
    function changePeriod(newPeriod: string) {
        router.get('/admin/shop/reports', { period: newPeriod }, { preserveState: true });
    }

    const maxRevenue = Math.max(...revenueChart.map((p) => p.revenue), 1);

    return (
        <AdminLayout
            header={
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-gray-900">Rapports des ventes</h1>
                    <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1">
                        {PERIODS.map((p) => (
                            <button
                                key={p.value}
                                type="button"
                                onClick={() => changePeriod(p.value)}
                                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                                    period === p.value
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>
            }
        >
            <Head title="Rapports des ventes" />

            <div className="space-y-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <KpiCard
                        label="Chiffre d'affaires"
                        value={formatCurrency(kpis.current.revenue)}
                        change={kpis.changes.revenue}
                        icon={<DollarSign className="h-5 w-5" />}
                    />
                    <KpiCard
                        label="Commandes"
                        value={String(kpis.current.orders_count)}
                        change={kpis.changes.orders_count}
                        icon={<ShoppingBag className="h-5 w-5" />}
                    />
                    <KpiCard
                        label="Panier moyen"
                        value={formatCurrency(kpis.current.average_order)}
                        change={kpis.changes.average_order}
                        icon={<ShoppingCart className="h-5 w-5" />}
                    />
                    <KpiCard
                        label="Articles vendus"
                        value={String(kpis.current.items_sold)}
                        change={kpis.changes.items_sold}
                        icon={<Package className="h-5 w-5" />}
                    />
                </div>

                {/* Revenue Chart */}
                <div className="rounded-lg border border-gray-200 bg-white p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Revenus</h2>
                    {revenueChart.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-8">Aucune donnee pour cette periode.</p>
                    ) : (
                        <div className="space-y-2">
                            <div className="flex items-end gap-1" style={{ height: '200px' }}>
                                {revenueChart.map((point, i) => (
                                    <div
                                        key={i}
                                        className="group relative flex-1 min-w-[4px]"
                                        style={{ height: '100%' }}
                                    >
                                        <div
                                            className="absolute bottom-0 left-0 right-0 rounded-t bg-indigo-500 hover:bg-indigo-600 transition-colors"
                                            style={{
                                                height: `${Math.max((point.revenue / maxRevenue) * 100, 2)}%`,
                                            }}
                                        />
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                                            <div className="rounded-lg bg-gray-900 px-3 py-2 text-xs text-white shadow-lg whitespace-nowrap">
                                                <div className="font-medium">{point.date}</div>
                                                <div>{formatCurrency(point.revenue)}</div>
                                                <div>{point.orders} commande{point.orders !== 1 ? 's' : ''}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between text-xs text-gray-400">
                                <span>{revenueChart[0]?.date}</span>
                                <span>{revenueChart[revenueChart.length - 1]?.date}</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Top Products */}
                    <div className="rounded-lg border border-gray-200 bg-white p-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Meilleurs produits</h2>
                        {topProducts.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-4">Aucune vente.</p>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {topProducts.map((product, i) => (
                                    <div key={product.id} className="flex items-center gap-3 py-3">
                                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                                            {i + 1}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                                            {product.sku && (
                                                <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium text-gray-900">
                                                {formatCurrency(product.revenue)}
                                            </p>
                                            <p className="text-xs text-gray-500">{product.quantity} vendus</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Order Status Distribution */}
                    <div className="rounded-lg border border-gray-200 bg-white p-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Statut des commandes</h2>
                        <div className="space-y-3">
                            {Object.entries(statusDistribution).map(([status, count]) => {
                                const total = Object.values(statusDistribution).reduce((a, b) => a + b, 0);
                                const pct = total > 0 ? (count / total) * 100 : 0;
                                return (
                                    <div key={status} className="space-y-1">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-800'}`}>
                                                {STATUS_LABELS[status] ?? status}
                                            </span>
                                            <span className="text-gray-600">{count}</span>
                                        </div>
                                        <div className="h-2 rounded-full bg-gray-100">
                                            <div
                                                className="h-2 rounded-full bg-indigo-500"
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                            {Object.keys(statusDistribution).length === 0 && (
                                <p className="text-sm text-gray-500 text-center py-4">Aucune commande.</p>
                            )}
                        </div>
                    </div>

                    {/* Payment Methods */}
                    <div className="rounded-lg border border-gray-200 bg-white p-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Methodes de paiement</h2>
                        {paymentStats.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-4">Aucune donnee.</p>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {paymentStats.map((stat) => (
                                    <div key={stat.method} className="flex items-center justify-between py-3">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 capitalize">
                                                {stat.method === 'unknown' ? 'Non specifie' : stat.method}
                                            </p>
                                            <p className="text-xs text-gray-500">{stat.count} commande{stat.count !== 1 ? 's' : ''}</p>
                                        </div>
                                        <p className="text-sm font-medium text-gray-900">{formatCurrency(stat.total)}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Low Stock Alert */}
                    <div className="rounded-lg border border-gray-200 bg-white p-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">
                            Stock faible
                            {lowStock.length > 0 && (
                                <span className="ml-2 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                                    {lowStock.length}
                                </span>
                            )}
                        </h2>
                        {lowStock.length === 0 ? (
                            <div className="text-center py-4">
                                <CheckCircle className="h-8 w-8 text-green-400 mx-auto" />
                                <p className="text-sm text-gray-500 mt-2">Tous les stocks sont suffisants.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {lowStock.map((product) => (
                                    <div key={product.id} className="flex items-center justify-between py-3">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{product.name}</p>
                                            {product.sku && (
                                                <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                                            )}
                                        </div>
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                            product.stock <= 2
                                                ? 'bg-red-100 text-red-800'
                                                : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {product.stock} en stock
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Orders */}
                <div className="rounded-lg border border-gray-200 bg-white p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Dernieres commandes</h2>
                    {recentOrders.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">Aucune commande recente.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead>
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">#</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Client</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Statut</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Paiement</th>
                                        <th className="px-3 py-2 text-right text-xs font-medium uppercase text-gray-500">Total</th>
                                        <th className="px-3 py-2 text-right text-xs font-medium uppercase text-gray-500">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {recentOrders.map((order) => (
                                        <tr key={order.id} className="hover:bg-gray-50">
                                            <td className="px-3 py-2 text-sm font-medium text-gray-900">#{order.id}</td>
                                            <td className="px-3 py-2 text-sm text-gray-700">
                                                {order.user?.name ?? 'Invite'}
                                            </td>
                                            <td className="px-3 py-2">
                                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-800'}`}>
                                                    {STATUS_LABELS[order.status] ?? order.status}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2">
                                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                                    order.payment_status === 'paid'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                    {order.payment_status === 'paid' ? 'Paye' : 'En attente'}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 text-right text-sm font-medium text-gray-900">
                                                {formatCurrency(order.total)}
                                            </td>
                                            <td className="px-3 py-2 text-right text-sm text-gray-500">
                                                {new Date(order.created_at).toLocaleDateString('fr-FR', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}

// --- KPI Card ---

function KpiCard({ label, value, change, icon }: { label: string; value: string; change: number; icon: React.ReactNode }) {
    const isPositive = change >= 0;
    return (
        <div className="rounded-lg border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">{label}</span>
                <span className="text-gray-400">{icon}</span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
            <div className="mt-1 flex items-center gap-1">
                <span className={`text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {isPositive ? '+' : ''}{change}%
                </span>
                <span className="text-xs text-gray-400">vs periode precedente</span>
            </div>
        </div>
    );
}

