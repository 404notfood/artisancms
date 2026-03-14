import { Head, Link } from '@inertiajs/react';
import FrontLayout from '@/Layouts/FrontLayout';
import type { OrderData, EcommerceSettingsData, MenuData } from '@/types/cms';

interface ConfirmationPageProps {
    order: OrderData;
    settings: EcommerceSettingsData;
    menus: Record<string, MenuData>;
    theme: {
        customizations: Record<string, string>;
        layouts: Array<{ slug: string; name: string }>;
    };
}

function formatPrice(price: number, symbol: string): string {
    return `${Number(price).toFixed(2)} ${symbol}`;
}

function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function StatusBadge({ status }: { status: string }) {
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
        <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                styles[status] || 'bg-gray-100 text-gray-800'
            }`}
        >
            {labels[status] || status}
        </span>
    );
}

function AddressBlock({
    title,
    address,
}: {
    title: string;
    address: {
        first_name: string;
        last_name: string;
        address: string;
        address2?: string;
        city: string;
        postal_code: string;
        country: string;
        phone?: string;
    } | null;
}) {
    if (!address) return null;

    return (
        <div>
            <h4 className="mb-2 text-sm font-semibold text-gray-900">{title}</h4>
            <div className="text-sm text-gray-600">
                <p>
                    {address.first_name} {address.last_name}
                </p>
                <p>{address.address}</p>
                {address.address2 && <p>{address.address2}</p>}
                <p>
                    {address.postal_code} {address.city}
                </p>
                <p>{address.country}</p>
                {address.phone && <p>Tel : {address.phone}</p>}
            </div>
        </div>
    );
}

export default function ConfirmationPage({
    order,
    settings,
    menus,
    theme,
}: ConfirmationPageProps) {
    return (
        <FrontLayout menus={menus} theme={theme}>
            <Head title={`Commande #${order.id} confirmee - ${settings.store_name}`} />

            <div className="container py-12">
                <div className="mx-auto max-w-3xl">
                    {/* Success Header */}
                    <div className="mb-8 text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                            <svg
                                className="h-8 w-8 text-green-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Commande confirmee
                        </h1>
                        <p className="mt-2 text-gray-600">
                            Merci pour votre commande ! Vous recevrez un email de
                            confirmation prochainement.
                        </p>
                    </div>

                    {/* Order Info */}
                    <div className="rounded-lg border border-gray-200 bg-white p-6">
                        {/* Order Header */}
                        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">
                                    Commande #{order.id}
                                </h2>
                                <p className="text-sm text-gray-500">
                                    {formatDate(order.created_at)}
                                </p>
                            </div>
                            <StatusBadge status={order.status} />
                        </div>

                        {/* Items */}
                        <div className="mb-6">
                            <h3 className="mb-3 text-sm font-semibold text-gray-900">
                                Articles commandes
                            </h3>
                            <div className="space-y-3">
                                {order.items?.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center justify-between"
                                    >
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">
                                                {item.name}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {formatPrice(
                                                    item.price,
                                                    settings.currency_symbol,
                                                )}{' '}
                                                x {item.quantity}
                                            </p>
                                        </div>
                                        <span className="text-sm font-medium text-gray-900">
                                            {formatPrice(
                                                item.total,
                                                settings.currency_symbol,
                                            )}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Totals */}
                        <div className="mb-6 border-t border-gray-200 pt-4">
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Sous-total</span>
                                    <span className="text-gray-900">
                                        {formatPrice(
                                            order.subtotal,
                                            settings.currency_symbol,
                                        )}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">TVA</span>
                                    <span className="text-gray-900">
                                        {formatPrice(
                                            order.tax,
                                            settings.currency_symbol,
                                        )}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Livraison</span>
                                    <span className="text-gray-900">
                                        {order.shipping === 0
                                            ? 'Gratuite'
                                            : formatPrice(
                                                  order.shipping,
                                                  settings.currency_symbol,
                                              )}
                                    </span>
                                </div>
                                <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold">
                                    <span className="text-gray-900">Total</span>
                                    <span className="text-gray-900">
                                        {formatPrice(
                                            order.total,
                                            settings.currency_symbol,
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Addresses */}
                        <div className="grid grid-cols-1 gap-6 border-t border-gray-200 pt-6 sm:grid-cols-2">
                            <AddressBlock
                                title="Adresse de livraison"
                                address={order.shipping_address}
                            />
                            <AddressBlock
                                title="Adresse de facturation"
                                address={order.billing_address}
                            />
                        </div>

                        {/* Payment Info */}
                        {order.payment_method && (
                            <div className="mt-6 border-t border-gray-200 pt-4">
                                <h4 className="mb-1 text-sm font-semibold text-gray-900">
                                    Mode de paiement
                                </h4>
                                <p className="text-sm text-gray-600">
                                    {order.payment_method === 'cod'
                                        ? 'Paiement a la livraison'
                                        : 'Carte bancaire'}
                                </p>
                            </div>
                        )}

                        {/* Notes */}
                        {order.notes && (
                            <div className="mt-4 border-t border-gray-200 pt-4">
                                <h4 className="mb-1 text-sm font-semibold text-gray-900">
                                    Notes
                                </h4>
                                <p className="text-sm text-gray-600">{order.notes}</p>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                        <Link
                            href="/account/orders"
                            className="rounded-md border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                        >
                            Voir mes commandes
                        </Link>
                        <Link
                            href="/shop"
                            className="rounded-md bg-gray-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-700"
                        >
                            Retour a la boutique
                        </Link>
                    </div>
                </div>
            </div>
        </FrontLayout>
    );
}
