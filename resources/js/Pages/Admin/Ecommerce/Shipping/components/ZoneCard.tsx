import { router } from '@inertiajs/react';
import { Plus, Pencil, Trash2, ChevronRight } from 'lucide-react';
import type { ShippingZoneData, ShippingMethodData } from './types';
import { SHIPPING_TYPES, formatPrice } from './types';

interface ZoneCardProps {
    zone: ShippingZoneData;
    expanded: boolean;
    onToggle: () => void;
    onEditZone: () => void;
    onEditMethod: (method: ShippingMethodData) => void;
    onCreateMethod: () => void;
}

export default function ZoneCard({
    zone,
    expanded,
    onToggle,
    onEditZone,
    onEditMethod,
    onCreateMethod,
}: ZoneCardProps) {
    function handleDeleteZone() {
        if (!confirm(`Supprimer la zone "${zone.name}" et toutes ses methodes de livraison ?`)) return;
        router.delete(`/admin/shop/shipping/zones/${zone.id}`);
    }

    function handleDeleteMethod(method: ShippingMethodData) {
        if (!confirm(`Supprimer la methode "${method.name}" ?`)) return;
        router.delete(`/admin/shop/shipping/methods/${method.id}`);
    }

    return (
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            {/* Zone Header */}
            <div
                className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-gray-50"
                onClick={onToggle}
            >
                <div className="flex items-center gap-3">
                    <ChevronRight className={`h-5 w-5 text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`} />
                    <div>
                        <h3 className="font-medium text-gray-900">
                            {zone.name}
                            {zone.is_default && (
                                <span className="ml-2 inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                                    Par defaut
                                </span>
                            )}
                        </h3>
                        <p className="text-sm text-gray-500">
                            {zone.countries.length > 0
                                ? zone.countries.join(', ')
                                : 'Aucun pays'}
                            {' '} - {zone.methods.length} methode{zone.methods.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                        onClick={onEditZone}
                        className="text-gray-500 hover:text-indigo-600"
                        title="Modifier la zone"
                    >
                        <Pencil className="h-4 w-4" />
                    </button>
                    <button
                        onClick={handleDeleteZone}
                        className="text-gray-500 hover:text-red-600"
                        title="Supprimer la zone"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Zone Content (Methods) */}
            {expanded && (
                <div className="border-t border-gray-200">
                    {zone.methods.length > 0 ? (
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-2 font-medium text-gray-700">Methode</th>
                                    <th className="px-4 py-2 font-medium text-gray-700">Type</th>
                                    <th className="px-4 py-2 font-medium text-gray-700">Cout</th>
                                    <th className="hidden px-4 py-2 font-medium text-gray-700 md:table-cell">Min. commande</th>
                                    <th className="hidden px-4 py-2 font-medium text-gray-700 lg:table-cell">Poids</th>
                                    <th className="px-4 py-2 font-medium text-gray-700">Actif</th>
                                    <th className="px-4 py-2 font-medium text-gray-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {zone.methods.map((method) => (
                                    <tr key={method.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-3 font-medium text-gray-900">{method.name}</td>
                                        <td className="px-4 py-3 text-gray-600">{SHIPPING_TYPES[method.type] ?? method.type}</td>
                                        <td className="px-4 py-3 text-gray-900">
                                            {method.type === 'free' ? 'Gratuit' : formatPrice(method.cost)}
                                        </td>
                                        <td className="hidden px-4 py-3 text-gray-600 md:table-cell">
                                            {method.min_order_amount !== null ? formatPrice(method.min_order_amount) : '---'}
                                        </td>
                                        <td className="hidden px-4 py-3 text-gray-600 lg:table-cell">
                                            {method.min_weight !== null || method.max_weight !== null
                                                ? `${method.min_weight ?? '0'} - ${method.max_weight ?? '---'} kg`
                                                : '---'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {method.active ? (
                                                <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                                                    Actif
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                                                    Inactif
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => onEditMethod(method)}
                                                    className="text-gray-500 hover:text-indigo-600"
                                                    title="Modifier"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteMethod(method)}
                                                    className="text-gray-500 hover:text-red-600"
                                                    title="Supprimer"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="px-6 py-4 text-sm text-gray-500">
                            Aucune methode de livraison dans cette zone.
                        </div>
                    )}
                    <div className="border-t border-gray-100 px-6 py-3">
                        <button
                            onClick={onCreateMethod}
                            className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                            <Plus className="h-4 w-4" />
                            Ajouter une methode
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
