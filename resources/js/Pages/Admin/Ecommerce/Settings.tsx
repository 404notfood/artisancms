import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm } from '@inertiajs/react';
import type { EcommerceSettingsData } from '@/types/cms';

interface EcommerceSettingsProps {
    settings: EcommerceSettingsData;
}

export default function EcommerceSettings({ settings }: EcommerceSettingsProps) {
    const { data, setData, put, processing, errors } = useForm({
        store_name: settings.store_name,
        currency: settings.currency,
        currency_symbol: settings.currency_symbol,
        tax_rate: settings.tax_rate,
        shipping_cost: settings.shipping_cost,
        free_shipping_threshold: settings.free_shipping_threshold,
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        put('/admin/shop/settings');
    }

    return (
        <AdminLayout
            header={
                <h1 className="text-xl font-semibold text-gray-900">Parametres Boutique</h1>
            }
        >
            <Head title="Parametres Boutique" />

            <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
                {/* General */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
                    <h2 className="text-lg font-medium text-gray-900">General</h2>

                    <div>
                        <label htmlFor="store_name" className="block text-sm font-medium text-gray-700">
                            Nom de la boutique
                        </label>
                        <input
                            id="store_name"
                            type="text"
                            value={data.store_name}
                            onChange={(e) => setData('store_name', e.target.value)}
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            required
                        />
                        {errors.store_name && <p className="mt-1 text-sm text-red-600">{errors.store_name}</p>}
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="currency" className="block text-sm font-medium text-gray-700">
                                Devise (code ISO)
                            </label>
                            <input
                                id="currency"
                                type="text"
                                value={data.currency}
                                onChange={(e) => setData('currency', e.target.value.toUpperCase())}
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                maxLength={5}
                                required
                            />
                            {errors.currency && <p className="mt-1 text-sm text-red-600">{errors.currency}</p>}
                        </div>

                        <div>
                            <label htmlFor="currency_symbol" className="block text-sm font-medium text-gray-700">
                                Symbole de la devise
                            </label>
                            <input
                                id="currency_symbol"
                                type="text"
                                value={data.currency_symbol}
                                onChange={(e) => setData('currency_symbol', e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                maxLength={5}
                                required
                            />
                            {errors.currency_symbol && <p className="mt-1 text-sm text-red-600">{errors.currency_symbol}</p>}
                        </div>
                    </div>
                </div>

                {/* Tax & Shipping */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
                    <h2 className="text-lg font-medium text-gray-900">TVA et livraison</h2>

                    <div>
                        <label htmlFor="tax_rate" className="block text-sm font-medium text-gray-700">
                            Taux de TVA (%)
                        </label>
                        <div className="relative mt-1">
                            <input
                                id="tax_rate"
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={data.tax_rate}
                                onChange={(e) => setData('tax_rate', parseFloat(e.target.value) || 0)}
                                className="block w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                required
                            />
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 text-sm">
                                %
                            </span>
                        </div>
                        {errors.tax_rate && <p className="mt-1 text-sm text-red-600">{errors.tax_rate}</p>}
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="shipping_cost" className="block text-sm font-medium text-gray-700">
                                Frais de livraison
                            </label>
                            <div className="relative mt-1">
                                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 text-sm">
                                    {data.currency_symbol}
                                </span>
                                <input
                                    id="shipping_cost"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={data.shipping_cost}
                                    onChange={(e) => setData('shipping_cost', parseFloat(e.target.value) || 0)}
                                    className="block w-full rounded-lg border border-gray-300 pl-8 pr-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    required
                                />
                            </div>
                            {errors.shipping_cost && <p className="mt-1 text-sm text-red-600">{errors.shipping_cost}</p>}
                        </div>

                        <div>
                            <label htmlFor="free_shipping_threshold" className="block text-sm font-medium text-gray-700">
                                Livraison gratuite a partir de
                            </label>
                            <div className="relative mt-1">
                                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 text-sm">
                                    {data.currency_symbol}
                                </span>
                                <input
                                    id="free_shipping_threshold"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={data.free_shipping_threshold}
                                    onChange={(e) => setData('free_shipping_threshold', parseFloat(e.target.value) || 0)}
                                    className="block w-full rounded-lg border border-gray-300 pl-8 pr-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    required
                                />
                            </div>
                            {errors.free_shipping_threshold && <p className="mt-1 text-sm text-red-600">{errors.free_shipping_threshold}</p>}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end">
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                        {processing ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                </div>
            </form>
        </AdminLayout>
    );
}
