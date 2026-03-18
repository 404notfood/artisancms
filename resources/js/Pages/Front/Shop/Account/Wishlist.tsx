import { Head, Link, router } from '@inertiajs/react';
import type { WishlistItemData, EcommerceSettingsData } from '@/types/cms';

interface Props {
    items: WishlistItemData[];
    settings: EcommerceSettingsData;
}

export default function Wishlist({ items, settings }: Props) {
    function formatPrice(price: number): string {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: settings.currency || 'EUR',
        }).format(price);
    }

    function handleRemove(itemId: number) {
        router.delete(`/account/wishlist/${itemId}`, {
            preserveScroll: true,
        });
    }

    function handleAddToCart(productId: number) {
        router.post('/cart/add', {
            product_id: productId,
            quantity: 1,
        }, {
            preserveScroll: true,
        });
    }

    return (
        <>
            <Head title="Ma liste de souhaits" />

            <div className="container py-8">
                <div className="mx-auto max-w-4xl">
                    <div className="mb-6 flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-gray-900">Ma liste de souhaits</h1>
                        <Link
                            href="/account"
                            className="text-sm text-gray-500 hover:text-gray-700"
                        >
                            Retour au compte
                        </Link>
                    </div>

                    {items.length === 0 ? (
                        <div className="rounded-lg border-2 border-dashed border-gray-200 bg-white px-6 py-16 text-center">
                            <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            <h3 className="mt-4 text-base font-semibold text-gray-900">Liste vide</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Vous n'avez pas encore ajout\u00e9 de produits \u00e0 votre liste de souhaits.
                            </p>
                            <Link
                                href="/shop"
                                className="mt-5 inline-flex rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
                            >
                                Parcourir la boutique
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4"
                                >
                                    {item.product?.featured_image ? (
                                        <img
                                            src={item.product.featured_image}
                                            alt={item.product?.name ?? ''}
                                            className="h-20 w-20 rounded-lg object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-gray-100">
                                            <svg className="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5" />
                                            </svg>
                                        </div>
                                    )}

                                    <div className="flex-1 min-w-0">
                                        <Link
                                            href={`/shop/${item.product?.slug ?? ''}`}
                                            className="text-sm font-semibold text-gray-900 hover:text-indigo-600"
                                        >
                                            {item.product?.name ?? 'Produit supprim\u00e9'}
                                        </Link>
                                        {item.variant && (
                                            <p className="text-xs text-gray-500">{item.variant.name}</p>
                                        )}
                                        {item.product && (
                                            <p className="mt-1 text-sm font-bold text-gray-900">
                                                {formatPrice(item.variant?.price ?? item.product.price)}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {item.product && (
                                            <button
                                                type="button"
                                                onClick={() => handleAddToCart(item.product_id)}
                                                className="rounded-lg bg-gray-900 px-4 py-2 text-xs font-medium text-white hover:bg-gray-700 transition-colors"
                                            >
                                                Ajouter au panier
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => handleRemove(item.id)}
                                            className="rounded-lg border border-gray-200 p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                        >
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
