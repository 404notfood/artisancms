import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { ShippingZoneData, ShippingMethodData } from './components/types';
import ZoneCard from './components/ZoneCard';
import ZoneDialog from './components/ZoneDialog';
import MethodDialog from './components/MethodDialog';

interface ShippingIndexProps {
    zones: ShippingZoneData[];
}

export default function ShippingIndex({ zones }: ShippingIndexProps) {
    const [expandedZones, setExpandedZones] = useState<Set<number>>(new Set(zones.map((z) => z.id)));

    // Zone dialog state
    const [showZoneDialog, setShowZoneDialog] = useState(false);
    const [editingZone, setEditingZone] = useState<ShippingZoneData | null>(null);

    // Method dialog state
    const [methodDialogZoneId, setMethodDialogZoneId] = useState<number | null>(null);
    const [editingMethod, setEditingMethod] = useState<ShippingMethodData | null>(null);

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
        setEditingZone(null);
        setShowZoneDialog(true);
    }

    function openEditZone(zone: ShippingZoneData) {
        setEditingZone(zone);
        setShowZoneDialog(true);
    }

    function closeZoneDialog() {
        setShowZoneDialog(false);
        setEditingZone(null);
    }

    function openCreateMethod(zoneId: number) {
        setEditingMethod(null);
        setMethodDialogZoneId(zoneId);
    }

    function openEditMethod(method: ShippingMethodData) {
        setEditingMethod(method);
        setMethodDialogZoneId(method.shipping_zone_id);
    }

    function closeMethodDialog() {
        setMethodDialogZoneId(null);
        setEditingMethod(null);
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
                        <Plus className="h-4 w-4" />
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
                        <ZoneCard
                            key={zone.id}
                            zone={zone}
                            expanded={expandedZones.has(zone.id)}
                            onToggle={() => toggleZone(zone.id)}
                            onEditZone={() => openEditZone(zone)}
                            onEditMethod={openEditMethod}
                            onCreateMethod={() => openCreateMethod(zone.id)}
                        />
                    ))
                )}
            </div>

            {showZoneDialog && (
                <ZoneDialog
                    editingZone={editingZone}
                    onClose={closeZoneDialog}
                />
            )}

            {methodDialogZoneId !== null && (
                <MethodDialog
                    zoneId={methodDialogZoneId}
                    editingMethod={editingMethod}
                    onClose={closeMethodDialog}
                />
            )}
        </AdminLayout>
    );
}
