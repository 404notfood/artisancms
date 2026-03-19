import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import type { ContentTypeData, ContentEntryData, PaginatedResponse } from '@/types/cms';
import { formatDate } from '@/lib/format';
import StatusBadge from '@/Components/admin/status-badge';
import { ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react';

interface ContentEntriesIndexProps {
    contentType: ContentTypeData;
    entries: PaginatedResponse<ContentEntryData>;
    filters: {
        status?: string;
        search?: string;
    };
}

const statusTabs = [
    { label: 'Tout', value: '' },
    { label: 'Publies', value: 'published' },
    { label: 'Brouillons', value: 'draft' },
    { label: 'Planifies', value: 'scheduled' },
    { label: 'Corbeille', value: 'trash' },
];

export default function ContentEntriesIndex({ contentType, entries, filters }: ContentEntriesIndexProps) {
    const [search, setSearch] = useState(filters.search ?? '');

    const baseUrl = `/admin/content/${contentType.id}/entries`;

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        router.get(baseUrl, { search, status: filters.status }, { preserveState: true });
    }

    function handleTabChange(status: string) {
        router.get(baseUrl, { status, search: filters.search }, { preserveState: true });
    }

    function handleDelete(entry: ContentEntryData) {
        if (!confirm(`Supprimer l'entree "${entry.title}" ?`)) return;
        router.delete(`${baseUrl}/${entry.id}`);
    }

    return (
        <AdminLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/admin/content-types"
                            className="text-gray-400 hover:text-gray-600"
                            title="Retour aux types de contenu"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-semibold text-gray-900">
                                {contentType.icon && <span className="mr-2">{contentType.icon}</span>}
                                {contentType.name}
                            </h1>
                            <p className="text-sm text-gray-500">{contentType.description}</p>
                        </div>
                    </div>
                    <Link
                        href={`${baseUrl}/create`}
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        Ajouter {contentType.name}
                    </Link>
                </div>
            }
        >
            <Head title={contentType.name} />

            <div className="rounded-lg border border-gray-200 bg-white">
                {/* Tabs + Search */}
                <div className="flex flex-col gap-4 border-b border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex gap-1">
                        {statusTabs.map((tab) => (
                            <button
                                key={tab.value}
                                onClick={() => handleTabChange(tab.value)}
                                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                                    (filters.status ?? '') === tab.value
                                        ? 'bg-indigo-100 text-indigo-700'
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSearch} className="flex gap-2">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Rechercher..."
                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <button
                            type="submit"
                            className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                        >
                            Rechercher
                        </button>
                    </form>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-gray-200 bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 font-medium text-gray-700">Titre</th>
                                <th className="px-4 py-3 font-medium text-gray-700">Statut</th>
                                <th className="hidden px-4 py-3 font-medium text-gray-700 md:table-cell">Auteur</th>
                                <th className="hidden px-4 py-3 font-medium text-gray-700 sm:table-cell">Date</th>
                                <th className="px-4 py-3 font-medium text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {entries.data.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                        Aucune entree trouvee.
                                    </td>
                                </tr>
                            ) : (
                                entries.data.map((entry) => (
                                    <tr key={entry.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <Link
                                                href={`${baseUrl}/${entry.id}/edit`}
                                                className="font-medium text-gray-900 hover:text-indigo-600"
                                            >
                                                {entry.title}
                                            </Link>
                                            <p className="text-xs text-gray-500">/{entry.slug}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadge status={entry.status} />
                                        </td>
                                        <td className="hidden px-4 py-3 text-gray-600 md:table-cell">
                                            {entry.author?.name ?? '—'}
                                        </td>
                                        <td className="hidden px-4 py-3 text-gray-500 sm:table-cell">
                                            {formatDate(entry.updated_at)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    href={`${baseUrl}/${entry.id}/edit`}
                                                    className="text-gray-500 hover:text-indigo-600"
                                                    title="Modifier"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(entry)}
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

                {/* Pagination */}
                {entries.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
                        <p className="text-sm text-gray-600">
                            {entries.from}–{entries.to} sur {entries.total}
                        </p>
                        <div className="flex gap-1">
                            {Array.from({ length: entries.last_page }, (_, i) => i + 1).map((p) => (
                                <Link
                                    key={p}
                                    href={`${baseUrl}?page=${p}&status=${filters.status ?? ''}&search=${filters.search ?? ''}`}
                                    className={`rounded px-3 py-1 text-sm ${
                                        p === entries.current_page
                                            ? 'bg-indigo-600 text-white'
                                            : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    {p}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}

// StatusBadge, formatDate, and icons imported from shared modules.
