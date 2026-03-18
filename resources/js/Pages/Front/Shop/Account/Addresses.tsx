import { Head, router, usePage } from '@inertiajs/react';
import type { FormDataConvertible } from '@inertiajs/core';
import { useState } from 'react';
import type { CustomerAddressData, EcommerceSettingsData, FlashMessages } from '@/types/cms';

interface AddressesProps {
    addresses: CustomerAddressData[];
    settings: EcommerceSettingsData;
}

const COUNTRIES: Record<string, string> = {
    FR: 'France',
    BE: 'Belgique',
    CH: 'Suisse',
    CA: 'Canada',
    LU: 'Luxembourg',
    MC: 'Monaco',
    DE: 'Allemagne',
    ES: 'Espagne',
    IT: 'Italie',
    GB: 'Royaume-Uni',
    US: '\u00c9tats-Unis',
    PT: 'Portugal',
    NL: 'Pays-Bas',
    AT: 'Autriche',
};

interface AddressFormData {
    label: string;
    first_name: string;
    last_name: string;
    address: string;
    address2: string;
    city: string;
    postal_code: string;
    country: string;
    phone: string;
    is_default_shipping: boolean;
    is_default_billing: boolean;
}

const emptyForm: AddressFormData = {
    label: '',
    first_name: '',
    last_name: '',
    address: '',
    address2: '',
    city: '',
    postal_code: '',
    country: 'FR',
    phone: '',
    is_default_shipping: false,
    is_default_billing: false,
};

export default function Addresses({ addresses }: AddressesProps) {
    const flash = (usePage().props as { flash?: FlashMessages }).flash;
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState<AddressFormData>({ ...emptyForm });
    const [processing, setProcessing] = useState(false);

    function openCreateForm() {
        setEditingId(null);
        setForm({ ...emptyForm });
        setShowForm(true);
    }

    function openEditForm(address: CustomerAddressData) {
        setEditingId(address.id);
        setForm({
            label: address.label,
            first_name: address.first_name,
            last_name: address.last_name,
            address: address.address,
            address2: address.address2 ?? '',
            city: address.city,
            postal_code: address.postal_code,
            country: address.country,
            phone: address.phone ?? '',
            is_default_shipping: address.is_default_shipping,
            is_default_billing: address.is_default_billing,
        });
        setShowForm(true);
    }

    function closeForm() {
        setShowForm(false);
        setEditingId(null);
        setForm({ ...emptyForm });
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setProcessing(true);

        if (editingId !== null) {
            router.put(`/account/addresses/${editingId}`, form as unknown as Record<string, FormDataConvertible>, {
                onFinish: () => {
                    setProcessing(false);
                    closeForm();
                },
            });
        } else {
            router.post('/account/addresses', form as unknown as Record<string, FormDataConvertible>, {
                onFinish: () => {
                    setProcessing(false);
                    closeForm();
                },
            });
        }
    }

    function handleDelete(address: CustomerAddressData) {
        if (!confirm(`Supprimer l'adresse "${address.label}" ?`)) return;
        router.delete(`/account/addresses/${address.id}`);
    }

    function updateField(field: keyof AddressFormData, value: string | boolean) {
        setForm((prev) => ({ ...prev, [field]: value }));
    }

    return (
        <>
            <Head title="Mes adresses" />

            <div className="mx-auto max-w-5xl px-4 py-8">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">Mes adresses</h1>
                    <button
                        onClick={openCreateForm}
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                    >
                        <PlusIcon />
                        Ajouter une adresse
                    </button>
                </div>

                {flash?.success && (
                    <div className="mb-4 rounded-lg bg-green-50 p-4 text-sm text-green-700">
                        {flash.success}
                    </div>
                )}

                {/* Address form modal */}
                {showForm && (
                    <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
                        <h2 className="mb-4 text-lg font-semibold text-gray-900">
                            {editingId !== null ? 'Modifier l\'adresse' : 'Nouvelle adresse'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Libell\u00e9 (ex: Domicile, Bureau)
                                </label>
                                <input
                                    type="text"
                                    value={form.label}
                                    onChange={(e) => updateField('label', e.target.value)}
                                    required
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Pr\u00e9nom</label>
                                    <input
                                        type="text"
                                        value={form.first_name}
                                        onChange={(e) => updateField('first_name', e.target.value)}
                                        required
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                                    <input
                                        type="text"
                                        value={form.last_name}
                                        onChange={(e) => updateField('last_name', e.target.value)}
                                        required
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                                <input
                                    type="text"
                                    value={form.address}
                                    onChange={(e) => updateField('address', e.target.value)}
                                    required
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Compl\u00e9ment d'adresse (optionnel)
                                </label>
                                <input
                                    type="text"
                                    value={form.address2}
                                    onChange={(e) => updateField('address2', e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                                    <input
                                        type="text"
                                        value={form.city}
                                        onChange={(e) => updateField('city', e.target.value)}
                                        required
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Code postal</label>
                                    <input
                                        type="text"
                                        value={form.postal_code}
                                        onChange={(e) => updateField('postal_code', e.target.value)}
                                        required
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Pays</label>
                                    <select
                                        value={form.country}
                                        onChange={(e) => updateField('country', e.target.value)}
                                        required
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    >
                                        {Object.entries(COUNTRIES).map(([code, name]) => (
                                            <option key={code} value={code}>
                                                {name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    T\u00e9l\u00e9phone (optionnel)
                                </label>
                                <input
                                    type="tel"
                                    value={form.phone}
                                    onChange={(e) => updateField('phone', e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>

                            <div className="flex items-center gap-6">
                                <label className="flex items-center gap-2 text-sm text-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={form.is_default_shipping}
                                        onChange={(e) => updateField('is_default_shipping', e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    Adresse de livraison par d\u00e9faut
                                </label>
                                <label className="flex items-center gap-2 text-sm text-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={form.is_default_billing}
                                        onChange={(e) => updateField('is_default_billing', e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    Adresse de facturation par d\u00e9faut
                                </label>
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                                >
                                    {processing ? 'Enregistrement...' : 'Enregistrer'}
                                </button>
                                <button
                                    type="button"
                                    onClick={closeForm}
                                    className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                                >
                                    Annuler
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Address cards */}
                {addresses.length === 0 ? (
                    <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">
                        Aucune adresse enregistr\u00e9e. Ajoutez votre premi\u00e8re adresse.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {addresses.map((address) => (
                            <div
                                key={address.id}
                                className="rounded-lg border border-gray-200 bg-white p-5"
                            >
                                <div className="mb-3 flex items-start justify-between">
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{address.label}</h3>
                                        <div className="mt-1 flex flex-wrap gap-1">
                                            {address.is_default_shipping && (
                                                <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                                                    Livraison par d\u00e9faut
                                                </span>
                                            )}
                                            {address.is_default_billing && (
                                                <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                                                    Facturation par d\u00e9faut
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => openEditForm(address)}
                                            className="text-gray-400 hover:text-indigo-600"
                                            title="Modifier"
                                        >
                                            <EditIcon />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(address)}
                                            className="text-gray-400 hover:text-red-600"
                                            title="Supprimer"
                                        >
                                            <TrashIcon />
                                        </button>
                                    </div>
                                </div>
                                <div className="text-sm text-gray-600 space-y-0.5">
                                    <p>{address.first_name} {address.last_name}</p>
                                    <p>{address.address}</p>
                                    {address.address2 && <p>{address.address2}</p>}
                                    <p>
                                        {address.postal_code} {address.city}
                                    </p>
                                    <p>{COUNTRIES[address.country] ?? address.country}</p>
                                    {address.phone && <p>Tel: {address.phone}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
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
