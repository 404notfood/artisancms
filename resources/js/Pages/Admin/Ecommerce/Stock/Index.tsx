import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Package } from 'lucide-react';
import { ProductData, PaginatedResponse } from '@/types/cms';

type StockProduct = Omit<ProductData, 'category'> & {
    category?: { id: number; name: string };
};

interface StockIndexProps {
    products: PaginatedResponse<StockProduct>;
    filter: string;
    lowStockCount: number;
    outOfStockCount: number;
}

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);

export default function StockIndex({ products, filter, lowStockCount, outOfStockCount }: StockIndexProps) {
    const { cms } = usePage<SharedProps>().props;
    const prefix = cms?.adminPrefix ?? 'admin';
    const [adjustingId, setAdjustingId] = useState<number | null>(null);

    const adjustForm = useForm({
        quantity: 0,
        reason: '',
    });

    function submitAdjust(productId: number, e: React.FormEvent) {
        e.preventDefault();
        adjustForm.post(`/admin/shop/stock/${productId}/adjust`, {
            onSuccess: () => {
                setAdjustingId(null);
                adjustForm.reset();
            },
        });
    }

    function setFilter(f: string) {
        router.get(`/${prefix}/shop/stock`, f === 'all' ? {} : { filter: f }, { preserveState: true });
    }

    function getStockBadge(product: StockProduct) {
        if (product.stock <= 0) {
            return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">Rupture</span>;
        }
        if (product.low_stock_threshold && product.stock <= product.low_stock_threshold) {
            return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">Stock bas</span>;
        }
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">En stock</span>;
    }

    return (
        <AdminLayout>
            <Head title="Gestion du stock" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestion du stock</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Suivez et ajustez les niveaux de stock de vos produits.
                    </p>
                </div>

                {/* KPI cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="text-sm text-gray-500">Total produits suivis</div>
                        <div className="text-2xl font-bold text-gray-900 mt-1">{products.total}</div>
                    </div>
                    <div className="bg-white border border-yellow-200 rounded-lg p-4">
                        <div className="text-sm text-yellow-600">Stock bas</div>
                        <div className="text-2xl font-bold text-yellow-600 mt-1">{lowStockCount}</div>
                    </div>
                    <div className="bg-white border border-red-200 rounded-lg p-4">
                        <div className="text-sm text-red-600">En rupture</div>
                        <div className="text-2xl font-bold text-red-600 mt-1">{outOfStockCount}</div>
                    </div>
                </div>

                {/* Filter tabs */}
                <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
                    {[
                        { key: 'all', label: 'Tous' },
                        { key: 'low', label: `Stock bas (${lowStockCount})` },
                        { key: 'out', label: `Rupture (${outOfStockCount})` },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setFilter(tab.key)}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                filter === tab.key
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Products table */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produit</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prix</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Stock</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Seuil alerte</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {products.data.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500">
                                        Aucun produit avec suivi de stock.
                                    </td>
                                </tr>
                            )}
                            {products.data.map(product => (
                                <tr key={product.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {product.featured_image ? (
                                                <img
                                                    src={product.featured_image}
                                                    alt=""
                                                    className="w-10 h-10 rounded object-cover"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
                                                    <Package className="w-5 h-5 text-gray-400" />
                                                </div>
                                            )}
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                                {product.category && (
                                                    <div className="text-xs text-gray-500">{product.category.name}</div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-mono text-gray-600">{product.sku || '—'}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{formatCurrency(product.price)}</td>
                                    <td className="px-6 py-4 text-center">
                                        {adjustingId === product.id ? (
                                            <form onSubmit={e => submitAdjust(product.id, e)} className="flex items-center gap-2 justify-center">
                                                <input
                                                    type="number"
                                                    value={adjustForm.data.quantity}
                                                    onChange={e => adjustForm.setData('quantity', parseInt(e.target.value) || 0)}
                                                    className="w-20 border border-gray-300 rounded px-2 py-1 text-sm text-center"
                                                    placeholder="+/- qty"
                                                />
                                                <input
                                                    type="text"
                                                    value={adjustForm.data.reason}
                                                    onChange={e => adjustForm.setData('reason', e.target.value)}
                                                    className="w-32 border border-gray-300 rounded px-2 py-1 text-sm"
                                                    placeholder="Raison"
                                                />
                                                <button
                                                    type="submit"
                                                    disabled={adjustForm.processing || adjustForm.data.quantity === 0}
                                                    className="px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                                                >
                                                    OK
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => { setAdjustingId(null); adjustForm.reset(); }}
                                                    className="px-2 py-1 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                                                >
                                                    X
                                                </button>
                                            </form>
                                        ) : (
                                            <span className={`text-sm font-bold ${
                                                product.stock <= 0 ? 'text-red-600' :
                                                (product.low_stock_threshold && product.stock <= product.low_stock_threshold) ? 'text-yellow-600' :
                                                'text-gray-900'
                                            }`}>
                                                {product.stock}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center text-sm text-gray-600">
                                        {product.low_stock_threshold ?? '—'}
                                    </td>
                                    <td className="px-6 py-4">{getStockBadge(product)}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => { setAdjustingId(product.id); adjustForm.reset(); }}
                                                className="text-indigo-600 hover:text-indigo-800 text-sm"
                                            >
                                                Ajuster
                                            </button>
                                            <button
                                                onClick={() => router.get(`/admin/shop/stock/${product.id}/movements`)}
                                                className="text-gray-600 hover:text-gray-800 text-sm"
                                            >
                                                Historique
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {products.last_page > 1 && (
                    <div className="flex justify-center gap-1">
                        {products.links.map((link, i) => (
                            <button
                                key={i}
                                disabled={!link.url || link.active}
                                onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                className={`px-3 py-1.5 text-sm rounded ${
                                    link.active
                                        ? 'bg-indigo-600 text-white'
                                        : link.url
                                            ? 'text-gray-700 hover:bg-gray-100'
                                            : 'text-gray-400 cursor-not-allowed'
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
