import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link , usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { ProductData, StockMovementData, PaginatedResponse, SharedProps } from '@/types/cms';

interface StockMovementsProps {
    product: ProductData & { variants?: { id: number; name: string; sku: string; stock: number }[] };
    movements: PaginatedResponse<StockMovementData>;
    variantId: number | null;
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
    sale: { label: 'Vente', color: 'bg-blue-100 text-blue-700' },
    return: { label: 'Retour', color: 'bg-green-100 text-green-700' },
    adjustment: { label: 'Ajustement', color: 'bg-yellow-100 text-yellow-700' },
    restock: { label: 'Réapprovisionnement', color: 'bg-purple-100 text-purple-700' },
};

export default function StockMovements({ product, movements, variantId }: StockMovementsProps) {
    const { cms } = usePage<SharedProps>().props;
    const prefix = cms?.adminPrefix ?? 'admin';
    return (
        <AdminLayout>
            <Head title={`Historique stock - ${product.name}`} />

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link
                        href={`/${prefix}/shop/stock`}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Historique du stock</h1>
                        <p className="text-sm text-gray-500">{product.name} — Stock actuel : <strong>{product.stock}</strong></p>
                    </div>
                </div>

                {/* Variant filter */}
                {product.variants && product.variants.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                        <Link
                            href={`/admin/shop/stock/${product.id}/movements`}
                            className={`px-3 py-1.5 text-sm rounded-lg border ${
                                !variantId ? 'bg-indigo-600 text-white border-indigo-600' : 'text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                            Tous
                        </Link>
                        {product.variants.map(v => (
                            <Link
                                key={v.id}
                                href={`/admin/shop/stock/${product.id}/movements?variant_id=${v.id}`}
                                className={`px-3 py-1.5 text-sm rounded-lg border ${
                                    variantId === v.id ? 'bg-indigo-600 text-white border-indigo-600' : 'text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                {v.name} ({v.stock})
                            </Link>
                        ))}
                    </div>
                )}

                {/* Movements table */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Quantité</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Référence</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Par</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {movements.data.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                                        Aucun mouvement de stock enregistré.
                                    </td>
                                </tr>
                            )}
                            {movements.data.map(mov => {
                                const typeInfo = TYPE_LABELS[mov.type] ?? { label: mov.type, color: 'bg-gray-100 text-gray-700' };
                                return (
                                    <tr key={mov.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {new Date(mov.created_at).toLocaleString('fr-FR', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${typeInfo.color}`}>
                                                {typeInfo.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`text-sm font-bold ${mov.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {mov.quantity > 0 ? '+' : ''}{mov.quantity}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{mov.reference || '—'}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{mov.creator?.name || 'Système'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}
