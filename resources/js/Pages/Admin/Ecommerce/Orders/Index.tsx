import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import type { OrderData, PaginatedResponse, SharedProps } from '@/types/cms';
import { formatDate } from '@/lib/format';
import StatusBadge from '@/Components/admin/status-badge';

interface OrdersIndexProps {
    orders: PaginatedResponse<OrderData>;
    filters: {
        status?: string;
        search?: string;
    };
}

const statusTabs = [
    { label: 'Tout', value: '' },
    { label: 'En attente', value: 'pending' },
    { label: 'En cours', value: 'processing' },
    { label: 'Expediees', value: 'shipped' },
    { label: 'Terminees', value: 'completed' },
    { label: 'Annulees', value: 'cancelled' },
    { label: 'Remboursees', value: 'refunded' },
];

export default function OrdersIndex({ orders, filters }: OrdersIndexProps) {
    const { cms } = usePage<SharedProps>().props;
    const prefix = cms?.adminPrefix ?? 'admin';
    const [search, setSearch] = useState(filters.search ?? '');

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        router.get(`/${prefix}/shop/orders`, { search, status: filters.status }, { preserveState: true });
    }

    function handleTabChange(status: string) {
        router.get(`/${prefix}/shop/orders`, { status, search: filters.search }, { preserveState: true });
    }

    function formatPrice(price: number): string {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price);
    }

    return (
        <AdminLayout
            header={
                <h1 className="text-xl font-semibold text-gray-900">Commandes</h1>
            }
        >
            <Head title="Commandes" />

            <div className="rounded-lg border border-gray-200 bg-white">
                {/* Tabs + Search */}
                <div className="flex flex-col gap-4 border-b border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap gap-1">
                        {statusTabs.map((tab) => (
                            <button
                                key={tab.value}
                                onClick={() => handleTabChange(tab.value)}
                                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                                    (filters.status ?? '') === tab.value
                                        ? 'bg-indigo-100 text-indigo-700'
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSearch} className="flex gap-2">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Rechercher..."
                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <button
                            type="submit"
                            className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                        >
                            Rechercher
                        </button>
                    </form>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-gray-200 bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 font-medium text-gray-700">#</th>
                                <th className="px-4 py-3 font-medium text-gray-700">Client</th>
                                <th className="px-4 py-3 font-medium text-gray-700">Total</th>
                                <th className="px-4 py-3 font-medium text-gray-700">Statut</th>
                                <th className="hidden px-4 py-3 font-medium text-gray-700 md:table-cell">Paiement</th>
                                <th className="hidden px-4 py-3 font-medium text-gray-700 sm:table-cell">Date</th>
                                <th className="px-4 py-3 font-medium text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {orders.data.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                                        Aucune commande trouvee.
                                    </td>
                                </tr>
                            ) : (
                                orders.data.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium text-gray-900">
                                            #{order.id}
                                        </td>
                                        <td className="px-4 py-3">
                                            {order.user ? (
                                                <div>
                                                    <p className="font-medium text-gray-900">{order.user.name}</p>
                                                    <p className="text-xs text-gray-500">{order.user.email}</p>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">Invite</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-gray-900">
                                            {formatPrice(order.total)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadge status={order.status} />
                                        </td>
                                        <td className="hidden px-4 py-3 md:table-cell">
                                            <StatusBadge status={order.payment_status} />
                                        </td>
                                        <td className="hidden px-4 py-3 text-gray-500 sm:table-cell">
                                            {formatDate(order.created_at)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Link
                                                href={`/admin/shop/orders/${order.id}`}
                                                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                                            >
                                                Voir
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {orders.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
                        <p className="text-sm text-gray-600">
                            {orders.from}--{orders.to} sur {orders.total}
                        </p>
                        <div className="flex gap-1">
                            {Array.from({ length: orders.last_page }, (_, i) => i + 1).map((p) => (
                                <Link
                                    key={p}
                                    href={`/admin/shop/orders?page=${p}&status=${filters.status ?? ''}&search=${filters.search ?? ''}`}
                                    className={`rounded px-3 py-1 text-sm ${
                                        p === orders.current_page
                                            ? 'bg-indigo-600 text-white'
                                            : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    {p}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}

