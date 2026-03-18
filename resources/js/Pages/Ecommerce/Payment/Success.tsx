import { Head, Link } from '@inertiajs/react';
import type { OrderData } from '@/types/cms';

interface Props {
    order: OrderData;
}

export default function PaymentSuccess({ order }: Props) {
    return (
        <>
            <Head title="Paiement r\u00e9ussi" />

            <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
                <div className="w-full max-w-md text-center">
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                        <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>

                    <h1 className="text-2xl font-bold text-gray-900">Paiement r\u00e9ussi !</h1>
                    <p className="mt-2 text-gray-600">
                        Votre commande <span className="font-semibold">#{order.id}</span> a \u00e9t\u00e9 confirm\u00e9e.
                    </p>

                    {order.items && order.items.length > 0 && (
                        <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4 text-left">
                            <p className="mb-3 text-sm font-semibold text-gray-900">R\u00e9sum\u00e9</p>
                            <div className="space-y-2">
                                {order.items.map((item) => (
                                    <div key={item.id} className="flex justify-between text-sm">
                                        <span className="text-gray-600">{item.name} x{item.quantity}</span>
                                        <span className="font-medium text-gray-900">{Number(item.total).toFixed(2)} €</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-3 flex justify-between border-t border-gray-100 pt-3 text-sm font-bold">
                                <span>Total</span>
                                <span>{Number(order.total).toFixed(2)} €</span>
                            </div>
                        </div>
                    )}

                    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                        <Link
                            href="/account/orders"
                            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Mes commandes
                        </Link>
                        <Link
                            href="/shop"
                            className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
                        >
                            Continuer mes achats
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
