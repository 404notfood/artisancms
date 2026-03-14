import { Head, Link, useForm } from '@inertiajs/react';
import FrontLayout from '@/Layouts/FrontLayout';
import type { EcommerceSettingsData, MenuData } from '@/types/cms';
import { FormEvent, useState } from 'react';

interface CartItemSummary {
    id: number;
    product_id: number;
    variant_id: number | null;
    name: string;
    variant_name: string | null;
    price: number;
    quantity: number;
    total: number;
    featured_image: string | null;
}

interface CouponInfo {
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
}

interface CheckoutPageProps {
    cartItems: CartItemSummary[];
    subtotal: number;
    tax: number;
    shipping: number;
    discount: number;
    total: number;
    settings: EcommerceSettingsData;
    coupon: CouponInfo | null;
    menus: Record<string, MenuData>;
    theme: {
        customizations: Record<string, string>;
        layouts: Array<{ slug: string; name: string }>;
    };
}

function formatPrice(price: number, symbol: string): string {
    return `${Number(price).toFixed(2)} ${symbol}`;
}

interface AddressFormData {
    first_name: string;
    last_name: string;
    address: string;
    address2: string;
    city: string;
    postal_code: string;
    country: string;
    phone: string;
}

function AddressForm({
    title,
    prefix,
    data,
    errors,
    onChange,
}: {
    title: string;
    prefix: string;
    data: AddressFormData;
    errors: Record<string, string>;
    onChange: (field: string, value: string) => void;
}) {
    return (
        <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900">{title}</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                        Prenom *
                    </label>
                    <input
                        type="text"
                        value={data.first_name}
                        onChange={(e) => onChange('first_name', e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-500 focus:outline-none"
                    />
                    {errors[`${prefix}.first_name`] && (
                        <p className="mt-1 text-xs text-red-600">
                            {errors[`${prefix}.first_name`]}
                        </p>
                    )}
                </div>
                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                        Nom *
                    </label>
                    <input
                        type="text"
                        value={data.last_name}
                        onChange={(e) => onChange('last_name', e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-500 focus:outline-none"
                    />
                    {errors[`${prefix}.last_name`] && (
                        <p className="mt-1 text-xs text-red-600">
                            {errors[`${prefix}.last_name`]}
                        </p>
                    )}
                </div>
                <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                        Adresse *
                    </label>
                    <input
                        type="text"
                        value={data.address}
                        onChange={(e) => onChange('address', e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-500 focus:outline-none"
                    />
                    {errors[`${prefix}.address`] && (
                        <p className="mt-1 text-xs text-red-600">
                            {errors[`${prefix}.address`]}
                        </p>
                    )}
                </div>
                <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                        Complement d'adresse
                    </label>
                    <input
                        type="text"
                        value={data.address2}
                        onChange={(e) => onChange('address2', e.target.value)}
                        placeholder="Appartement, batiment, etc."
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-500 focus:outline-none"
                    />
                </div>
                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                        Ville *
                    </label>
                    <input
                        type="text"
                        value={data.city}
                        onChange={(e) => onChange('city', e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-500 focus:outline-none"
                    />
                    {errors[`${prefix}.city`] && (
                        <p className="mt-1 text-xs text-red-600">
                            {errors[`${prefix}.city`]}
                        </p>
                    )}
                </div>
                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                        Code postal *
                    </label>
                    <input
                        type="text"
                        value={data.postal_code}
                        onChange={(e) => onChange('postal_code', e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-500 focus:outline-none"
                    />
                    {errors[`${prefix}.postal_code`] && (
                        <p className="mt-1 text-xs text-red-600">
                            {errors[`${prefix}.postal_code`]}
                        </p>
                    )}
                </div>
                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                        Pays *
                    </label>
                    <input
                        type="text"
                        value={data.country}
                        onChange={(e) => onChange('country', e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-500 focus:outline-none"
                    />
                    {errors[`${prefix}.country`] && (
                        <p className="mt-1 text-xs text-red-600">
                            {errors[`${prefix}.country`]}
                        </p>
                    )}
                </div>
                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                        Telephone
                    </label>
                    <input
                        type="tel"
                        value={data.phone}
                        onChange={(e) => onChange('phone', e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-500 focus:outline-none"
                    />
                </div>
            </div>
        </div>
    );
}

export default function CheckoutPage({
    cartItems,
    subtotal,
    tax,
    shipping,
    discount,
    total,
    settings,
    coupon,
    menus,
    theme,
}: CheckoutPageProps) {
    const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);

    const { data, setData, post, processing, errors } = useForm({
        shipping_address: {
            first_name: '',
            last_name: '',
            address: '',
            address2: '',
            city: '',
            postal_code: '',
            country: 'France',
            phone: '',
        } as AddressFormData,
        billing_same_as_shipping: true,
        billing_address: {
            first_name: '',
            last_name: '',
            address: '',
            address2: '',
            city: '',
            postal_code: '',
            country: 'France',
            phone: '',
        } as AddressFormData,
        payment_method: 'cod' as string,
        notes: '',
    });

    const handleShippingChange = (field: string, value: string) => {
        setData('shipping_address', {
            ...data.shipping_address,
            [field]: value,
        });
    };

    const handleBillingChange = (field: string, value: string) => {
        setData('billing_address', {
            ...data.billing_address,
            [field]: value,
        });
    };

    const handleBillingSameToggle = (checked: boolean) => {
        setBillingSameAsShipping(checked);
        setData('billing_same_as_shipping', checked);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post('/checkout');
    };

    if (cartItems.length === 0) {
        return (
            <FrontLayout menus={menus} theme={theme}>
                <Head title="Commande - Boutique" />
                <div className="container py-20 text-center">
                    <h2 className="text-2xl font-bold text-gray-900">
                        Votre panier est vide
                    </h2>
                    <p className="mt-2 text-gray-500">
                        Ajoutez des produits avant de passer commande.
                    </p>
                    <Link
                        href="/shop"
                        className="mt-6 inline-block rounded-md bg-gray-900 px-6 py-3 text-sm font-medium text-white hover:bg-gray-700"
                    >
                        Voir la boutique
                    </Link>
                </div>
            </FrontLayout>
        );
    }

    return (
        <FrontLayout menus={menus} theme={theme}>
            <Head title="Commande - Boutique" />

            <div className="container py-8">
                <h1 className="mb-8 text-3xl font-bold text-gray-900">
                    Passer commande
                </h1>

                <form onSubmit={handleSubmit}>
                    <div className="flex flex-col gap-8 lg:flex-row">
                        {/* Left Column: Address + Payment */}
                        <div className="flex-1 space-y-8">
                            {/* Shipping Address */}
                            <div className="rounded-lg border border-gray-200 p-6">
                                <AddressForm
                                    title="Adresse de livraison"
                                    prefix="shipping_address"
                                    data={data.shipping_address}
                                    errors={errors}
                                    onChange={handleShippingChange}
                                />
                            </div>

                            {/* Billing Address */}
                            <div className="rounded-lg border border-gray-200 p-6">
                                <div className="mb-4 flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="billing-same"
                                        checked={billingSameAsShipping}
                                        onChange={(e) =>
                                            handleBillingSameToggle(e.target.checked)
                                        }
                                        className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                                    />
                                    <label
                                        htmlFor="billing-same"
                                        className="text-sm font-medium text-gray-700"
                                    >
                                        L'adresse de facturation est identique a l'adresse
                                        de livraison
                                    </label>
                                </div>

                                {!billingSameAsShipping && (
                                    <AddressForm
                                        title="Adresse de facturation"
                                        prefix="billing_address"
                                        data={data.billing_address}
                                        errors={errors}
                                        onChange={handleBillingChange}
                                    />
                                )}
                            </div>

                            {/* Payment Method */}
                            <div className="rounded-lg border border-gray-200 p-6">
                                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                                    Mode de paiement
                                </h3>
                                <div className="space-y-3">
                                    <label className="flex cursor-pointer items-center gap-3 rounded-md border border-gray-200 p-4 transition-colors hover:bg-gray-50">
                                        <input
                                            type="radio"
                                            name="payment_method"
                                            value="cod"
                                            checked={data.payment_method === 'cod'}
                                            onChange={(e) =>
                                                setData(
                                                    'payment_method',
                                                    e.target.value,
                                                )
                                            }
                                            className="h-4 w-4 border-gray-300 text-gray-900 focus:ring-gray-500"
                                        />
                                        <div>
                                            <span className="text-sm font-medium text-gray-900">
                                                Paiement a la livraison
                                            </span>
                                            <p className="text-xs text-gray-500">
                                                Payez en especes a la reception de votre
                                                commande
                                            </p>
                                        </div>
                                    </label>
                                    <label className="flex cursor-pointer items-center gap-3 rounded-md border border-gray-200 p-4 transition-colors hover:bg-gray-50">
                                        <input
                                            type="radio"
                                            name="payment_method"
                                            value="card"
                                            checked={data.payment_method === 'card'}
                                            onChange={(e) =>
                                                setData(
                                                    'payment_method',
                                                    e.target.value,
                                                )
                                            }
                                            className="h-4 w-4 border-gray-300 text-gray-900 focus:ring-gray-500"
                                        />
                                        <div>
                                            <span className="text-sm font-medium text-gray-900">
                                                Carte bancaire
                                            </span>
                                            <p className="text-xs text-gray-500">
                                                Paiement securise par carte
                                            </p>
                                        </div>
                                    </label>
                                </div>
                                {errors.payment_method && (
                                    <p className="mt-2 text-xs text-red-600">
                                        {errors.payment_method}
                                    </p>
                                )}
                            </div>

                            {/* Notes */}
                            <div className="rounded-lg border border-gray-200 p-6">
                                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                                    Notes de commande
                                </h3>
                                <textarea
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    rows={3}
                                    placeholder="Instructions speciales pour votre commande (optionnel)"
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        {/* Right Column: Order Summary */}
                        <div className="w-full lg:w-96">
                            <div className="sticky top-24 rounded-lg border border-gray-200 bg-gray-50 p-6">
                                <h3 className="mb-4 text-lg font-bold text-gray-900">
                                    Votre commande
                                </h3>

                                {/* Items */}
                                <div className="mb-4 space-y-3">
                                    {cartItems.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-center gap-3"
                                        >
                                            <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded bg-white">
                                                {item.featured_image ? (
                                                    <img
                                                        src={item.featured_image}
                                                        alt={item.name}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
                                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 text-sm">
                                                <p className="font-medium text-gray-900">
                                                    {item.name}
                                                    {item.variant_name && (
                                                        <span className="text-gray-500">
                                                            {' '}
                                                            - {item.variant_name}
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="text-gray-500">
                                                    x{item.quantity}
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

                                {/* Totals */}
                                <div className="space-y-2 border-t border-gray-200 pt-4 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Sous-total</span>
                                        <span className="text-gray-900">
                                            {formatPrice(
                                                subtotal,
                                                settings.currency_symbol,
                                            )}
                                        </span>
                                    </div>

                                    {discount > 0 && coupon && (
                                        <div className="flex justify-between text-green-600">
                                            <span>
                                                Reduction ({coupon.code})
                                            </span>
                                            <span>
                                                -
                                                {formatPrice(
                                                    discount,
                                                    settings.currency_symbol,
                                                )}
                                            </span>
                                        </div>
                                    )}

                                    <div className="flex justify-between">
                                        <span className="text-gray-600">
                                            TVA ({settings.tax_rate}%)
                                        </span>
                                        <span className="text-gray-900">
                                            {formatPrice(tax, settings.currency_symbol)}
                                        </span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Livraison</span>
                                        <span className="text-gray-900">
                                            {shipping === 0
                                                ? 'Gratuite'
                                                : formatPrice(
                                                      shipping,
                                                      settings.currency_symbol,
                                                  )}
                                        </span>
                                    </div>

                                    <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold">
                                        <span className="text-gray-900">Total</span>
                                        <span className="text-gray-900">
                                            {formatPrice(
                                                total,
                                                settings.currency_symbol,
                                            )}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="mt-6 w-full rounded-md bg-gray-900 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                                >
                                    {processing
                                        ? 'Traitement en cours...'
                                        : 'Confirmer la commande'}
                                </button>

                                <Link
                                    href="/cart"
                                    className="mt-3 block text-center text-sm text-gray-500 hover:text-gray-700"
                                >
                                    Retour au panier
                                </Link>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </FrontLayout>
    );
}
