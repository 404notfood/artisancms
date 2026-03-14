import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import type { TaxonomyData, TaxonomyTermData } from '@/types/cms';

interface TaxonomiesIndexProps {
    taxonomies: TaxonomyData[];
}

export default function TaxonomiesIndex({ taxonomies }: TaxonomiesIndexProps) {
    const [selectedTaxonomyId, setSelectedTaxonomyId] = useState<number | null>(
        taxonomies.length > 0 ? taxonomies[0].id : null
    );
    const [showCreateTaxonomy, setShowCreateTaxonomy] = useState(false);
    const [showCreateTerm, setShowCreateTerm] = useState(false);
    const [editingTermId, setEditingTermId] = useState<number | null>(null);

    const selectedTaxonomy = taxonomies.find((t) => t.id === selectedTaxonomyId) ?? null;
    const terms = selectedTaxonomy?.terms ?? [];

    // Taxonomy creation form
    const taxonomyForm = useForm({
        name: '',
        slug: '',
        type: 'category',
        description: '',
        hierarchical: true,
    });

    // Term creation form
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

    function handleCreateTaxonomy(e: React.FormEvent) {
        e.preventDefault();
        taxonomyForm.post('/admin/taxonomies', {
            onSuccess: () => {
                taxonomyForm.reset();
                setShowCreateTaxonomy(false);
            },
        });
    }

    function handleDeleteTaxonomy(taxonomy: TaxonomyData) {
        if (!confirm(`Supprimer la taxonomie "${taxonomy.name}" et tous ses termes ?`)) return;
        router.delete(`/admin/taxonomies/${taxonomy.id}`, {
            onSuccess: () => {
                if (selectedTaxonomyId === taxonomy.id) {
                    setSelectedTaxonomyId(taxonomies.length > 1 ? taxonomies[0].id : null);
                }
            },
        });
    }

    function handleCreateTerm(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedTaxonomyId) return;
        termForm.post(`/admin/taxonomies/${selectedTaxonomyId}/terms`, {
            onSuccess: () => {
                termForm.reset();
                setShowCreateTerm(false);
            },
        });
    }

    function handleUpdateTerm(term: TaxonomyTermData, updates: Partial<TaxonomyTermData>) {
        if (!selectedTaxonomyId) return;
        const { children, ...payload } = { ...term, ...updates };
        router.put(`/admin/taxonomies/${selectedTaxonomyId}/terms/${term.id}`, payload as unknown as Record<string, string | number | boolean | null>, {
            preserveState: true,
            onSuccess: () => setEditingTermId(null),
        });
    }

    function handleDeleteTerm(term: TaxonomyTermData) {
        if (!confirm(`Supprimer le terme "${term.name}" ?`)) return;
        if (!selectedTaxonomyId) return;
        router.delete(`/admin/taxonomies/${selectedTaxonomyId}/terms/${term.id}`, {
            preserveState: true,
        });
    }

    return (
        <AdminLayout header={<h1 className="text-xl font-semibold text-gray-900">Taxonomies</h1>}>
            <Head title="Taxonomies" />

            <div className="flex flex-col gap-6 lg:flex-row">
                {/* Left: Taxonomy list */}
                <div className="shrink-0 lg:w-72">
                    <div className="rounded-lg border border-gray-200 bg-white">
                        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                            <h2 className="text-sm font-medium text-gray-900">Taxonomies</h2>
                            <button
                                onClick={() => setShowCreateTaxonomy(!showCreateTaxonomy)}
                                className="text-indigo-600 hover:text-indigo-700"
                                title="Nouvelle taxonomie"
                            >
                                <PlusIcon />
                            </button>
                        </div>

                        {/* Create taxonomy form */}
                        {showCreateTaxonomy && (
                            <form onSubmit={handleCreateTaxonomy} className="border-b border-gray-200 p-4 space-y-3">
                                <div>
                                    <input
                                        type="text"
                                        value={taxonomyForm.data.name}
                                        onChange={(e) => {
                                            const name = e.target.value;
                                            taxonomyForm.setData((prev) => ({
                                                ...prev,
                                                name,
                                                slug: prev.slug === '' || prev.slug === generateSlug(prev.name)
                                                    ? generateSlug(name)
                                                    : prev.slug,
                                            }));
                                        }}
                                        className="block w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        placeholder="Nom"
                                        required
                                    />
                                    {taxonomyForm.errors.name && (
                                        <p className="mt-1 text-xs text-red-600">{taxonomyForm.errors.name}</p>
                                    )}
                                </div>
                                <div>
                                    <input
                                        type="text"
                                        value={taxonomyForm.data.slug}
                                        onChange={(e) => taxonomyForm.setData('slug', e.target.value)}
                                        className="block w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        placeholder="Slug"
                                        required
                                    />
                                </div>
                                <div>
                                    <select
                                        value={taxonomyForm.data.type}
                                        onChange={(e) => taxonomyForm.setData('type', e.target.value)}
                                        className="block w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    >
                                        <option value="category">Catégorie</option>
                                        <option value="tag">Tag</option>
                                        <option value="custom">Personnalisé</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        id="hierarchical"
                                        type="checkbox"
                                        checked={taxonomyForm.data.hierarchical}
                                        onChange={(e) => taxonomyForm.setData('hierarchical', e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <label htmlFor="hierarchical" className="text-xs text-gray-700">
                                        Hiérarchique
                                    </label>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="submit"
                                        disabled={taxonomyForm.processing}
                                        className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        Créer
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setShowCreateTaxonomy(false); taxonomyForm.reset(); }}
                                        className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        Annuler
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Taxonomy list */}
                        <div className="divide-y divide-gray-100">
                            {taxonomies.length === 0 ? (
                                <p className="px-4 py-6 text-center text-sm text-gray-500">
                                    Aucune taxonomie.
                                </p>
                            ) : (
                                taxonomies.map((taxonomy) => (
                                    <button
                                        key={taxonomy.id}
                                        onClick={() => setSelectedTaxonomyId(taxonomy.id)}
                                        className={`flex w-full items-center justify-between px-4 py-3 text-left transition-colors ${
                                            selectedTaxonomyId === taxonomy.id
                                                ? 'bg-indigo-50'
                                                : 'hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className="min-w-0">
                                            <p className={`text-sm font-medium ${
                                                selectedTaxonomyId === taxonomy.id ? 'text-indigo-700' : 'text-gray-900'
                                            }`}>
                                                {taxonomy.name}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                <TypeBadge type={taxonomy.type} /> {taxonomy.terms?.length ?? 0} terme(s)
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteTaxonomy(taxonomy);
                                            }}
                                            className="text-gray-400 hover:text-red-600"
                                            title="Supprimer"
                                        >
                                            <TrashIcon />
                                        </button>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Terms for selected taxonomy */}
                <div className="flex-1">
                    {selectedTaxonomy ? (
                        <div className="rounded-lg border border-gray-200 bg-white">
                            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                                <div>
                                    <h2 className="text-sm font-medium text-gray-900">
                                        Termes : {selectedTaxonomy.name}
                                    </h2>
                                    <p className="text-xs text-gray-500">
                                        {selectedTaxonomy.description ?? `Type : ${selectedTaxonomy.type}`}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowCreateTerm(!showCreateTerm)}
                                    className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                                >
                                    <PlusIcon />
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
                                        {selectedTaxonomy.hierarchical && terms.length > 0 && (
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
                                            {selectedTaxonomy.hierarchical && (
                                                <th className="hidden px-4 py-3 font-medium text-gray-700 sm:table-cell">Parent</th>
                                            )}
                                            <th className="px-4 py-3 font-medium text-gray-700">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {terms.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={selectedTaxonomy.hierarchical ? 4 : 3}
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
                                                    {selectedTaxonomy.hierarchical && (
                                                        <td className="hidden px-4 py-3 text-gray-500 sm:table-cell">
                                                            {term.parent_id
                                                                ? terms.find((t) => t.id === term.parent_id)?.name ?? '—'
                                                                : '—'}
                                                        </td>
                                                    )}
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => setEditingTermId(editingTermId === term.id ? null : term.id)}
                                                                className="text-gray-500 hover:text-indigo-600"
                                                                title="Modifier"
                                                            >
                                                                <EditIcon />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteTerm(term)}
                                                                className="text-gray-500 hover:text-red-600"
                                                                title="Supprimer"
                                                            >
                                                                <TrashIcon />
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
                    ) : (
                        <div className="rounded-lg border border-gray-200 bg-white py-12 text-center">
                            <EmptyIcon />
                            <p className="mt-2 text-sm text-gray-500">
                                {taxonomies.length === 0
                                    ? 'Créez votre première taxonomie pour organiser votre contenu.'
                                    : 'Sélectionnez une taxonomie pour gérer ses termes.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}

function TypeBadge({ type }: { type: string }) {
    const labels: Record<string, string> = {
        category: 'Catégorie',
        tag: 'Tag',
        custom: 'Personnalisé',
    };
    return (
        <span className="inline-flex rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600">
            {labels[type] ?? type}
        </span>
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

function EmptyIcon() {
    return (
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
        </svg>
    );
}
