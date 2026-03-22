import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { SharedProps } from '@/types/cms';
import TaxCreateForm from './components/TaxCreateForm';
import TaxRuleRow, { type TaxRuleData } from './components/TaxRuleRow';

interface TaxIndexProps {
    rules: TaxRuleData[];
}

export default function TaxIndex({ rules }: TaxIndexProps) {
    const { cms } = usePage<SharedProps>().props;
    const prefix = cms?.adminPrefix ?? 'admin';
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

        router.post(`/${prefix}/shop/tax`, payload, {
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
                        <Plus className="h-4 w-4" />
                        Nouvelle regle
                    </button>
                </div>
            }
        >
            <Head title="Taxes" />

            <div className="mx-auto max-w-5xl space-y-4">
                {showCreateForm && (
                    <TaxCreateForm
                        form={createForm}
                        onSubmit={handleCreate}
                        onCancel={() => setShowCreateForm(false)}
                    />
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
                                        <TaxRuleRow
                                            key={rule.id}
                                            rule={rule}
                                            isEditing={editingId === rule.id}
                                            editForm={editForm}
                                            onEdit={() => startEdit(rule)}
                                            onUpdate={handleUpdate}
                                            onCancelEdit={() => setEditingId(null)}
                                            onDelete={() => handleDelete(rule)}
                                            onToggleActive={() => toggleActive(rule)}
                                            onToggleCompound={() => toggleCompound(rule)}
                                        />
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
