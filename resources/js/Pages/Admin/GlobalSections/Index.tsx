import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import type { GlobalSectionData, PaginatedResponse } from '@/types/cms';

interface GlobalSectionsIndexProps {
    sections: PaginatedResponse<GlobalSectionData>;
    filters: {
        type: string;
        search: string;
    };
}

export default function GlobalSectionsIndex({ sections, filters }: GlobalSectionsIndexProps) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [typeFilter, setTypeFilter] = useState(filters.type ?? '');

    function applyFilters(overrides: { type?: string; search?: string } = {}) {
        router.get('/admin/global-sections', {
            type: overrides.type ?? typeFilter,
            search: overrides.search ?? search,
        }, {
            preserveState: true,
            replace: true,
        });
    }

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        applyFilters();
    }

    function handleTypeChange(value: string) {
        setTypeFilter(value);
        applyFilters({ type: value });
    }

    function handleDelete(section: GlobalSectionData) {
        if (!confirm(`Etes-vous sur de vouloir supprimer la section "${section.name}" ?`)) return;
        router.delete(`/admin/global-sections/${section.id}`);
    }

    function handleActivate(section: GlobalSectionData) {
        router.post(`/admin/global-sections/${section.id}/activate`);
    }

    return (
        <AdminLayout
            header={
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-gray-900">Sections globales</h1>
                    <Link
                        href="/admin/global-sections/create"
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                    >
                        <PlusIcon />
                        Nouvelle section
                    </Link>
                </div>
            }
        >
            <Head title="Sections globales" />

            <div className="space-y-6">
                {/* Filters */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                    <form onSubmit={handleSearch} className="flex-1">
                        <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                            Rechercher
                        </label>
                        <div className="mt-1 flex gap-2">
                            <input
                                id="search"
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Nom ou slug..."
                                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            <button
                                type="submit"
                                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                            >
                                Chercher
                            </button>
                        </div>
                    </form>

                    <div>
                        <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700">
                            Type
                        </label>
                        <select
                            id="type-filter"
                            value={typeFilter}
                            onChange={(e) => handleTypeChange(e.target.value)}
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                            <option value="">Tous</option>
                            <option value="header">En-tetes</option>
                            <option value="footer">Pieds de page</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="rounded-lg border border-gray-200 bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-gray-200 bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 font-medium text-gray-700">Nom</th>
                                    <th className="px-4 py-3 font-medium text-gray-700">Type</th>
                                    <th className="px-4 py-3 font-medium text-gray-700">Statut</th>
                                    <th className="px-4 py-3 font-medium text-gray-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {sections.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                                            Aucune section globale creee.
                                        </td>
                                    </tr>
                                ) : (
                                    sections.data.map((section) => (
                                        <tr key={section.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <Link
                                                    href={`/admin/global-sections/${section.id}/edit`}
                                                    className="font-medium text-gray-900 hover:text-indigo-600"
                                                >
                                                    {section.name}
                                                </Link>
                                                <p className="text-xs text-gray-500">{section.slug}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <TypeBadge type={section.type} />
                                            </td>
                                            <td className="px-4 py-3">
                                                <StatusBadge status={section.status} />
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    {section.status !== 'active' && (
                                                        <button
                                                            onClick={() => handleActivate(section)}
                                                            className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
                                                            title="Activer"
                                                        >
                                                            <CheckIcon />
                                                            Activer
                                                        </button>
                                                    )}
                                                    <Link
                                                        href={`/admin/global-sections/${section.id}/edit`}
                                                        className="text-gray-500 hover:text-indigo-600"
                                                        title="Modifier"
                                                    >
                                                        <EditIcon />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(section)}
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

                    {/* Pagination */}
                    {sections.last_page > 1 && (
                        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
                            <p className="text-sm text-gray-500">
                                {sections.from} - {sections.to} sur {sections.total}
                            </p>
                            <div className="flex gap-1">
                                {Array.from({ length: sections.last_page }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => router.get('/admin/global-sections', {
                                            page,
                                            type: typeFilter,
                                            search,
                                        }, { preserveState: true, replace: true })}
                                        className={`rounded px-3 py-1 text-sm ${
                                            page === sections.current_page
                                                ? 'bg-indigo-600 text-white'
                                                : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}

function TypeBadge({ type }: { type: 'header' | 'footer' }) {
    const config = {
        header: { label: 'En-tete', bg: 'bg-blue-50', text: 'text-blue-700' },
        footer: { label: 'Pied de page', bg: 'bg-purple-50', text: 'text-purple-700' },
    };
    const c = config[type];
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${c.bg} ${c.text}`}>
            {c.label}
        </span>
    );
}

function StatusBadge({ status }: { status: 'active' | 'inactive' }) {
    const config = {
        active: { label: 'Actif', bg: 'bg-emerald-50', text: 'text-emerald-700' },
        inactive: { label: 'Inactif', bg: 'bg-gray-100', text: 'text-gray-600' },
    };
    const c = config[status];
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${c.bg} ${c.text}`}>
            {c.label}
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

function CheckIcon() {
    return (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
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
