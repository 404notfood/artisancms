import { useForm } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import type { ShippingMethodData } from './types';
import { SHIPPING_TYPES } from './types';
import DialogOverlay from './DialogOverlay';

interface MethodDialogProps {
    zoneId: number;
    editingMethod: ShippingMethodData | null;
    onClose: () => void;
}

export default function MethodDialog({ zoneId, editingMethod, onClose }: MethodDialogProps) {
    const methodForm = useForm({
        name: editingMethod?.name ?? '',
        type: editingMethod?.type ?? ('flat' as string),
        cost: editingMethod?.cost ?? 0,
        min_order_amount: (editingMethod?.min_order_amount ?? '') as string | number,
        min_weight: (editingMethod?.min_weight ?? '') as string | number,
        max_weight: (editingMethod?.max_weight ?? '') as string | number,
        active: editingMethod?.active ?? true,
        order: editingMethod?.order ?? 0,
    });

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

        if (editingMethod) {
            router.put(`/admin/shop/shipping/methods/${editingMethod.id}`, payload, {
                onSuccess: () => onClose(),
            });
        } else {
            router.post(`/admin/shop/shipping/zones/${zoneId}/methods`, payload, {
                onSuccess: () => onClose(),
            });
        }
    }

    return (
        <DialogOverlay onClose={onClose}>
            <form onSubmit={handleMethodSubmit} className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">
                    {editingMethod ? 'Modifier la methode' : 'Nouvelle methode de livraison'}
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
                        onClick={onClose}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                    >
                        {editingMethod ? 'Enregistrer' : 'Creer'}
                    </button>
                </div>
            </form>
        </DialogOverlay>
    );
}
