import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import type { ContentTypeData } from '@/types/cms';
import { Plus, Package } from 'lucide-react';

interface ContentTypesIndexProps {
    contentTypes: ContentTypeData[];
}

export default function ContentTypesIndex({ contentTypes }: ContentTypesIndexProps) {
    function handleDelete(ct: ContentTypeData) {
        if (!confirm(`Supprimer le type "${ct.name}" ? Cette action est irreversible.`)) return;
        router.delete(`/admin/content-types/${ct.id}`);
    }

    return (
        <AdminLayout
            header={
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-gray-900">Types de contenu</h1>
                    <Link
                        href="/admin/content-types/create"
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        Nouveau type de contenu
                    </Link>
                </div>
            }
        >
            <Head title="Types de contenu" />

            {contentTypes.length === 0 ? (
                <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
                    <Package className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">Aucun type de contenu</h3>
                    <p className="mt-2 text-sm text-gray-500">
                        Creez votre premier type de contenu personnalise (Portfolio, Temoignages, Equipe, etc.)
                    </p>
                    <Link
                        href="/admin/content-types/create"
                        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        Creer un type de contenu
                    </Link>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {contentTypes.map((ct) => (
                        <div
                            key={ct.id}
                            className="rounded-lg border border-gray-200 bg-white p-5 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{ct.icon || '📄'}</span>
                                    <div>
                                        <Link
                                            href={`/admin/content/${ct.id}/entries`}
                                            className="text-base font-semibold text-gray-900 hover:text-indigo-600"
                                        >
                                            {ct.name}
                                        </Link>
                                        <p className="text-xs text-gray-500">/{ct.slug}</p>
                                    </div>
                                </div>
                                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                                    {ct.entries_count ?? 0} entree{(ct.entries_count ?? 0) !== 1 ? 's' : ''}
                                </span>
                            </div>

                            {ct.description && (
                                <p className="mt-3 text-sm text-gray-600 line-clamp-2">{ct.description}</p>
                            )}

                            <div className="mt-4 flex flex-wrap gap-1">
                                {(ct.supports ?? []).slice(0, 4).map((s) => (
                                    <span
                                        key={s}
                                        className="inline-flex rounded bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700"
                                    >
                                        {supportLabels[s] ?? s}
                                    </span>
                                ))}
                                {(ct.supports ?? []).length > 4 && (
                                    <span className="inline-flex rounded bg-gray-50 px-2 py-0.5 text-xs text-gray-500">
                                        +{(ct.supports ?? []).length - 4}
                                    </span>
                                )}
                            </div>

                            <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-3">
                                <Link
                                    href={`/admin/content/${ct.id}/entries`}
                                    className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                                >
                                    Voir les entrees
                                </Link>
                                <span className="text-gray-300">|</span>
                                <Link
                                    href={`/admin/content-types/${ct.id}/edit`}
                                    className="text-sm font-medium text-gray-600 hover:text-gray-800"
                                >
                                    Modifier
                                </Link>
                                <span className="text-gray-300">|</span>
                                <button
                                    onClick={() => handleDelete(ct)}
                                    className="text-sm font-medium text-red-500 hover:text-red-700"
                                >
                                    Supprimer
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </AdminLayout>
    );
}

const supportLabels: Record<string, string> = {
    title: 'Titre',
    slug: 'Slug',
    featured_image: 'Image',
    excerpt: 'Extrait',
    content: 'Contenu',
    taxonomies: 'Taxonomies',
    revisions: 'Revisions',
    comments: 'Commentaires',
};

// Icons imported from lucide-react.
