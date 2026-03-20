import { useState } from 'react';
import { router } from '@inertiajs/react';
import type { PaymentMethodData } from '@/types/cms';
import { CreditCard, Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import DriverConfigFields from './DriverConfigFields';

const DRIVER_LABELS: Record<string, string> = {
    stripe: 'Stripe',
    paypal: 'PayPal',
    cod: 'Paiement a la livraison',
    bank_transfer: 'Virement bancaire',
};

const DRIVER_OPTIONS = [
    { value: 'stripe', label: 'Stripe' },
    { value: 'paypal', label: 'PayPal' },
    { value: 'cod', label: 'Paiement a la livraison' },
    { value: 'bank_transfer', label: 'Virement bancaire' },
];

interface PaymentMethodsSectionProps {
    paymentMethods: (PaymentMethodData & { config?: Record<string, string> })[];
}

export default function PaymentMethodsSection({ paymentMethods }: PaymentMethodsSectionProps) {
    const { cms } = usePage<SharedProps>().props;
    const prefix = cms?.adminPrefix ?? 'admin';
    const [showPmForm, setShowPmForm] = useState(false);
    const [editingPm, setEditingPm] = useState<(PaymentMethodData & { config?: Record<string, string> }) | null>(null);
    const [pmForm, setPmForm] = useState({
        name: '',
        driver: 'stripe' as string,
        active: true,
        config: {} as Record<string, string>,
    });
    const [pmProcessing, setPmProcessing] = useState(false);

    function openNewPm() {
        setEditingPm(null);
        setPmForm({ name: '', driver: 'stripe', active: true, config: {} });
        setShowPmForm(true);
    }

    function openEditPm(pm: PaymentMethodData & { config?: Record<string, string> }) {
        setEditingPm(pm);
        setPmForm({
            name: pm.name,
            driver: pm.driver,
            active: pm.active,
            config: pm.config || {},
        });
        setShowPmForm(true);
    }

    function handlePmSubmit(e: React.FormEvent) {
        e.preventDefault();
        setPmProcessing(true);

        if (editingPm) {
            router.put(`/admin/shop/payment-methods/${editingPm.id}`, pmForm, {
                onFinish: () => {
                    setPmProcessing(false);
                    setShowPmForm(false);
                },
            });
        } else {
            router.post(`/${prefix}/shop/payment-methods`, pmForm, {
                onFinish: () => {
                    setPmProcessing(false);
                    setShowPmForm(false);
                },
            });
        }
    }

    function handleDeletePm(pm: PaymentMethodData) {
        if (!confirm(`Supprimer le mode de paiement "${pm.name}" ?`)) return;
        router.delete(`/admin/shop/payment-methods/${pm.id}`);
    }

    function handleTogglePm(pm: PaymentMethodData) {
        router.post(`/admin/shop/payment-methods/${pm.id}/toggle`);
    }

    function updatePmConfig(key: string, value: string) {
        setPmForm((prev) => ({ ...prev, config: { ...prev.config, [key]: value } }));
    }

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-medium text-gray-900">
                    <CreditCard className="h-5 w-5 text-gray-500" />
                    Modes de paiement
                </h2>
                <button
                    type="button"
                    onClick={openNewPm}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Ajouter
                </button>
            </div>

            {paymentMethods.length === 0 && !showPmForm && (
                <p className="text-sm text-gray-500 py-4 text-center">
                    Aucun mode de paiement configure. Ajoutez-en un pour commencer.
                </p>
            )}

            {/* List */}
            <div className="divide-y divide-gray-100">
                {paymentMethods.map((pm) => (
                    <div key={pm.id} className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => handleTogglePm(pm)}
                                title={pm.active ? 'Desactiver' : 'Activer'}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                {pm.active ? (
                                    <ToggleRight className="h-6 w-6 text-green-500" />
                                ) : (
                                    <ToggleLeft className="h-6 w-6 text-gray-300" />
                                )}
                            </button>
                            <div>
                                <p className="text-sm font-medium text-gray-900">{pm.name}</p>
                                <p className="text-xs text-gray-500">{DRIVER_LABELS[pm.driver] || pm.driver}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => openEditPm(pm)}
                                className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                title="Modifier"
                            >
                                <Pencil className="h-4 w-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDeletePm(pm)}
                                className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                                title="Supprimer"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Form (create/edit) */}
            {showPmForm && (
                <form onSubmit={handlePmSubmit} className="mt-4 rounded-lg border border-indigo-200 bg-indigo-50/50 p-4 space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900">
                        {editingPm ? `Modifier : ${editingPm.name}` : 'Nouveau mode de paiement'}
                    </h3>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nom</label>
                            <input
                                type="text"
                                value={pmForm.name}
                                onChange={(e) => setPmForm((prev) => ({ ...prev, name: e.target.value }))}
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder="Ex: Carte bancaire"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Passerelle</label>
                            <select
                                value={pmForm.driver}
                                onChange={(e) =>
                                    setPmForm((prev) => ({
                                        ...prev,
                                        driver: e.target.value,
                                        config: {},
                                    }))
                                }
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                                {DRIVER_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            id="pm_active"
                            type="checkbox"
                            checked={pmForm.active}
                            onChange={(e) => setPmForm((prev) => ({ ...prev, active: e.target.checked }))}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <label htmlFor="pm_active" className="text-sm text-gray-700">
                            Actif
                        </label>
                    </div>

                    {/* Driver-specific config */}
                    <DriverConfigFields
                        driver={pmForm.driver}
                        config={pmForm.config}
                        onChange={updatePmConfig}
                    />

                    <div className="flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setShowPmForm(false)}
                            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={pmProcessing}
                            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                        >
                            {pmProcessing ? 'Enregistrement...' : editingPm ? 'Mettre a jour' : 'Creer'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
