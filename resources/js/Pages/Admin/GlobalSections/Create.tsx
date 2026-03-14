import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import type { BlockNode } from '@/types/cms';
import { useState } from 'react';

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
                        <BackIcon />
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
                                <PlusIcon />
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
                                                <TrashIcon />
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

function BackIcon() {
    return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
    );
}

function PlusIcon() {
    return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
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
