import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import type { BlockNode } from '@/types/cms';
import { useState } from 'react';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

interface BlockItemForm {
    type: string;
    props: Record<string, unknown>;
}

interface GlobalSectionFormData {
    name: string;
    slug: string;
    type: 'header' | 'footer';
    content: unknown[];
}

export default function GlobalSectionsCreate() {
    // @ts-expect-error Inertia FormDataType doesn't support nested objects/arrays
    const { data, setData, post, processing, errors } = useForm<GlobalSectionFormData>({
        name: '',
        slug: '',
        type: 'header',
        content: [],
    });

    const [blocks, setBlocks] = useState<BlockItemForm[]>([]);

    function generateSlug(name: string): string {
        return name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }

    function handleNameChange(value: string) {
        setData((prev) => ({
            ...prev,
            name: value,
            slug: prev.slug === '' || prev.slug === generateSlug(prev.name) ? generateSlug(value) : prev.slug,
        }));
    }

    function addBlock() {
        const newBlock: BlockItemForm = {
            type: 'text-block',
            props: { content: '' },
        };
        setBlocks([...blocks, newBlock]);
        updateContentFromBlocks([...blocks, newBlock]);
    }

    function updateBlock(index: number, updates: Partial<BlockItemForm>) {
        const updated = blocks.map((b, i) => (i === index ? { ...b, ...updates } : b));
        setBlocks(updated);
        updateContentFromBlocks(updated);
    }

    function removeBlock(index: number) {
        const updated = blocks.filter((_, i) => i !== index);
        setBlocks(updated);
        updateContentFromBlocks(updated);
    }

    function updateContentFromBlocks(items: BlockItemForm[]) {
        const content: BlockNode[] = items.map((item, idx) => ({
            id: `block-${idx}-${Date.now()}`,
            type: item.type,
            props: item.props,
        }));
        setData('content', content);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/admin/global-sections');
    }

    return (
        <AdminLayout
            header={
                <div className="flex items-center gap-4">
                    <Link href="/admin/global-sections" className="text-gray-500 hover:text-gray-700">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <h1 className="text-xl font-semibold text-gray-900">Nouvelle section globale</h1>
                </div>
            }
        >
            <Head title="Nouvelle section globale" />

            <div className="mx-auto max-w-3xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic info */}
                    <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
                        <h2 className="text-lg font-medium text-gray-900">Informations</h2>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                    Nom
                                </label>
                                <input
                                    id="name"
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => handleNameChange(e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    required
                                />
                                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                            </div>
                            <div>
                                <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
                                    Slug
                                </label>
                                <input
                                    id="slug"
                                    type="text"
                                    value={data.slug}
                                    onChange={(e) => setData('slug', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                                {errors.slug && <p className="mt-1 text-sm text-red-600">{errors.slug}</p>}
                            </div>
                            <div>
                                <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                                    Type
                                </label>
                                <select
                                    id="type"
                                    value={data.type}
                                    onChange={(e) => setData('type', e.target.value as 'header' | 'footer')}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                >
                                    <option value="header">En-tete</option>
                                    <option value="footer">Pied de page</option>
                                </select>
                                {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Content blocks */}
                    <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-medium text-gray-900">Contenu (blocs)</h2>
                            <button
                                type="button"
                                onClick={addBlock}
                                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                            >
                                <Plus className="h-4 w-4" />
                                Ajouter un bloc
                            </button>
                        </div>

                        {blocks.length === 0 ? (
                            <p className="py-8 text-center text-sm text-gray-500">
                                Aucun bloc. Cliquez sur "Ajouter un bloc" pour commencer.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {blocks.map((block, index) => (
                                    <div
                                        key={index}
                                        className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-700">
                                                Bloc {index + 1}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => removeBlock(index)}
                                                className="text-gray-400 hover:text-red-600"
                                                title="Supprimer"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Type</label>
                                                <select
                                                    value={block.type}
                                                    onChange={(e) => updateBlock(index, { type: e.target.value })}
                                                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                >
                                                    <option value="text-block">Texte</option>
                                                    <option value="hero-section">Hero</option>
                                                    <option value="navigation">Navigation</option>
                                                    <option value="logo">Logo</option>
                                                    <option value="social-links">Liens sociaux</option>
                                                    <option value="html-block">HTML personnalise</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Contenu
                                                </label>
                                                <input
                                                    type="text"
                                                    value={(block.props.content as string) ?? ''}
                                                    onChange={(e) =>
                                                        updateBlock(index, {
                                                            props: { ...block.props, content: e.target.value },
                                                        })
                                                    }
                                                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                    placeholder="Contenu du bloc..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3">
                        <Link
                            href="/admin/global-sections"
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Annuler
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                        >
                            {processing ? 'Creation...' : 'Creer la section'}
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}

// Icons imported from lucide-react.
