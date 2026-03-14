import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';

interface ShippingMethodData {
    id: number;
    shipping_zone_id: number;
    name: string;
    type: 'flat' | 'free' | 'weight_based' | 'price_based';
    cost: number;
    min_order_amount: number | null;
    min_weight: number | null;
    max_weight: number | null;
    active: boolean;
    order: number;
}

interface ShippingZoneData {
    id: number;
    name: string;
    countries: string[];
    is_default: boolean;
    methods: ShippingMethodData[];
}

interface ShippingIndexProps {
    zones: ShippingZoneData[];
}

const SHIPPING_TYPES: Record<string, string> = {
    flat: 'Tarif fixe',
    free: 'Gratuit',
    weight_based: 'Base sur le poids',
    price_based: 'Base sur le prix',
};

export default function ShippingIndex({ zones }: ShippingIndexProps) {
    const [expandedZones, setExpandedZones] = useState<Set<number>>(new Set(zones.map((z) => z.id)));
    const [showZoneDialog, setShowZoneDialog] = useState(false);
    const [editingZoneId, setEditingZoneId] = useState<number | null>(null);
    const [showMethodDialog, setShowMethodDialog] = useState<number | null>(null);
    const [editingMethodId, setEditingMethodId] = useState<number | null>(null);

    const zoneForm = useForm({
        name: '',
        countries: '' as string,
        is_default: false,
    });

    const methodForm = useForm({
        name: '',
        type: 'flat' as string,
        cost: 0,
        min_order_amount: '' as string | number,
        min_weight: '' as string | number,
        max_weight: '' as string | number,
        active: true,
        order: 0,
    });

    function toggleZone(id: number) {
        setExpandedZones((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }

    function openCreateZone() {
        zoneForm.reset();
        zoneForm.setData({ name: '', countries: '', is_default: false });
        setEditingZoneId(null);
        setShowZoneDialog(true);
    }

    function openEditZone(zone: ShippingZoneData) {
        zoneForm.setData({
            name: zone.name,
            countries: zone.countries.join(', '),
            is_default: zone.is_default,
        });
        setEditingZoneId(zone.id);
        setShowZoneDialog(true);
    }

    function handleZoneSubmit(e: React.FormEvent) {
        e.preventDefault();
        const countries = zoneForm.data.countries
            .split(',')
            .map((c) => c.trim().toUpperCase())
            .filter((c) => c.length === 2);

        const payload = {
            name: zoneForm.data.name,
            countries,
            is_default: zoneForm.data.is_default,
        };

        if (editingZoneId) {
            router.put(`/admin/shop/shipping/zones/${editingZoneId}`, payload, {
                onSuccess: () => {
                    setShowZoneDialog(false);
                    setEditingZoneId(null);
                },
            });
        } else {
            router.post('/admin/shop/shipping/zones', payload, {
                onSuccess: () => {
                    setShowZoneDialog(false);
                    zoneForm.reset();
                },
            });
        }
    }

    function handleDeleteZone(zone: ShippingZoneData) {
        if (!confirm(`Supprimer la zone "${zone.name}" et toutes ses methodes de livraison ?`)) return;
        router.delete(`/admin/shop/shipping/zones/${zone.id}`);
    }

    function openCreateMethod(zoneId: number) {
        methodForm.reset();
        methodForm.setData({
            name: '',
            type: 'flat',
            cost: 0,
            min_order_amount: '',
            min_weight: '',
            max_weight: '',
            active: true,
            order: 0,
        });
        setEditingMethodId(null);
        setShowMethodDialog(zoneId);
    }

    function openEditMethod(method: ShippingMethodData) {
        methodForm.setData({
            name: method.name,
            type: method.type,
            cost: method.cost,
            min_order_amount: method.min_order_amount ?? '',
            min_weight: method.min_weight ?? '',
            max_weight: method.max_weight ?? '',
            active: method.active,
            order: method.order,
        });
        setEditingMethodId(method.id);
        setShowMethodDialog(method.shipping_zone_id);
    }

    function handleMethodSubmit(e: React.FormEvent) {
        e.preventDefault();
        const payload = {
            name: methodForm.data.name,
            type: methodForm.data.type,
            cost: Number(methodForm.data.cost),
            min_order_amount: methodForm.data.min_order_amount === '' ? null : Number(methodForm.data.min_order_amount),
            min_weight: methodForm.data.min_weight === '' ? null : Number(methodForm.data.min_weight),
            max_weight: methodForm.data.max_weight === '' ? null : Number(methodForm.data.max_weight),
            active: methodForm.data.active,
            order: Number(methodForm.data.order),
        };

        if (editingMethodId) {
            router.put(`/admin/shop/shipping/methods/${editingMethodId}`, payload, {
                onSuccess: () => {
                    setShowMethodDialog(null);
                    setEditingMethodId(null);
                },
            });
        } else if (showMethodDialog) {
            router.post(`/admin/shop/shipping/zones/${showMethodDialog}/methods`, payload, {
                onSuccess: () => {
                    setShowMethodDialog(null);
                    methodForm.reset();
                },
            });
        }
    }

    function handleDeleteMethod(method: ShippingMethodData) {
        if (!confirm(`Supprimer la methode "${method.name}" ?`)) return;
        router.delete(`/admin/shop/shipping/methods/${method.id}`);
    }

    function formatPrice(price: number): string {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price);
    }

    return (
        <AdminLayout
            header={
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-gray-900">Livraison</h1>
                    <button
                        onClick={openCreateZone}
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                    >
                        <PlusIcon />
                        Nouvelle zone
                    </button>
                </div>
            }
        >
            <Head title="Livraison" />

            <div className="mx-auto max-w-5xl space-y-4">
                {zones.length === 0 ? (
                    <div className="rounded-lg border border-gray-200 bg-white px-6 py-12 text-center text-gray-500">
                        Aucune zone de livraison configuree. Creez votre premiere zone pour commencer.
                    </div>
                ) : (
                    zones.map((zone) => (
                        <div key={zone.id} className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                            {/* Zone Header */}
                            <div
                                className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-gray-50"
                                onClick={() => toggleZone(zone.id)}
                            >
                                <div className="flex items-center gap-3">
                                    <ChevronIcon expanded={expandedZones.has(zone.id)} />
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
                                        onClick={() => openEditZone(zone)}
                                        className="text-gray-500 hover:text-indigo-600"
                                        title="Modifier la zone"
                                    >
                                        <EditIcon />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteZone(zone)}
                                        className="text-gray-500 hover:text-red-600"
                                        title="Supprimer la zone"
                                    >
                                        <TrashIcon />
                                    </button>
                                </div>
                            </div>

                            {/* Zone Content (Methods) */}
                            {expandedZones.has(zone.id) && (
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
                                                                    onClick={() => openEditMethod(method)}
                                                                    className="text-gray-500 hover:text-indigo-600"
                                                                    title="Modifier"
                                                                >
                                                                    <EditIcon />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteMethod(method)}
                                                                    className="text-gray-500 hover:text-red-600"
                                                                    title="Supprimer"
                                                                >
                                                                    <TrashIcon />
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
                                            onClick={() => openCreateMethod(zone.id)}
                                            className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                                        >
                                            <PlusIcon />
                                            Ajouter une methode
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Zone Dialog */}
            {showZoneDialog && (
                <DialogOverlay onClose={() => setShowZoneDialog(false)}>
                    <form onSubmit={handleZoneSubmit} className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-900">
                            {editingZoneId ? 'Modifier la zone' : 'Nouvelle zone de livraison'}
                        </h2>

                        <div>
                            <label htmlFor="zone-name" className="block text-sm font-medium text-gray-700">
                                Nom
                            </label>
                            <input
                                id="zone-name"
                                type="text"
                                value={zoneForm.data.name}
                                onChange={(e) => zoneForm.setData('name', e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder="Ex: France metropolitaine"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="zone-countries" className="block text-sm font-medium text-gray-700">
                                Codes pays (separes par des virgules)
                            </label>
                            <input
                                id="zone-countries"
                                type="text"
                                value={zoneForm.data.countries}
                                onChange={(e) => zoneForm.setData('countries', e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder="FR, BE, CH, LU"
                                required
                            />
                            <p className="mt-1 text-xs text-gray-500">Codes ISO 3166-1 alpha-2</p>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                id="zone-default"
                                type="checkbox"
                                checked={zoneForm.data.is_default}
                                onChange={(e) => zoneForm.setData('is_default', e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <label htmlFor="zone-default" className="text-sm text-gray-700">
                                Zone par defaut (pour les pays non couverts)
                            </label>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setShowZoneDialog(false)}
                                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                            >
                                {editingZoneId ? 'Enregistrer' : 'Creer'}
                            </button>
                        </div>
                    </form>
                </DialogOverlay>
            )}

            {/* Method Dialog */}
            {showMethodDialog !== null && (
                <DialogOverlay onClose={() => setShowMethodDialog(null)}>
                    <form onSubmit={handleMethodSubmit} className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-900">
                            {editingMethodId ? 'Modifier la methode' : 'Nouvelle methode de livraison'}
                        </h2>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label htmlFor="method-name" className="block text-sm font-medium text-gray-700">
                                    Nom
                                </label>
                                <input
                                    id="method-name"
                                    type="text"
                                    value={methodForm.data.name}
                                    onChange={(e) => methodForm.setData('name', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    placeholder="Ex: Colissimo"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="method-type" className="block text-sm font-medium text-gray-700">
                                    Type
                                </label>
                                <select
                                    id="method-type"
                                    value={methodForm.data.type}
                                    onChange={(e) => methodForm.setData('type', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                >
                                    {Object.entries(SHIPPING_TYPES).map(([value, label]) => (
                                        <option key={value} value={value}>{label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="method-cost" className="block text-sm font-medium text-gray-700">
                                    Cout
                                </label>
                                <input
                                    id="method-cost"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={methodForm.data.cost}
                                    onChange={(e) => methodForm.setData('cost', parseFloat(e.target.value) || 0)}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>

                            <div>
                                <label htmlFor="method-min-order" className="block text-sm font-medium text-gray-700">
                                    Commande minimum
                                </label>
                                <input
                                    id="method-min-order"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={methodForm.data.min_order_amount}
                                    onChange={(e) => methodForm.setData('min_order_amount', e.target.value === '' ? '' : parseFloat(e.target.value))}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    placeholder="Optionnel"
                                />
                            </div>

                            <div>
                                <label htmlFor="method-min-weight" className="block text-sm font-medium text-gray-700">
                                    Poids min. (kg)
                                </label>
                                <input
                                    id="method-min-weight"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={methodForm.data.min_weight}
                                    onChange={(e) => methodForm.setData('min_weight', e.target.value === '' ? '' : parseFloat(e.target.value))}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    placeholder="Optionnel"
                                />
                            </div>

                            <div>
                                <label htmlFor="method-max-weight" className="block text-sm font-medium text-gray-700">
                                    Poids max. (kg)
                                </label>
                                <input
                                    id="method-max-weight"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={methodForm.data.max_weight}
                                    onChange={(e) => methodForm.setData('max_weight', e.target.value === '' ? '' : parseFloat(e.target.value))}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    placeholder="Optionnel"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <input
                                    id="method-active"
                                    type="checkbox"
                                    checked={methodForm.data.active}
                                    onChange={(e) => methodForm.setData('active', e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <label htmlFor="method-active" className="text-sm text-gray-700">
                                    Active
                                </label>
                            </div>

                            <div className="flex items-center gap-2">
                                <label htmlFor="method-order" className="text-sm text-gray-700">
                                    Ordre :
                                </label>
                                <input
                                    id="method-order"
                                    type="number"
                                    min="0"
                                    value={methodForm.data.order}
                                    onChange={(e) => methodForm.setData('order', parseInt(e.target.value) || 0)}
                                    className="w-20 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setShowMethodDialog(null)}
                                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                            >
                                {editingMethodId ? 'Enregistrer' : 'Creer'}
                            </button>
                        </div>
                    </form>
                </DialogOverlay>
            )}
        </AdminLayout>
    );
}

// ---- Helper Components ----

interface DialogOverlayProps {
    children: React.ReactNode;
    onClose: () => void;
}

function DialogOverlay({ children, onClose }: DialogOverlayProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/40" onClick={onClose} />
            <div className="relative z-10 w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
                {children}
            </div>
        </div>
    );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
    return (
        <svg
            className={`h-5 w-5 text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
        >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
    );
}

function PlusIcon() {
    return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
    );
}

function EditIcon() {
    return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
        </svg>
    );
}

function TrashIcon() {
    return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
        </svg>
    );
}
