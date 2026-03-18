import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, router } from '@inertiajs/react';
import type { EcommerceSettingsData, PaymentMethodData } from '@/types/cms';
import { CreditCard, Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';

interface EcommerceSettingsProps {
    settings: EcommerceSettingsData;
    paymentMethods: (PaymentMethodData & { config?: Record<string, string> })[];
}

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

function DriverConfigFields({
    driver,
    config,
    onChange,
}: {
    driver: string;
    config: Record<string, string>;
    onChange: (key: string, value: string) => void;
}) {
    const inputClass =
        'mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';
    const labelClass = 'block text-sm font-medium text-gray-700';

    if (driver === 'stripe') {
        return (
            <div className="space-y-3">
                <div>
                    <label className={labelClass}>Cle publique (Publishable Key)</label>
                    <input
                        type="text"
                        value={config.stripe_publishable_key || ''}
                        onChange={(e) => onChange('stripe_publishable_key', e.target.value)}
                        className={inputClass}
                        placeholder="pk_..."
                    />
                </div>
                <div>
                    <label className={labelClass}>Cle secrete (Secret Key)</label>
                    <input
                        type="password"
                        value={config.stripe_secret_key || ''}
                        onChange={(e) => onChange('stripe_secret_key', e.target.value)}
                        className={inputClass}
                        placeholder="sk_..."
                    />
                </div>
                <div>
                    <label className={labelClass}>Webhook Secret</label>
                    <input
                        type="password"
                        value={config.stripe_webhook_secret || ''}
                        onChange={(e) => onChange('stripe_webhook_secret', e.target.value)}
                        className={inputClass}
                        placeholder="whsec_..."
                    />
                </div>
            </div>
        );
    }

    if (driver === 'paypal') {
        return (
            <div className="space-y-3">
                <div>
                    <label className={labelClass}>Client ID</label>
                    <input
                        type="text"
                        value={config.paypal_client_id || ''}
                        onChange={(e) => onChange('paypal_client_id', e.target.value)}
                        className={inputClass}
                    />
                </div>
                <div>
                    <label className={labelClass}>Secret</label>
                    <input
                        type="password"
                        value={config.paypal_secret || ''}
                        onChange={(e) => onChange('paypal_secret', e.target.value)}
                        className={inputClass}
                    />
                </div>
                <div>
                    <label className={labelClass}>Mode</label>
                    <select
                        value={config.paypal_mode || 'sandbox'}
                        onChange={(e) => onChange('paypal_mode', e.target.value)}
                        className={inputClass}
                    >
                        <option value="sandbox">Sandbox (test)</option>
                        <option value="live">Live (production)</option>
                    </select>
                </div>
            </div>
        );
    }

    if (driver === 'bank_transfer') {
        return (
            <div className="space-y-3">
                <div>
                    <label className={labelClass}>Nom de la banque</label>
                    <input
                        type="text"
                        value={config.bank_name || ''}
                        onChange={(e) => onChange('bank_name', e.target.value)}
                        className={inputClass}
                    />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className={labelClass}>IBAN</label>
                        <input
                            type="text"
                            value={config.bank_iban || ''}
                            onChange={(e) => onChange('bank_iban', e.target.value)}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>BIC</label>
                        <input
                            type="text"
                            value={config.bank_bic || ''}
                            onChange={(e) => onChange('bank_bic', e.target.value)}
                            className={inputClass}
                        />
                    </div>
                </div>
                <div>
                    <label className={labelClass}>Titulaire du compte</label>
                    <input
                        type="text"
                        value={config.bank_holder || ''}
                        onChange={(e) => onChange('bank_holder', e.target.value)}
                        className={inputClass}
                    />
                </div>
            </div>
        );
    }

    if (driver === 'cod') {
        return (
            <div>
                <label className={labelClass}>Instructions pour le client</label>
                <textarea
                    value={config.instructions || ''}
                    onChange={(e) => onChange('instructions', e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    rows={3}
                    placeholder="Le paiement sera collecte a la livraison..."
                />
            </div>
        );
    }

    return null;
}

export default function EcommerceSettings({ settings, paymentMethods }: EcommerceSettingsProps) {
    const { data, setData, put, processing, errors } = useForm({
        store_name: settings.store_name,
        currency: settings.currency,
        currency_symbol: settings.currency_symbol,
        tax_rate: settings.tax_rate,
        shipping_cost: settings.shipping_cost,
        free_shipping_threshold: settings.free_shipping_threshold,
    });

    // Payment method form state
    const [showPmForm, setShowPmForm] = useState(false);
    const [editingPm, setEditingPm] = useState<(PaymentMethodData & { config?: Record<string, string> }) | null>(null);
    const [pmForm, setPmForm] = useState({
        name: '',
        driver: 'stripe' as string,
        active: true,
        config: {} as Record<string, string>,
    });
    const [pmProcessing, setPmProcessing] = useState(false);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        put('/admin/shop/settings');
    }

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
            router.post('/admin/shop/payment-methods', pmForm, {
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
        <AdminLayout
            header={
                <h1 className="text-xl font-semibold text-gray-900">Parametres Boutique</h1>
            }
        >
            <Head title="Parametres Boutique" />

            <div className="mx-auto max-w-2xl space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* General */}
                    <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
                        <h2 className="text-lg font-medium text-gray-900">General</h2>

                        <div>
                            <label htmlFor="store_name" className="block text-sm font-medium text-gray-700">
                                Nom de la boutique
                            </label>
                            <input
                                id="store_name"
                                type="text"
                                value={data.store_name}
                                onChange={(e) => setData('store_name', e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                required
                            />
                            {errors.store_name && <p className="mt-1 text-sm text-red-600">{errors.store_name}</p>}
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label htmlFor="currency" className="block text-sm font-medium text-gray-700">
                                    Devise (code ISO)
                                </label>
                                <input
                                    id="currency"
                                    type="text"
                                    value={data.currency}
                                    onChange={(e) => setData('currency', e.target.value.toUpperCase())}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    maxLength={5}
                                    required
                                />
                                {errors.currency && <p className="mt-1 text-sm text-red-600">{errors.currency}</p>}
                            </div>

                            <div>
                                <label htmlFor="currency_symbol" className="block text-sm font-medium text-gray-700">
                                    Symbole de la devise
                                </label>
                                <input
                                    id="currency_symbol"
                                    type="text"
                                    value={data.currency_symbol}
                                    onChange={(e) => setData('currency_symbol', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    maxLength={5}
                                    required
                                />
                                {errors.currency_symbol && <p className="mt-1 text-sm text-red-600">{errors.currency_symbol}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Tax & Shipping */}
                    <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
                        <h2 className="text-lg font-medium text-gray-900">TVA et livraison</h2>

                        <div>
                            <label htmlFor="tax_rate" className="block text-sm font-medium text-gray-700">
                                Taux de TVA (%)
                            </label>
                            <div className="relative mt-1">
                                <input
                                    id="tax_rate"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    value={data.tax_rate}
                                    onChange={(e) => setData('tax_rate', parseFloat(e.target.value) || 0)}
                                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    required
                                />
                                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 text-sm">
                                    %
                                </span>
                            </div>
                            {errors.tax_rate && <p className="mt-1 text-sm text-red-600">{errors.tax_rate}</p>}
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label htmlFor="shipping_cost" className="block text-sm font-medium text-gray-700">
                                    Frais de livraison
                                </label>
                                <div className="relative mt-1">
                                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 text-sm">
                                        {data.currency_symbol}
                                    </span>
                                    <input
                                        id="shipping_cost"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={data.shipping_cost}
                                        onChange={(e) => setData('shipping_cost', parseFloat(e.target.value) || 0)}
                                        className="block w-full rounded-lg border border-gray-300 pl-8 pr-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        required
                                    />
                                </div>
                                {errors.shipping_cost && <p className="mt-1 text-sm text-red-600">{errors.shipping_cost}</p>}
                            </div>

                            <div>
                                <label htmlFor="free_shipping_threshold" className="block text-sm font-medium text-gray-700">
                                    Livraison gratuite a partir de
                                </label>
                                <div className="relative mt-1">
                                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 text-sm">
                                        {data.currency_symbol}
                                    </span>
                                    <input
                                        id="free_shipping_threshold"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={data.free_shipping_threshold}
                                        onChange={(e) => setData('free_shipping_threshold', parseFloat(e.target.value) || 0)}
                                        className="block w-full rounded-lg border border-gray-300 pl-8 pr-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        required
                                    />
                                </div>
                                {errors.free_shipping_threshold && <p className="mt-1 text-sm text-red-600">{errors.free_shipping_threshold}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Save settings */}
                    <div className="flex items-center justify-end">
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                        >
                            {processing ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                    </div>
                </form>

                {/* Payment Methods */}
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
            </div>
        </AdminLayout>
    );
}
