import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import type { CouponData } from '@/types/cms';
import { formatDate } from '@/lib/format';
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface CouponsIndexProps {
    coupons: CouponData[];
}

export default function CouponsIndex({ coupons }: CouponsIndexProps) {
    const [search, setSearch] = useState('');

    const filteredCoupons = search
        ? coupons.filter((c) =>
              c.code.toLowerCase().includes(search.toLowerCase()),
          )
        : coupons;

    function handleDelete(coupon: CouponData) {
        if (!confirm(`Supprimer le coupon "${coupon.code}" ?`)) return;
        router.delete(`/admin/shop/coupons/${coupon.id}`);
    }

    function handleToggleActive(coupon: CouponData) {
        router.put(`/admin/shop/coupons/${coupon.id}`, {
            ...coupon,
            active: !coupon.active,
            starts_at: coupon.starts_at ? coupon.starts_at.slice(0, 16) : '',
            expires_at: coupon.expires_at ? coupon.expires_at.slice(0, 16) : '',
        }, {
            preserveState: true,
        });
    }

    function formatPrice(price: number): string {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price);
    }

    function formatCouponDate(dateStr: string | null): string {
        if (!dateStr) return '---';
        return formatDate(dateStr);
    }

    function formatValue(coupon: CouponData): string {
        if (coupon.type === 'percentage') {
            return `${coupon.value}%`;
        }
        return formatPrice(coupon.value);
    }

    return (
        <AdminLayout
            header={
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-gray-900">Coupons</h1>
                    <Link
                        href="/admin/shop/coupons/create"
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        Nouveau coupon
                    </Link>
                </div>
            }
        >
            <Head title="Coupons" />

            <div className="rounded-lg border border-gray-200 bg-white">
                {/* Search */}
                <div className="border-b border-gray-200 p-4">
                    <div className="flex justify-end">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Rechercher par code..."
                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-gray-200 bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 font-medium text-gray-700">Code</th>
                                <th className="px-4 py-3 font-medium text-gray-700">Type</th>
                                <th className="px-4 py-3 font-medium text-gray-700">Valeur</th>
                                <th className="hidden px-4 py-3 font-medium text-gray-700 md:table-cell">Commande min.</th>
                                <th className="hidden px-4 py-3 font-medium text-gray-700 md:table-cell">Utilisations</th>
                                <th className="hidden px-4 py-3 font-medium text-gray-700 lg:table-cell">Dates</th>
                                <th className="px-4 py-3 font-medium text-gray-700">Actif</th>
                                <th className="px-4 py-3 font-medium text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredCoupons.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                                        {search ? 'Aucun coupon correspondant.' : 'Aucun coupon. Cliquez sur Nouveau coupon pour en creer un.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredCoupons.map((coupon) => (
                                    <tr key={coupon.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <span className="inline-flex rounded bg-gray-100 px-2 py-1 font-mono text-sm font-medium text-gray-800">
                                                {coupon.code}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {coupon.type === 'percentage' ? (
                                                <span className="inline-flex items-center rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                                                    %
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                                                    &euro;
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-gray-900">
                                            {formatValue(coupon)}
                                        </td>
                                        <td className="hidden px-4 py-3 text-gray-600 md:table-cell">
                                            {coupon.min_order ? formatPrice(coupon.min_order) : '---'}
                                        </td>
                                        <td className="hidden px-4 py-3 text-gray-600 md:table-cell">
                                            <span className="font-medium">{coupon.used_count}</span>
                                            {coupon.max_uses ? (
                                                <span className="text-gray-400"> / {coupon.max_uses}</span>
                                            ) : (
                                                <span className="text-gray-400"> / illimite</span>
                                            )}
                                        </td>
                                        <td className="hidden px-4 py-3 text-gray-600 lg:table-cell">
                                            <div className="text-xs space-y-0.5">
                                                <p>
                                                    <span className="text-gray-400">Debut:</span> {formatCouponDate(coupon.starts_at)}
                                                </p>
                                                <p>
                                                    <span className="text-gray-400">Fin:</span> {formatCouponDate(coupon.expires_at)}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                type="button"
                                                onClick={() => handleToggleActive(coupon)}
                                                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                                                    coupon.active ? 'bg-indigo-600' : 'bg-gray-200'
                                                }`}
                                                title={coupon.active ? 'Desactiver' : 'Activer'}
                                            >
                                                <span
                                                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                        coupon.active ? 'translate-x-4' : 'translate-x-0'
                                                    }`}
                                                />
                                            </button>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    href={`/admin/shop/coupons/${coupon.id}/edit`}
                                                    className="text-gray-500 hover:text-indigo-600"
                                                    title="Modifier"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(coupon)}
                                                    className="text-gray-500 hover:text-red-600"
                                                    title="Supprimer"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}

