import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import type { OrderData, EcommerceSettingsData, PaginatedResponse } from '@/types/cms';

interface OrdersProps {
    orders: PaginatedResponse<OrderData>;
    filters: {
        status?: string;
    };
    settings: EcommerceSettingsData;
}

const statusTabs = [
    { label: 'Toutes', value: '' },
    { label: 'En attente', value: 'pending' },
    { label: 'En traitement', value: 'processing' },
    { label: 'Expediees', value: 'shipped' },
    { label: 'Terminees', value: 'completed' },
    { label: 'Annulees', value: 'cancelled' },
];

export default function Orders({ orders, filters, settings }: OrdersProps) {
    const [activeStatus, setActiveStatus] = useState(filters.status ?? '');

    function formatPrice(price: number): string {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: settings.currency || 'EUR',
        }).format(price);
    }

    function formatDate(dateStr: string): string {
        return new Date(dateStr).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    }

    function handleFilterChange(status: string) {
        setActiveStatus(status);
        router.get('/account/orders', status ? { status } : {}, { preserveState: true });
    }

    const statusLabels: Record<string, string> = {
        pending: 'En attente',
        processing: 'En traitement',
        shipped: 'Expediee',
        completed: 'Terminee',
        cancelled: 'Annulee',
        refunded: 'Remboursee',
    };

    const statusColors: Record<string, string> = {
        pending: 'bg-yellow-100 text-yellow-800',
        processing: 'bg-blue-100 text-blue-800',
        shipped: 'bg-indigo-100 text-indigo-800',
        completed: 'bg-green-100 text-green-800',
        cancelled: 'bg-red-100 text-red-800',
        refunded: 'bg-gray-100 text-gray-800',
    };

    return (
        <>
            <Head title="Mes commandes" />

            <div className="mx-auto max-w-5xl px-4 py-8">
                <h1 className="mb-6 text-2xl font-bold text-gray-900">Mes commandes</h1>

                <div className="rounded-lg border border-gray-200 bg-white">
                    {/* Status filter tabs */}
                    <div className="flex flex-wrap gap-1 border-b border-gray-200 px-4 py-3">
                        {statusTabs.map((tab) => (
                            <button
                                key={tab.value}
                                onClick={() => handleFilterChange(tab.value)}
                                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                                    activeStatus === tab.value
                                        ? 'bg-indigo-100 text-indigo-700'
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Orders table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 font-medium text-gray-700">#</th>
                                    <th className="px-6 py-3 font-medium text-gray-700">Date</th>
                                    <th className="hidden px-6 py-3 font-medium text-gray-700 sm:table-cell">Articles</th>
                                    <th className="px-6 py-3 font-medium text-gray-700">Statut</th>
                                    <th className="px-6 py-3 font-medium text-gray-700">Total</th>
                                    <th className="px-6 py-3 font-medium text-gray-700"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {orders.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                            Aucune commande trouvee.
                                        </td>
                                    </tr>
                                ) : (
                                    orders.data.map((order) => (
                                        <tr key={order.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                #{order.id}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {formatDate(order.created_at)}
                                            </td>
                                            <td className="hidden px-6 py-4 text-gray-600 sm:table-cell">
                                                {order.items?.length ?? 0} article(s)
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[order.status] ?? 'bg-gray-100 text-gray-800'}`}
                                                >
                                                    {statusLabels[order.status] ?? order.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                {formatPrice(order.total)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Link
                                                    href={`/account/orders/${order.id}`}
                                                    className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800"
                                                >
                                                    Voir
                                                    <ArrowRightIcon />
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
                        <div className="flex items-center justify-between border-t border-gray-200 px-6 py-3">
                            <p className="text-sm text-gray-600">
                                {orders.from}--{orders.to} sur {orders.total}
                            </p>
                            <div className="flex gap-1">
                                {Array.from({ length: orders.last_page }, (_, i) => i + 1).map((p) => (
                                    <Link
                                        key={p}
                                        href={`/account/orders?page=${p}&status=${activeStatus}`}
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
            </div>
        </>
    );
}

function ArrowRightIcon() {
    return (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
    );
}
