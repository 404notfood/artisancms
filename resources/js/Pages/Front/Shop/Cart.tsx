import { Head, Link, router } from '@inertiajs/react';
import FrontLayout from '@/Layouts/FrontLayout';
import type { EcommerceSettingsData, MenuData } from '@/types/cms';
import { useState } from 'react';

interface CartItemData {
    id: number;
    product_id: number;
    variant_id: number | null;
    name: string;
    variant_name: string | null;
    variant_attributes: Record<string, string> | null;
    price: number;
    quantity: number;
    total: number;
    featured_image: string | null;
    slug: string;
    stock: number;
}

interface CartPageProps {
    cartItems: CartItemData[];
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
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

function CartItemRow({
    item,
    settings,
}: {
    item: CartItemData;
    settings: EcommerceSettingsData;
}) {
    const [quantity, setQuantity] = useState(item.quantity);

    const handleQuantityChange = (newQuantity: number) => {
        const qty = Math.max(1, Math.min(item.stock, newQuantity));
        setQuantity(qty);
        router.put(
            `/cart/${item.id}`,
            { quantity: qty },
            { preserveScroll: true },
        );
    };

    const handleRemove = () => {
        router.delete(`/cart/${item.id}`, { preserveScroll: true });
    };

    return (
        <tr className="border-b border-gray-200">
            <td className="py-4">
                <div className="flex items-center gap-4">
                    <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
                        {item.featured_image ? (
                            <img
                                src={item.featured_image}
                                alt={item.name}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-gray-400">
                                <svg
                                    className="h-8 w-8"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1}
                                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                </svg>
                            </div>
                        )}
                    </div>
                    <div>
                        <Link
                            href={`/shop/${item.slug}`}
                            className="font-medium text-gray-900 hover:text-blue-600"
                        >
                            {item.name}
                        </Link>
                        {item.variant_name && (
                            <p className="mt-1 text-sm text-gray-500">
                                Variante : {item.variant_name}
                            </p>
                        )}
                        {item.variant_attributes && (
                            <div className="mt-1 flex gap-2">
                                {Object.entries(item.variant_attributes).map(
                                    ([key, value]) => (
                                        <span
                                            key={key}
                                            className="text-xs text-gray-500"
                                        >
                                            {key}: {value}
                                        </span>
                                    ),
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </td>
            <td className="py-4 text-center text-sm text-gray-900">
                {formatPrice(item.price, settings.currency_symbol)}
            </td>
            <td className="py-4">
                <div className="flex items-center justify-center">
                    <div className="flex items-center rounded-md border border-gray-300">
                        <button
                            onClick={() => handleQuantityChange(quantity - 1)}
                            className="px-2 py-1 text-gray-600 hover:text-gray-900"
                        >
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                        </button>
                        <input
                            type="number"
                            min="1"
                            max={item.stock}
                            value={quantity}
                            onChange={(e) =>
                                handleQuantityChange(parseInt(e.target.value) || 1)
                            }
                            className="w-12 border-x border-gray-300 py-1 text-center text-sm focus:outline-none"
                        />
                        <button
                            onClick={() => handleQuantityChange(quantity + 1)}
                            className="px-2 py-1 text-gray-600 hover:text-gray-900"
                        >
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                    </div>
                </div>
            </td>
            <td className="py-4 text-center text-sm font-medium text-gray-900">
                {formatPrice(item.price * quantity, settings.currency_symbol)}
            </td>
            <td className="py-4 text-center">
                <button
                    onClick={handleRemove}
                    className="text-gray-400 transition-colors hover:text-red-500"
                    title="Supprimer"
                >
                    <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                    </svg>
                </button>
            </td>
        </tr>
    );
}

export default function CartPage({
    cartItems,
    subtotal,
    tax,
    shipping,
    total,
    settings,
    menus,
    theme,
}: CartPageProps) {
    const [couponCode, setCouponCode] = useState('');
    const [couponMessage, setCouponMessage] = useState<{
        type: 'success' | 'error';
        text: string;
    } | null>(null);
    const [discount, setDiscount] = useState(0);
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;

        setIsApplyingCoupon(true);
        setCouponMessage(null);

        try {
            const response = await fetch('/checkout/apply-coupon', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN':
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute('content') || '',
                    Accept: 'application/json',
                },
                body: JSON.stringify({ code: couponCode, subtotal }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setDiscount(data.discount);
                setCouponMessage({ type: 'success', text: data.message });
            } else {
                setCouponMessage({
                    type: 'error',
                    text: data.message || 'Code promo invalide.',
                });
            }
        } catch {
            setCouponMessage({
                type: 'error',
                text: 'Une erreur est survenue. Veuillez reessayer.',
            });
        } finally {
            setIsApplyingCoupon(false);
        }
    };

    const adjustedTotal = Math.max(0, total - discount);

    if (cartItems.length === 0) {
        return (
            <FrontLayout menus={menus} theme={theme}>
                <Head title="Panier - Boutique" />
                <div className="container py-20 text-center">
                    <svg
                        className="mx-auto h-16 w-16 text-gray-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
                        />
                    </svg>
                    <h2 className="mt-4 text-2xl font-bold text-gray-900">
                        Votre panier est vide
                    </h2>
                    <p className="mt-2 text-gray-500">
                        Parcourez notre boutique pour trouver des produits qui vous plaisent.
                    </p>
                    <Link
                        href="/shop"
                        className="mt-6 inline-block rounded-md bg-gray-900 px-6 py-3 text-sm font-medium text-white hover:bg-gray-700"
                    >
                        Continuer les achats
                    </Link>
                </div>
            </FrontLayout>
        );
    }

    return (
        <FrontLayout menus={menus} theme={theme}>
            <Head title="Panier - Boutique" />

            <div className="container py-8">
                <h1 className="mb-8 text-3xl font-bold text-gray-900">Panier</h1>

                <div className="flex flex-col gap-8 lg:flex-row">
                    {/* Cart Table */}
                    <div className="flex-1">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b-2 border-gray-200 text-sm text-gray-500">
                                        <th className="pb-3 text-left font-medium">
                                            Produit
                                        </th>
                                        <th className="pb-3 text-center font-medium">
                                            Prix unitaire
                                        </th>
                                        <th className="pb-3 text-center font-medium">
                                            Quantite
                                        </th>
                                        <th className="pb-3 text-center font-medium">
                                            Total
                                        </th>
                                        <th className="pb-3 text-center font-medium">
                                            &nbsp;
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cartItems.map((item) => (
                                        <CartItemRow
                                            key={item.id}
                                            item={item}
                                            settings={settings}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-6">
                            <Link
                                href="/shop"
                                className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                Continuer les achats
                            </Link>
                        </div>
                    </div>

                    {/* Cart Summary */}
                    <div className="w-full lg:w-80">
                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
                            <h2 className="mb-4 text-lg font-bold text-gray-900">
                                Resume de la commande
                            </h2>

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Sous-total</span>
                                    <span className="font-medium text-gray-900">
                                        {formatPrice(subtotal, settings.currency_symbol)}
                                    </span>
                                </div>

                                {/* Coupon */}
                                <div className="border-t border-gray-200 pt-3">
                                    <label className="mb-2 block text-sm font-medium text-gray-700">
                                        Code promo
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={couponCode}
                                            onChange={(e) =>
                                                setCouponCode(
                                                    e.target.value.toUpperCase(),
                                                )
                                            }
                                            placeholder="Entrer le code"
                                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-500 focus:outline-none"
                                        />
                                        <button
                                            onClick={handleApplyCoupon}
                                            disabled={isApplyingCoupon}
                                            className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:bg-gray-400"
                                        >
                                            {isApplyingCoupon
                                                ? '...'
                                                : 'Appliquer'}
                                        </button>
                                    </div>
                                    {couponMessage && (
                                        <p
                                            className={`mt-1 text-xs ${
                                                couponMessage.type === 'success'
                                                    ? 'text-green-600'
                                                    : 'text-red-600'
                                            }`}
                                        >
                                            {couponMessage.text}
                                        </p>
                                    )}
                                </div>

                                {discount > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Reduction</span>
                                        <span>
                                            -{formatPrice(discount, settings.currency_symbol)}
                                        </span>
                                    </div>
                                )}

                                <div className="flex justify-between">
                                    <span className="text-gray-600">TVA ({settings.tax_rate}%)</span>
                                    <span className="font-medium text-gray-900">
                                        {formatPrice(tax, settings.currency_symbol)}
                                    </span>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-gray-600">Livraison</span>
                                    <span className="font-medium text-gray-900">
                                        {shipping === 0
                                            ? 'Gratuite'
                                            : formatPrice(
                                                  shipping,
                                                  settings.currency_symbol,
                                              )}
                                    </span>
                                </div>

                                {shipping > 0 && (
                                    <p className="text-xs text-gray-500">
                                        Livraison gratuite a partir de{' '}
                                        {formatPrice(
                                            settings.free_shipping_threshold,
                                            settings.currency_symbol,
                                        )}
                                    </p>
                                )}

                                <div className="flex justify-between border-t border-gray-200 pt-3 text-base font-bold">
                                    <span className="text-gray-900">Total</span>
                                    <span className="text-gray-900">
                                        {formatPrice(
                                            adjustedTotal,
                                            settings.currency_symbol,
                                        )}
                                    </span>
                                </div>
                            </div>

                            <Link
                                href="/checkout"
                                className="mt-6 block w-full rounded-md bg-gray-900 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-gray-700"
                            >
                                Passer commande
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </FrontLayout>
    );
}
