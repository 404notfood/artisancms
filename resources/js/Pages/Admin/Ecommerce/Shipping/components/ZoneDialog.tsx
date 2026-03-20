import { useForm } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import type { ShippingZoneData } from './types';
import DialogOverlay from './DialogOverlay';

interface ZoneDialogProps {
    editingZone: ShippingZoneData | null;
    onClose: () => void;
}

export default function ZoneDialog({ editingZone, onClose }: ZoneDialogProps) {
    const { cms } = usePage<SharedProps>().props;
    const prefix = cms?.adminPrefix ?? 'admin';
    const zoneForm = useForm({
        name: editingZone?.name ?? '',
        countries: editingZone?.countries.join(', ') ?? '',
        is_default: editingZone?.is_default ?? false,
    });

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

        if (editingZone) {
            router.put(`/admin/shop/shipping/zones/${editingZone.id}`, payload, {
                onSuccess: () => onClose(),
            });
        } else {
            router.post(`/${prefix}/shop/shipping/zones`, payload, {
                onSuccess: () => onClose(),
            });
        }
    }

    return (
        <DialogOverlay onClose={onClose}>
            <form onSubmit={handleZoneSubmit} className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">
                    {editingZone ? 'Modifier la zone' : 'Nouvelle zone de livraison'}
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
                        onClick={onClose}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                    >
                        {editingZone ? 'Enregistrer' : 'Creer'}
                    </button>
                </div>
            </form>
        </DialogOverlay>
    );
}
