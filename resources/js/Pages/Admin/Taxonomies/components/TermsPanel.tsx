import { useState } from 'react';
import type { TaxonomyData, TaxonomyTermData } from '@/types/cms';
import { useForm, router } from '@inertiajs/react';
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface TermsPanelProps {
    taxonomy: TaxonomyData;
}

export default function TermsPanel({ taxonomy }: TermsPanelProps) {
    const [showCreateTerm, setShowCreateTerm] = useState(false);
    const [editingTermId, setEditingTermId] = useState<number | null>(null);
    const terms = taxonomy.terms ?? [];

    const termForm = useForm({
        name: '',
        slug: '',
        description: '',
        parent_id: '' as string | number,
    });

    function generateSlug(name: string): string {
        return name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }

    function handleCreateTerm(e: React.FormEvent) {
        e.preventDefault();
        termForm.post(`/admin/taxonomies/${taxonomy.id}/terms`, {
            onSuccess: () => {
                termForm.reset();
                setShowCreateTerm(false);
            },
        });
    }

    function handleUpdateTerm(term: TaxonomyTermData, updates: Partial<TaxonomyTermData>) {
        const { children, ...payload } = { ...term, ...updates };
        router.put(`/admin/taxonomies/${taxonomy.id}/terms/${term.id}`, payload as unknown as Record<string, string | number | boolean | null>, {
            preserveState: true,
            onSuccess: () => setEditingTermId(null),
        });
    }

    function handleDeleteTerm(term: TaxonomyTermData) {
        if (!confirm(`Supprimer le terme "${term.name}" ?`)) return;
        router.delete(`/admin/taxonomies/${taxonomy.id}/terms/${term.id}`, {
            preserveState: true,
        });
    }

    return (
        <div className="rounded-lg border border-gray-200 bg-white">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                <div>
                    <h2 className="text-sm font-medium text-gray-900">
                        Termes : {taxonomy.name}
                    </h2>
                    <p className="text-xs text-gray-500">
                        {taxonomy.description ?? `Type : ${taxonomy.type}`}
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateTerm(!showCreateTerm)}
                    className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Ajouter un terme
                </button>
            </div>

            {/* Create term form */}
            {showCreateTerm && (
                <form onSubmit={handleCreateTerm} className="border-b border-gray-200 bg-gray-50 p-4 space-y-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nom</label>
                            <input
                                type="text"
                                value={termForm.data.name}
                                onChange={(e) => {
                                    const name = e.target.value;
                                    termForm.setData((prev) => ({
                                        ...prev,
                                        name,
                                        slug: prev.slug === '' || prev.slug === generateSlug(prev.name)
                                            ? generateSlug(name)
                                            : prev.slug,
                                    }));
                                }}
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                required
                            />
                            {termForm.errors.name && (
                                <p className="mt-1 text-xs text-red-600">{termForm.errors.name}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Slug</label>
                            <input
                                type="text"
                                value={termForm.data.slug}
                                onChange={(e) => termForm.setData('slug', e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                required
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Description</label>
                            <input
                                type="text"
                                value={termForm.data.description}
                                onChange={(e) => termForm.setData('description', e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder="Optionnel"
                            />
                        </div>
                        {taxonomy.hierarchical && terms.length > 0 && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Parent</label>
                                <select
                                    value={termForm.data.parent_id}
                                    onChange={(e) => termForm.setData('parent_id', e.target.value ? Number(e.target.value) : '')}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                >
                                    <option value="">Aucun (racine)</option>
                                    {terms.map((term) => (
                                        <option key={term.id} value={term.id}>{term.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="submit"
                            disabled={termForm.processing}
                            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                            Ajouter
                        </button>
                        <button
                            type="button"
                            onClick={() => { setShowCreateTerm(false); termForm.reset(); }}
                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Annuler
                        </button>
                    </div>
                </form>
            )}

            {/* Terms list */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="border-b border-gray-200 bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 font-medium text-gray-700">Nom</th>
                            <th className="px-4 py-3 font-medium text-gray-700">Slug</th>
                            {taxonomy.hierarchical && (
                                <th className="hidden px-4 py-3 font-medium text-gray-700 sm:table-cell">Parent</th>
                            )}
                            <th className="px-4 py-3 font-medium text-gray-700">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {terms.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={taxonomy.hierarchical ? 4 : 3}
                                    className="px-4 py-8 text-center text-gray-500"
                                >
                                    Aucun terme. Cliquez sur "Ajouter un terme" pour commencer.
                                </td>
                            </tr>
                        ) : (
                            terms.map((term) => (
                                <tr key={term.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        {editingTermId === term.id ? (
                                            <input
                                                type="text"
                                                defaultValue={term.name}
                                                onBlur={(e) => handleUpdateTerm(term, { name: e.target.value })}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        handleUpdateTerm(term, { name: (e.target as HTMLInputElement).value });
                                                    }
                                                }}
                                                className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
                                                autoFocus
                                            />
                                        ) : (
                                            <span className="font-medium text-gray-900">{term.name}</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-gray-500">{term.slug}</td>
                                    {taxonomy.hierarchical && (
                                        <td className="hidden px-4 py-3 text-gray-500 sm:table-cell">
                                            {term.parent_id
                                                ? terms.find((t) => t.id === term.parent_id)?.name ?? '---'
                                                : '---'}
                                        </td>
                                    )}
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setEditingTermId(editingTermId === term.id ? null : term.id)}
                                                className="text-gray-500 hover:text-indigo-600"
                                                title="Modifier"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteTerm(term)}
                                                className="text-gray-500 hover:text-red-600"
                                                title="Supprimer"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
