import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import type { GlobalSectionData, BlockNode } from '@/types/cms';
import { useState } from 'react';
import StatusBadge from '@/Components/admin/status-badge';
import { ArrowLeft, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';

interface GlobalSectionsEditProps {
    section: GlobalSectionData;
}

interface BlockItemForm {
    id: string;
    type: string;
    props: Record<string, unknown>;
}

interface GlobalSectionFormData {
    name: string;
    slug: string;
    type: 'header' | 'footer';
    content: unknown[];
}

export default function GlobalSectionsEdit({ section }: GlobalSectionsEditProps) {
    // @ts-expect-error Inertia FormDataType doesn't support nested objects/arrays
    const { data, setData, put, processing, errors } = useForm<GlobalSectionFormData>({
        name: section.name,
        slug: section.slug,
        type: section.type,
        content: (section.content ?? []) as unknown[],
    });

    const initialBlocks: BlockItemForm[] = (section.content ?? []).map((block, idx) => ({
        id: block.id || `block-${idx}`,
        type: block.type,
        props: block.props,
    }));

    const [blocks, setBlocks] = useState<BlockItemForm[]>(initialBlocks);

    function addBlock() {
        const newBlock: BlockItemForm = {
            id: `block-${Date.now()}`,
            type: 'text-block',
            props: { content: '' },
        };
        const updated = [...blocks, newBlock];
        setBlocks(updated);
        updateContentFromBlocks(updated);
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

    function moveBlock(index: number, direction: 'up' | 'down') {
        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        if (swapIndex < 0 || swapIndex >= blocks.length) return;
        const updated = [...blocks];
        [updated[index], updated[swapIndex]] = [updated[swapIndex], updated[index]];
        setBlocks(updated);
        updateContentFromBlocks(updated);
    }

    function updateContentFromBlocks(items: BlockItemForm[]) {
        const content: BlockNode[] = items.map((item) => ({
            id: item.id,
            type: item.type,
            props: item.props,
        }));
        setData('content', content);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        put(`/admin/global-sections/${section.id}`);
    }

    return (
        <AdminLayout
            header={
                <div className="flex items-center gap-4">
                    <Link href="/admin/global-sections" className="text-gray-500 hover:text-gray-700">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <h1 className="text-xl font-semibold text-gray-900">
                        Modifier la section : {section.name}
                    </h1>
                    <StatusBadge status={section.status} />
                </div>
            }
        >
            <Head title={`Section : ${section.name}`} />

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
                                    onChange={(e) => setData('name', e.target.value)}
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
                                        key={block.id}
                                        className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="flex flex-col gap-0.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => moveBlock(index, 'up')}
                                                        disabled={index === 0}
                                                        className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                                    >
                                                        <ChevronUp className="h-3 w-3" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => moveBlock(index, 'down')}
                                                        disabled={index === blocks.length - 1}
                                                        className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                                    >
                                                        <ChevronDown className="h-3 w-3" />
                                                    </button>
                                                </div>
                                                <span className="text-sm font-medium text-gray-700">
                                                    Bloc {index + 1}
                                                </span>
                                            </div>
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
                            {processing ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}

// StatusBadge and icons imported from shared modules.
