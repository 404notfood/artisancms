import React, { useState } from 'react';
import type { TaxonomyData, SharedProps } from '@/types/cms';
import { useForm, usePage } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';

function TypeBadge({ type }: { type: string }) {
    const labels: Record<string, string> = {
        category: 'Categorie',
        tag: 'Tag',
        custom: 'Personnalise',
    };
    return (
        <span className="inline-flex rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600">
            {labels[type] ?? type}
        </span>
    );
}

interface TaxonomyListPanelProps {
    taxonomies: TaxonomyData[];
    selectedTaxonomyId: number | null;
    onSelectTaxonomy: (id: number) => void;
    onDeleteTaxonomy: (taxonomy: TaxonomyData) => void;
}

export default function TaxonomyListPanel({
    taxonomies,
    selectedTaxonomyId,
    onSelectTaxonomy,
    onDeleteTaxonomy,
}: TaxonomyListPanelProps) {
    const { cms } = usePage<SharedProps>().props;
    const prefix = cms?.adminPrefix ?? 'admin';
    const [showCreateTaxonomy, setShowCreateTaxonomy] = useState(false);

    const taxonomyForm = useForm({
        name: '',
        slug: '',
        type: 'category',
        description: '',
        hierarchical: true,
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
        taxonomyForm.post(`/${prefix}/taxonomies`, {
            onSuccess: () => {
                taxonomyForm.reset();
                setShowCreateTaxonomy(false);
            },
        });
    }

    return (
        <div className="shrink-0 lg:w-72">
            <div className="rounded-lg border border-gray-200 bg-white">
                <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                    <h2 className="text-sm font-medium text-gray-900">Taxonomies</h2>
                    <button
                        onClick={() => setShowCreateTaxonomy(!showCreateTaxonomy)}
                        className="text-indigo-600 hover:text-indigo-700"
                        title="Nouvelle taxonomie"
                    >
                        <Plus className="h-4 w-4" />
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
                                <option value="category">Categorie</option>
                                <option value="tag">Tag</option>
                                <option value="custom">Personnalise</option>
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
                                Hierarchique
                            </label>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                disabled={taxonomyForm.processing}
                                className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                            >
                                Creer
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
                                onClick={() => onSelectTaxonomy(taxonomy.id)}
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
                                        onDeleteTaxonomy(taxonomy);
                                    }}
                                    className="text-gray-400 hover:text-red-600"
                                    title="Supprimer"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
