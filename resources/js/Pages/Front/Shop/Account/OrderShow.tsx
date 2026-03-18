import { Head, Link } from '@inertiajs/react';
import type { OrderData, EcommerceSettingsData } from '@/types/cms';

interface Props {
    order: OrderData;
    settings: EcommerceSettingsData;
}

const statusLabels: Record<string, string> = {
    pending: 'En attente',
    processing: 'En cours',
    shipped: 'Exp\u00e9di\u00e9e',
    completed: 'Termin\u00e9e',
    cancelled: 'Annul\u00e9e',
    refunded: 'Rembours\u00e9e',
};

const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-100 text-gray-800',
};

const paymentStatusLabels: Record<string, string> = {
    pending: 'En attente',
    paid: 'Pay\u00e9',
    failed: '\u00c9chou\u00e9',
    refunded: 'Rembours\u00e9',
};

export default function OrderShow({ order, settings }: Props) {
    function formatPrice(price: number): string {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: settings.currency || 'EUR',
        }).format(price);
    }

    function formatDate(dateStr: string): string {
        return new Date(dateStr).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    return (
        <>
            <Head title={`Commande #${order.id}`} />

            <div className="container py-8">
                <div className="mx-auto max-w-3xl">
                    <div className="mb-6 flex items-center gap-4">
                        <Link
                            href="/account/orders"
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                            </svg>
                        </Link>
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-gray-900">Commande #{order.id}</h1>
                            <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
                        </div>
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                            {statusLabels[order.status] || order.status}
                        </span>
                    </div>

                    <div className="space-y-6">
                        {/* Items */}
                        <div className="rounded-lg border border-gray-200 bg-white p-6">
                            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">Articles</h2>
                            <div className="divide-y divide-gray-100">
                                {order.items?.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between py-3">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{item.name}</p>
                                            <p className="text-xs text-gray-500">
                                                {formatPrice(item.price)} x {item.quantity}
                                            </p>
                                        </div>
                                        <span className="text-sm font-semibold text-gray-900">{formatPrice(item.total)}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 space-y-2 border-t border-gray-200 pt-4 text-sm">
                                <div className="flex justify-between text-gray-600">
                                    <span>Sous-total</span>
                                    <span>{formatPrice(order.subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>TVA</span>
                                    <span>{formatPrice(order.tax)}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Livraison</span>
                                    <span>{order.shipping === 0 ? 'Gratuite' : formatPrice(order.shipping)}</span>
                                </div>
                                <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold text-gray-900">
                                    <span>Total</span>
                                    <span>{formatPrice(order.total)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Payment & Shipping */}
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            {/* Payment */}
                            <div className="rounded-lg border border-gray-200 bg-white p-6">
                                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">Paiement</h2>
                                <div className="space-y-2 text-sm">
                                    {order.payment_method && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">M\u00e9thode</span>
                                            <span className="font-medium text-gray-900">{order.payment_method}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Statut</span>
                                        <span className="font-medium text-gray-900">{paymentStatusLabels[order.payment_status] || order.payment_status}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Shipping Address */}
                            {order.shipping_address && (
                                <div className="rounded-lg border border-gray-200 bg-white p-6">
                                    <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">Adresse de livraison</h2>
                                    <div className="text-sm text-gray-600">
                                        <p className="font-medium text-gray-900">{order.shipping_address.first_name} {order.shipping_address.last_name}</p>
                                        <p>{order.shipping_address.address}</p>
                                        {order.shipping_address.address2 && <p>{order.shipping_address.address2}</p>}
                                        <p>{order.shipping_address.postal_code} {order.shipping_address.city}</p>
                                        <p>{order.shipping_address.country}</p>
                                        {order.shipping_address.phone && <p className="mt-1">Tel : {order.shipping_address.phone}</p>}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Billing Address */}
                        {order.billing_address && (
                            <div className="rounded-lg border border-gray-200 bg-white p-6">
                                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">Adresse de facturation</h2>
                                <div className="text-sm text-gray-600">
                                    <p className="font-medium text-gray-900">{order.billing_address.first_name} {order.billing_address.last_name}</p>
                                    <p>{order.billing_address.address}</p>
                                    {order.billing_address.address2 && <p>{order.billing_address.address2}</p>}
                                    <p>{order.billing_address.postal_code} {order.billing_address.city}</p>
                                    <p>{order.billing_address.country}</p>
                                </div>
                            </div>
                        )}

                        {/* Notes */}
                        {order.notes && (
                            <div className="rounded-lg border border-gray-200 bg-white p-6">
                                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">Notes</h2>
                                <p className="text-sm text-gray-600 whitespace-pre-wrap">{order.notes}</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-8 text-center">
                        <Link
                            href="/account/orders"
                            className="text-sm font-medium text-gray-500 hover:text-gray-700"
                        >
                            Retour \u00e0 mes commandes
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
