import { Head, Link } from '@inertiajs/react';
import type { OrderData } from '@/types/cms';

interface Props {
    order: OrderData;
}

export default function PaymentCancel({ order }: Props) {
    return (
        <>
            <Head title="Paiement annul\u00e9" />

            <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
                <div className="w-full max-w-md text-center">
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
                        <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>

                    <h1 className="text-2xl font-bold text-gray-900">Paiement annul\u00e9</h1>
                    <p className="mt-2 text-gray-600">
                        Le paiement pour la commande <span className="font-semibold">#{order.id}</span> a \u00e9t\u00e9 annul\u00e9.
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                        Votre commande est toujours en attente. Vous pouvez r\u00e9essayer le paiement ou contacter le support.
                    </p>

                    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                        <Link
                            href="/checkout"
                            className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
                        >
                            R\u00e9essayer le paiement
                        </Link>
                        <Link
                            href="/shop"
                            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Retour \u00e0 la boutique
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
