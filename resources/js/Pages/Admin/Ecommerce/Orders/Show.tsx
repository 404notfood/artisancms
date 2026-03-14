import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import type { OrderData, AddressData } from '@/types/cms';

interface OrderShowProps {
    order: OrderData;
}

const statusOptions = [
    { value: 'pending', label: 'En attente' },
    { value: 'processing', label: 'En cours' },
    { value: 'shipped', label: 'Expediee' },
    { value: 'completed', label: 'Terminee' },
    { value: 'cancelled', label: 'Annulee' },
    { value: 'refunded', label: 'Remboursee' },
];

export default function OrderShow({ order }: OrderShowProps) {
    const { data, setData, put, processing } = useForm({
        status: order.status,
    });

    function handleStatusUpdate(e: React.FormEvent) {
        e.preventDefault();
        put(`/admin/shop/orders/${order.id}/status`);
    }

    function formatPrice(price: number): string {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price);
    }

    function formatDate(dateStr: string): string {
        return new Date(dateStr).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    return (
        <AdminLayout
            header={
                <div className="flex items-center gap-4">
                    <Link href="/admin/shop/orders" className="text-gray-500 hover:text-gray-700">
                        <BackIcon />
                    </Link>
                    <h1 className="text-xl font-semibold text-gray-900">Commande #{order.id}</h1>
                    <OrderStatusBadge status={order.status} />
                    <span className="text-sm text-gray-500">
                        {formatDate(order.created_at)}
                    </span>
                </div>
            }
        >
            <Head title={`Commande #${order.id}`} />

            <div className="mx-auto max-w-4xl space-y-6">
                {/* Status Update */}
                <div className="rounded-lg border border-gray-200 bg-white p-6">
                    <form onSubmit={handleStatusUpdate} className="flex items-end gap-4">
                        <div className="flex-1">
                            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                                Modifier le statut
                            </label>
                            <select
                                id="status"
                                value={data.status}
                                onChange={(e) => setData('status', e.target.value as OrderData['status'])}
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                                {statusOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button
                            type="submit"
                            disabled={processing || data.status === order.status}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                        >
                            {processing ? 'Mise a jour...' : 'Mettre a jour'}
                        </button>
                    </form>
                </div>

                {/* Order Items */}
                <div className="rounded-lg border border-gray-200 bg-white">
                    <div className="border-b border-gray-200 px-6 py-4">
                        <h2 className="text-lg font-medium text-gray-900">Articles</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-gray-200 bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 font-medium text-gray-700">Produit</th>
                                    <th className="hidden px-6 py-3 font-medium text-gray-700 sm:table-cell">SKU</th>
                                    <th className="px-6 py-3 font-medium text-gray-700 text-center">Quantite</th>
                                    <th className="px-6 py-3 font-medium text-gray-700 text-right">Prix unitaire</th>
                                    <th className="px-6 py-3 font-medium text-gray-700 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {order.items && order.items.length > 0 ? (
                                    order.items.map((item) => (
                                        <tr key={item.id}>
                                            <td className="px-6 py-3 font-medium text-gray-900">
                                                {item.name}
                                            </td>
                                            <td className="hidden px-6 py-3 text-gray-500 sm:table-cell">
                                                {item.product_id ? (
                                                    <span className="font-mono text-xs">#{item.product_id}</span>
                                                ) : (
                                                    '---'
                                                )}
                                            </td>
                                            <td className="px-6 py-3 text-center text-gray-600">
                                                {item.quantity}
                                            </td>
                                            <td className="px-6 py-3 text-right text-gray-600">
                                                {formatPrice(item.price)}
                                            </td>
                                            <td className="px-6 py-3 text-right font-medium text-gray-900">
                                                {formatPrice(item.total)}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                            Aucun article dans cette commande.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals */}
                    <div className="border-t border-gray-200 px-6 py-4">
                        <div className="ml-auto max-w-xs space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Sous-total</span>
                                <span className="font-medium text-gray-900">{formatPrice(order.subtotal)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">TVA</span>
                                <span className="font-medium text-gray-900">{formatPrice(order.tax)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Livraison</span>
                                <span className="font-medium text-gray-900">{formatPrice(order.shipping)}</span>
                            </div>
                            <div className="flex justify-between border-t border-gray-200 pt-2">
                                <span className="font-semibold text-gray-900">Total</span>
                                <span className="text-lg font-bold text-gray-900">{formatPrice(order.total)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Customer Info */}
                    <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-3">
                        <h2 className="text-lg font-medium text-gray-900">Client</h2>
                        {order.user ? (
                            <div className="space-y-1 text-sm">
                                <p className="font-medium text-gray-900">{order.user.name}</p>
                                <p className="text-gray-600">{order.user.email}</p>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">Client invite</p>
                        )}

                        <div className="border-t border-gray-100 pt-3 space-y-1 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Mode de paiement</span>
                                <span className="text-gray-900">{order.payment_method ?? '---'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Statut paiement</span>
                                <PaymentBadge status={order.payment_status} />
                            </div>
                            {order.completed_at && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Terminee le</span>
                                    <span className="text-gray-900">{formatDate(order.completed_at)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Addresses */}
                    <div className="space-y-6">
                        <AddressCard
                            title="Adresse de livraison"
                            address={order.shipping_address}
                        />
                        <AddressCard
                            title="Adresse de facturation"
                            address={order.billing_address}
                        />
                    </div>
                </div>

                {/* Notes */}
                {order.notes && (
                    <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-2">
                        <h2 className="text-lg font-medium text-gray-900">Notes</h2>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{order.notes}</p>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}

function AddressCard({ title, address }: { title: string; address: AddressData | null }) {
    if (!address) {
        return (
            <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-2">
                <h2 className="text-sm font-medium text-gray-900">{title}</h2>
                <p className="text-sm text-gray-400">Non renseignee</p>
            </div>
        );
    }

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-1">
            <h2 className="text-sm font-medium text-gray-900 mb-2">{title}</h2>
            <p className="text-sm text-gray-700 font-medium">
                {address.first_name} {address.last_name}
            </p>
            <p className="text-sm text-gray-600">{address.address}</p>
            {address.address2 && (
                <p className="text-sm text-gray-600">{address.address2}</p>
            )}
            <p className="text-sm text-gray-600">
                {address.postal_code} {address.city}
            </p>
            <p className="text-sm text-gray-600">{address.country}</p>
            {address.phone && (
                <p className="text-sm text-gray-500 mt-1">{address.phone}</p>
            )}
        </div>
    );
}

function OrderStatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        pending: 'bg-yellow-100 text-yellow-800',
        processing: 'bg-blue-100 text-blue-800',
        shipped: 'bg-purple-100 text-purple-800',
        completed: 'bg-green-100 text-green-800',
        cancelled: 'bg-red-100 text-red-800',
        refunded: 'bg-gray-100 text-gray-800',
    };
    const labels: Record<string, string> = {
        pending: 'En attente',
        processing: 'En cours',
        shipped: 'Expediee',
        completed: 'Terminee',
        cancelled: 'Annulee',
        refunded: 'Remboursee',
    };
    return (
        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${styles[status] ?? 'bg-gray-100 text-gray-800'}`}>
            {labels[status] ?? status}
        </span>
    );
}

function PaymentBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        pending: 'bg-yellow-100 text-yellow-800',
        paid: 'bg-green-100 text-green-800',
        failed: 'bg-red-100 text-red-800',
        refunded: 'bg-gray-100 text-gray-800',
    };
    const labels: Record<string, string> = {
        pending: 'En attente',
        paid: 'Paye',
        failed: 'Echoue',
        refunded: 'Rembourse',
    };
    return (
        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${styles[status] ?? 'bg-gray-100 text-gray-800'}`}>
            {labels[status] ?? status}
        </span>
    );
}

function BackIcon() {
    return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
    );
}
