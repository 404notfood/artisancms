import { Head, Link, usePage } from '@inertiajs/react';
import type { OrderData, EcommerceSettingsData } from '@/types/cms';

interface DashboardProps {
    recentOrders: OrderData[];
    stats: {
        total_orders: number;
        total_spent: number;
        pending_orders: number;
        wishlist_count: number;
    };
    settings: EcommerceSettingsData;
}

export default function Dashboard({ recentOrders, stats, settings }: DashboardProps) {
    const { auth } = usePage().props as { auth: { user: { name: string } } };

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
            <Head title="Mon compte" />

            <div className="mx-auto max-w-5xl px-4 py-8">
                <h1 className="mb-2 text-2xl font-bold text-gray-900">
                    Bonjour, {auth.user.name}
                </h1>
                <p className="mb-8 text-gray-600">
                    Bienvenue dans votre espace client.
                </p>

                {/* Stats cards */}
                <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        label="Commandes totales"
                        value={String(stats.total_orders)}
                        icon={<OrderIcon />}
                    />
                    <StatCard
                        label="Total depense"
                        value={formatPrice(stats.total_spent)}
                        icon={<MoneyIcon />}
                    />
                    <StatCard
                        label="Commandes en cours"
                        value={String(stats.pending_orders)}
                        icon={<ClockIcon />}
                    />
                    <StatCard
                        label="Liste de souhaits"
                        value={String(stats.wishlist_count)}
                        icon={<HeartIcon />}
                    />
                </div>

                {/* Quick links */}
                <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <QuickLink
                        href="/account/orders"
                        label="Mes commandes"
                        description="Suivre vos commandes"
                    />
                    <QuickLink
                        href="/account/addresses"
                        label="Mes adresses"
                        description="Gerer vos adresses"
                    />
                    <QuickLink
                        href="/account/wishlist"
                        label="Ma liste de souhaits"
                        description="Produits sauvegardes"
                    />
                </div>

                {/* Recent orders */}
                <div className="rounded-lg border border-gray-200 bg-white">
                    <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Commandes recentes
                        </h2>
                        <Link
                            href="/account/orders"
                            className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                        >
                            Voir tout
                        </Link>
                    </div>

                    {recentOrders.length === 0 ? (
                        <div className="px-6 py-8 text-center text-gray-500">
                            Aucune commande pour le moment.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 font-medium text-gray-700">#</th>
                                        <th className="px-6 py-3 font-medium text-gray-700">Date</th>
                                        <th className="px-6 py-3 font-medium text-gray-700">Articles</th>
                                        <th className="px-6 py-3 font-medium text-gray-700">Statut</th>
                                        <th className="px-6 py-3 font-medium text-gray-700">Total</th>
                                        <th className="px-6 py-3 font-medium text-gray-700"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {recentOrders.map((order) => (
                                        <tr key={order.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                #{order.id}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {formatDate(order.created_at)}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
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
                                                    className="text-indigo-600 hover:text-indigo-800"
                                                >
                                                    Voir
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
    return (
        <div className="rounded-lg border border-gray-200 bg-white p-5">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    {icon}
                </div>
                <div>
                    <p className="text-sm text-gray-500">{label}</p>
                    <p className="text-lg font-semibold text-gray-900">{value}</p>
                </div>
            </div>
        </div>
    );
}

function QuickLink({ href, label, description }: { href: string; label: string; description: string }) {
    return (
        <Link
            href={href}
            className="group rounded-lg border border-gray-200 bg-white p-5 transition-colors hover:border-indigo-300 hover:bg-indigo-50"
        >
            <h3 className="font-semibold text-gray-900 group-hover:text-indigo-700">{label}</h3>
            <p className="mt-1 text-sm text-gray-500">{description}</p>
        </Link>
    );
}

function OrderIcon() {
    return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
    );
}

function MoneyIcon() {
    return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
        </svg>
    );
}

function ClockIcon() {
    return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
}

function HeartIcon() {
    return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
    );
}
