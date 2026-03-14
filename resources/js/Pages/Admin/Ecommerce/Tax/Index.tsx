import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';

interface TaxRuleData {
    id: number;
    name: string;
    country_code: string | null;
    region: string | null;
    rate: number;
    priority: number;
    compound: boolean;
    active: boolean;
}

interface TaxIndexProps {
    rules: TaxRuleData[];
}

export default function TaxIndex({ rules }: TaxIndexProps) {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);

    const createForm = useForm({
        name: '',
        country_code: '' as string,
        region: '' as string,
        rate: 20,
        priority: 0,
        compound: false,
        active: true,
    });

    const editForm = useForm({
        name: '',
        country_code: '' as string,
        region: '' as string,
        rate: 0,
        priority: 0,
        compound: false,
        active: true,
    });

    function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        const payload = {
            name: createForm.data.name,
            country_code: createForm.data.country_code || null,
            region: createForm.data.region || null,
            rate: Number(createForm.data.rate),
            priority: Number(createForm.data.priority),
            compound: createForm.data.compound,
            active: createForm.data.active,
        };

        router.post('/admin/shop/tax', payload, {
            onSuccess: () => {
                createForm.reset();
                setShowCreateForm(false);
            },
        });
    }

    function startEdit(rule: TaxRuleData) {
        setEditingId(rule.id);
        editForm.setData({
            name: rule.name,
            country_code: rule.country_code ?? '',
            region: rule.region ?? '',
            rate: rule.rate,
            priority: rule.priority,
            compound: rule.compound,
            active: rule.active,
        });
    }

    function handleUpdate(e: React.FormEvent) {
        e.preventDefault();
        if (!editingId) return;

        const payload = {
            name: editForm.data.name,
            country_code: editForm.data.country_code || null,
            region: editForm.data.region || null,
            rate: Number(editForm.data.rate),
            priority: Number(editForm.data.priority),
            compound: editForm.data.compound,
            active: editForm.data.active,
        };

        router.put(`/admin/shop/tax/${editingId}`, payload, {
            onSuccess: () => setEditingId(null),
        });
    }

    function handleDelete(rule: TaxRuleData) {
        if (!confirm(`Supprimer la regle "${rule.name}" ?`)) return;
        router.delete(`/admin/shop/tax/${rule.id}`);
    }

    function toggleActive(rule: TaxRuleData) {
        router.put(`/admin/shop/tax/${rule.id}`, {
            ...rule,
            active: !rule.active,
        }, { preserveScroll: true });
    }

    function toggleCompound(rule: TaxRuleData) {
        router.put(`/admin/shop/tax/${rule.id}`, {
            ...rule,
            compound: !rule.compound,
        }, { preserveScroll: true });
    }

    return (
        <AdminLayout
            header={
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-gray-900">Taxes</h1>
                    <button
                        onClick={() => setShowCreateForm(!showCreateForm)}
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                    >
                        <PlusIcon />
                        Nouvelle regle
                    </button>
                </div>
            }
        >
            <Head title="Taxes" />

            <div className="mx-auto max-w-5xl space-y-4">
                {/* Inline Create Form */}
                {showCreateForm && (
                    <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Nouvelle regle de taxe</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <div>
                                    <label htmlFor="create-name" className="block text-sm font-medium text-gray-700">
                                        Nom
                                    </label>
                                    <input
                                        id="create-name"
                                        type="text"
                                        value={createForm.data.name}
                                        onChange={(e) => createForm.setData('name', e.target.value)}
                                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        placeholder="Ex: TVA France"
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="create-country" className="block text-sm font-medium text-gray-700">
                                        Code pays
                                    </label>
                                    <input
                                        id="create-country"
                                        type="text"
                                        maxLength={2}
                                        value={createForm.data.country_code}
                                        onChange={(e) => createForm.setData('country_code', e.target.value.toUpperCase())}
                                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        placeholder="FR (vide = defaut)"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="create-region" className="block text-sm font-medium text-gray-700">
                                        Region
                                    </label>
                                    <input
                                        id="create-region"
                                        type="text"
                                        value={createForm.data.region}
                                        onChange={(e) => createForm.setData('region', e.target.value)}
                                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        placeholder="Optionnel"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="create-rate" className="block text-sm font-medium text-gray-700">
                                        Taux (%)
                                    </label>
                                    <input
                                        id="create-rate"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        value={createForm.data.rate}
                                        onChange={(e) => createForm.setData('rate', parseFloat(e.target.value) || 0)}
                                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="create-priority" className="block text-sm font-medium text-gray-700">
                                        Priorite
                                    </label>
                                    <input
                                        id="create-priority"
                                        type="number"
                                        min="0"
                                        value={createForm.data.priority}
                                        onChange={(e) => createForm.setData('priority', parseInt(e.target.value) || 0)}
                                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                </div>

                                <div className="flex items-end gap-4 pb-1">
                                    <div className="flex items-center gap-2">
                                        <input
                                            id="create-compound"
                                            type="checkbox"
                                            checked={createForm.data.compound}
                                            onChange={(e) => createForm.setData('compound', e.target.checked)}
                                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <label htmlFor="create-compound" className="text-sm text-gray-700">
                                            Compose
                                        </label>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <input
                                            id="create-active"
                                            type="checkbox"
                                            checked={createForm.data.active}
                                            onChange={(e) => createForm.setData('active', e.target.checked)}
                                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <label htmlFor="create-active" className="text-sm text-gray-700">
                                            Active
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateForm(false)}
                                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={createForm.processing}
                                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                                >
                                    {createForm.processing ? 'Ajout...' : 'Ajouter'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Rules Table */}
                <div className="rounded-lg border border-gray-200 bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-gray-200 bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 font-medium text-gray-700">Nom</th>
                                    <th className="px-4 py-3 font-medium text-gray-700">Pays</th>
                                    <th className="hidden px-4 py-3 font-medium text-gray-700 md:table-cell">Region</th>
                                    <th className="px-4 py-3 font-medium text-gray-700">Taux</th>
                                    <th className="hidden px-4 py-3 font-medium text-gray-700 md:table-cell">Priorite</th>
                                    <th className="hidden px-4 py-3 font-medium text-gray-700 lg:table-cell">Compose</th>
                                    <th className="px-4 py-3 font-medium text-gray-700">Actif</th>
                                    <th className="px-4 py-3 font-medium text-gray-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {rules.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                                            Aucune regle de taxe. Cliquez sur Nouvelle regle pour en creer une.
                                        </td>
                                    </tr>
                                ) : (
                                    rules.map((rule) => (
                                        editingId === rule.id ? (
                                            <tr key={rule.id} className="bg-indigo-50">
                                                <td colSpan={8} className="p-4">
                                                    <form onSubmit={handleUpdate} className="space-y-3">
                                                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
                                                            <input
                                                                type="text"
                                                                value={editForm.data.name}
                                                                onChange={(e) => editForm.setData('name', e.target.value)}
                                                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                                placeholder="Nom"
                                                                required
                                                            />
                                                            <input
                                                                type="text"
                                                                maxLength={2}
                                                                value={editForm.data.country_code}
                                                                onChange={(e) => editForm.setData('country_code', e.target.value.toUpperCase())}
                                                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                                placeholder="Pays"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={editForm.data.region}
                                                                onChange={(e) => editForm.setData('region', e.target.value)}
                                                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                                placeholder="Region"
                                                            />
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                max="100"
                                                                value={editForm.data.rate}
                                                                onChange={(e) => editForm.setData('rate', parseFloat(e.target.value) || 0)}
                                                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                                placeholder="Taux %"
                                                                required
                                                            />
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                value={editForm.data.priority}
                                                                onChange={(e) => editForm.setData('priority', parseInt(e.target.value) || 0)}
                                                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                                placeholder="Priorite"
                                                            />
                                                            <div className="flex items-center gap-3">
                                                                <label className="flex items-center gap-1 text-sm">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={editForm.data.compound}
                                                                        onChange={(e) => editForm.setData('compound', e.target.checked)}
                                                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600"
                                                                    />
                                                                    Comp.
                                                                </label>
                                                                <label className="flex items-center gap-1 text-sm">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={editForm.data.active}
                                                                        onChange={(e) => editForm.setData('active', e.target.checked)}
                                                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600"
                                                                    />
                                                                    Actif
                                                                </label>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button
                                                                type="submit"
                                                                disabled={editForm.processing}
                                                                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                                                            >
                                                                Enregistrer
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setEditingId(null)}
                                                                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                                            >
                                                                Annuler
                                                            </button>
                                                        </div>
                                                    </form>
                                                </td>
                                            </tr>
                                        ) : (
                                            <tr key={rule.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 font-medium text-gray-900">{rule.name}</td>
                                                <td className="px-4 py-3 text-gray-600">
                                                    {rule.country_code ? (
                                                        <span className="inline-flex rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800">
                                                            {rule.country_code}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400 text-xs">Defaut</span>
                                                    )}
                                                </td>
                                                <td className="hidden px-4 py-3 text-gray-600 md:table-cell">
                                                    {rule.region || '---'}
                                                </td>
                                                <td className="px-4 py-3 font-medium text-gray-900">
                                                    {rule.rate}%
                                                </td>
                                                <td className="hidden px-4 py-3 text-gray-600 md:table-cell">
                                                    {rule.priority}
                                                </td>
                                                <td className="hidden px-4 py-3 lg:table-cell">
                                                    <button
                                                        onClick={() => toggleCompound(rule)}
                                                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium transition-colors ${
                                                            rule.compound
                                                                ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                        }`}
                                                    >
                                                        {rule.compound ? 'Oui' : 'Non'}
                                                    </button>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <button
                                                        onClick={() => toggleActive(rule)}
                                                        className="transition-colors"
                                                    >
                                                        {rule.active ? (
                                                            <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 hover:bg-green-200">
                                                                Actif
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200">
                                                                Inactif
                                                            </span>
                                                        )}
                                                    </button>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => startEdit(rule)}
                                                            className="text-gray-500 hover:text-indigo-600"
                                                            title="Modifier"
                                                        >
                                                            <EditIcon />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(rule)}
                                                            className="text-gray-500 hover:text-red-600"
                                                            title="Supprimer"
                                                        >
                                                            <TrashIcon />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
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
