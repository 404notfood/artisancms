import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm , usePage } from '@inertiajs/react';
import type { CouponData, SharedProps } from '@/types/cms';
import { ArrowLeft, RefreshCw } from 'lucide-react';

interface CouponsCreateProps {
    coupon?: CouponData;
}

export default function CouponsCreate({ coupon }: CouponsCreateProps) {
    const { cms } = usePage<SharedProps>().props;
    const prefix = cms?.adminPrefix ?? 'admin';
    const isEdit = !!coupon;

    const { data, setData, post, put, processing, errors } = useForm({
        code: coupon?.code ?? '',
        type: coupon?.type ?? ('percentage' as string),
        value: coupon?.value ?? 0,
        min_order: coupon?.min_order ?? ('' as string | number),
        max_uses: coupon?.max_uses ?? ('' as string | number),
        starts_at: coupon?.starts_at ? coupon.starts_at.slice(0, 16) : '',
        expires_at: coupon?.expires_at ? coupon.expires_at.slice(0, 16) : '',
        active: coupon?.active ?? true,
    });

    function generateCode(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (isEdit) {
            put(`/admin/shop/coupons/${coupon!.id}`);
        } else {
            post(`/${prefix}/shop/coupons`);
        }
    }

    return (
        <AdminLayout
            header={
                <div className="flex items-center gap-4">
                    <Link href={`/${prefix}/shop/coupons`} className="text-gray-500 hover:text-gray-700">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <h1 className="text-xl font-semibold text-gray-900">
                        {isEdit ? 'Modifier le coupon' : 'Nouveau coupon'}
                    </h1>
                </div>
            }
        >
            <Head title={isEdit ? 'Modifier le coupon' : 'Nouveau coupon'} />

            <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
                <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
                    <h2 className="text-lg font-medium text-gray-900">Informations du coupon</h2>

                    <div>
                        <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                            Code
                        </label>
                        <div className="flex gap-2 mt-1">
                            <input
                                id="code"
                                type="text"
                                value={data.code}
                                onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                className="block flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono uppercase focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder="PROMO2025"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setData('code', generateCode())}
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap"
                                title="Generer un code aleatoire"
                            >
                                <span className="flex items-center gap-1.5">
                                    <RefreshCw className="h-4 w-4" />
                                    Generer
                                </span>
                            </button>
                        </div>
                        {errors.code && <p className="mt-1 text-sm text-red-600">{errors.code}</p>}
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                                Type de reduction
                            </label>
                            <select
                                id="type"
                                value={data.type}
                                onChange={(e) => setData('type', e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                                <option value="percentage">Pourcentage (%)</option>
                                <option value="fixed">Montant fixe (&euro;)</option>
                            </select>
                            {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type}</p>}
                        </div>

                        <div>
                            <label htmlFor="value" className="block text-sm font-medium text-gray-700">
                                Valeur
                            </label>
                            <div className="relative mt-1">
                                <input
                                    id="value"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={data.value}
                                    onChange={(e) => setData('value', parseFloat(e.target.value) || 0)}
                                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    required
                                />
                                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 text-sm">
                                    {data.type === 'percentage' ? '%' : '\u20AC'}
                                </span>
                            </div>
                            {errors.value && <p className="mt-1 text-sm text-red-600">{errors.value}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="min_order" className="block text-sm font-medium text-gray-700">
                                Commande minimum
                            </label>
                            <div className="relative mt-1">
                                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 text-sm">
                                    &euro;
                                </span>
                                <input
                                    id="min_order"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={data.min_order}
                                    onChange={(e) => setData('min_order', e.target.value === '' ? '' : parseFloat(e.target.value))}
                                    className="block w-full rounded-lg border border-gray-300 pl-8 pr-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    placeholder="Optionnel"
                                />
                            </div>
                            {errors.min_order && <p className="mt-1 text-sm text-red-600">{errors.min_order}</p>}
                        </div>

                        <div>
                            <label htmlFor="max_uses" className="block text-sm font-medium text-gray-700">
                                Nombre max. utilisations
                            </label>
                            <input
                                id="max_uses"
                                type="number"
                                min="1"
                                value={data.max_uses}
                                onChange={(e) => setData('max_uses', e.target.value === '' ? '' : parseInt(e.target.value))}
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder="Illimite"
                            />
                            {errors.max_uses && <p className="mt-1 text-sm text-red-600">{errors.max_uses}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="starts_at" className="block text-sm font-medium text-gray-700">
                                Date de debut
                            </label>
                            <input
                                id="starts_at"
                                type="datetime-local"
                                value={data.starts_at}
                                onChange={(e) => setData('starts_at', e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            {errors.starts_at && <p className="mt-1 text-sm text-red-600">{errors.starts_at}</p>}
                        </div>

                        <div>
                            <label htmlFor="expires_at" className="block text-sm font-medium text-gray-700">
                                Date d'expiration
                            </label>
                            <input
                                id="expires_at"
                                type="datetime-local"
                                value={data.expires_at}
                                onChange={(e) => setData('expires_at', e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            {errors.expires_at && <p className="mt-1 text-sm text-red-600">{errors.expires_at}</p>}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            id="active"
                            type="checkbox"
                            checked={data.active}
                            onChange={(e) => setData('active', e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <label htmlFor="active" className="text-sm font-medium text-gray-700">
                            Coupon actif
                        </label>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3">
                    <Link
                        href={`/${prefix}/shop/coupons`}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Annuler
                    </Link>
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

