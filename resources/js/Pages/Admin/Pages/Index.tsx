import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import type { PageData, PaginatedResponse, FlashMessages } from '@/types/cms';
import { formatDate } from '@/lib/format';
import StatusBadge from '@/Components/admin/status-badge';
import { Plus, Pencil, Copy, Trash2 } from 'lucide-react';

interface PagesIndexProps {
    pages: PaginatedResponse<PageData>;
    filters: {
        status?: string;
        search?: string;
    };
}

const statusTabs = [
    { label: 'Tout', value: '' },
    { label: 'Publiées', value: 'published' },
    { label: 'Brouillons', value: 'draft' },
    { label: 'En revue', value: 'pending_review' },
    { label: 'Approuvées', value: 'approved' },
    { label: 'Corbeille', value: 'trash' },
];

const bulkActions = [
    { label: 'Publier', value: 'publish' },
    { label: 'Mettre en brouillon', value: 'draft' },
    { label: 'Supprimer', value: 'delete' },
    { label: 'Restaurer', value: 'restore' },
];

export default function PagesIndex({ pages, filters }: PagesIndexProps) {
    const { cms } = usePage<SharedProps>().props;
    const prefix = cms?.adminPrefix ?? 'admin';
    const { flash } = usePage().props as unknown as { flash: FlashMessages };
    const [search, setSearch] = useState(filters.search ?? '');
    const [selected, setSelected] = useState<number[]>([]);
    const [bulkAction, setBulkAction] = useState('');
    const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

    const allIds = pages.data.map((p) => p.id);
    const allChecked = allIds.length > 0 && allIds.every((id) => selected.includes(id));
    const someChecked = selected.length > 0;
    const isTrash = (filters.status ?? '') === 'trash';

    function toggleAll() {
        setSelected(allChecked ? [] : allIds);
    }

    function toggleOne(id: number) {
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );
    }

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        setSelected([]);
        router.get(`/${prefix}/pages`, { search, status: filters.status }, { preserveState: true });
    }

    function handleTabChange(status: string) {
        setSelected([]);
        router.get(`/${prefix}/pages`, { status, search: filters.search }, { preserveState: true });
    }

    function handleDelete(page: PageData) {
        if (!confirm(`Supprimer la page "${page.title}" ?`)) return;
        router.delete(`/admin/pages/${page.id}`);
    }

    function handleRestore(page: PageData) {
        router.post(`/admin/pages/${page.id}/restore`);
    }

    function handleForceDelete(page: PageData) {
        if (!confirm(`Supprimer définitivement "${page.title}" ? Irréversible.`)) return;
        router.delete(`/admin/pages/${page.id}/force-delete`);
    }

    function handleEmptyTrash() {
        if (!confirm('Vider la corbeille ? Toutes les pages seront supprimées définitivement.')) return;
        router.post(`/${prefix}/pages/empty-trash`);
    }

    function handleDuplicate(page: PageData) {
        router.post(`/admin/pages/${page.id}/duplicate`);
    }

    function handleBulkSubmit() {
        if (!bulkAction || selected.length === 0) return;
        if (bulkAction === 'delete') {
            setConfirmBulkDelete(true);
            return;
        }
        executeBulk(bulkAction);
    }

    function executeBulk(action: string) {
        router.post(`/${prefix}/pages/bulk`, { ids: selected, action }, {
            onSuccess: () => { setSelected([]); setBulkAction(''); setConfirmBulkDelete(false); },
        });
    }

    return (
        <AdminLayout
            header={
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-gray-900">Pages</h1>
                    <Link
                        href={`/${prefix}/pages/create`}
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        Nouvelle page
                    </Link>
                </div>
            }
        >
            <Head title="Pages" />

            {flash?.success && (
                <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    {flash.success}
                </div>
            )}
            {flash?.error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {flash.error}
                </div>
            )}

            <div className="rounded-lg border border-gray-200 bg-white">
                {/* Tabs + Search bar */}
                <div className="flex flex-col gap-3 border-b border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap gap-1">
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

                    <div className="flex items-center gap-2">
                        {isTrash && pages.data.length > 0 && (
                            <button
                                onClick={handleEmptyTrash}
                                className="rounded-lg bg-red-100 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-200 transition-colors"
                            >
                                Vider la corbeille
                            </button>
                        )}
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
                </div>

                {/* Bulk action bar — visible only when items are selected */}
                {someChecked && (
                    <div className="flex items-center gap-3 border-b border-indigo-100 bg-indigo-50 px-4 py-2.5">
                        <span className="text-sm font-medium text-indigo-700">
                            {selected.length} sélectionné{selected.length > 1 ? 's' : ''}
                        </span>
                        <div className="flex items-center gap-2 ml-auto">
                            <select
                                value={bulkAction}
                                onChange={(e) => setBulkAction(e.target.value)}
                                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                            >
                                <option value="">Action groupée…</option>
                                {bulkActions.map((a) => (
                                    <option key={a.value} value={a.value}>{a.label}</option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={handleBulkSubmit}
                                disabled={!bulkAction}
                                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                Appliquer
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelected([])}
                                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                                Désélectionner
                            </button>
                        </div>
                    </div>
                )}

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-gray-200 bg-gray-50">
                            <tr>
                                <th className="w-10 px-4 py-3">
                                    <input
                                        type="checkbox"
                                        checked={allChecked}
                                        ref={(el) => {
                                            if (el) el.indeterminate = someChecked && !allChecked;
                                        }}
                                        onChange={toggleAll}
                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                    />
                                </th>
                                <th className="px-4 py-3 font-medium text-gray-700">Titre</th>
                                <th className="px-4 py-3 font-medium text-gray-700">Statut</th>
                                <th className="hidden px-4 py-3 font-medium text-gray-700 md:table-cell">Auteur</th>
                                <th className="hidden px-4 py-3 font-medium text-gray-700 sm:table-cell">Modifié le</th>
                                <th className="px-4 py-3 font-medium text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {pages.data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                                        Aucune page trouvée.
                                    </td>
                                </tr>
                            ) : (
                                pages.data.map((page) => (
                                    <tr
                                        key={page.id}
                                        className={`transition-colors ${
                                            selected.includes(page.id)
                                                ? 'bg-indigo-50 hover:bg-indigo-50'
                                                : 'hover:bg-gray-50'
                                        }`}
                                    >
                                        <td className="px-4 py-3">
                                            <input
                                                type="checkbox"
                                                checked={selected.includes(page.id)}
                                                onChange={() => toggleOne(page.id)}
                                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <Link
                                                href={`/admin/pages/${page.id}/edit`}
                                                className="font-medium text-gray-900 hover:text-indigo-600"
                                            >
                                                {page.title}
                                            </Link>
                                            <p className="text-xs text-gray-500">/{page.slug}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadge status={page.status} />
                                        </td>
                                        <td className="hidden px-4 py-3 text-gray-600 md:table-cell">
                                            {page.author?.name ?? '—'}
                                        </td>
                                        <td className="hidden px-4 py-3 text-gray-500 sm:table-cell">
                                            {formatDate(page.updated_at)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                {isTrash ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleRestore(page)}
                                                            className="rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-200 transition-colors"
                                                        >
                                                            Restaurer
                                                        </button>
                                                        <button
                                                            onClick={() => handleForceDelete(page)}
                                                            className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-200 transition-colors"
                                                        >
                                                            Supprimer définitivement
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Link
                                                            href={`/admin/pages/${page.id}/edit`}
                                                            className="text-gray-500 hover:text-indigo-600"
                                                            title="Modifier"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDuplicate(page)}
                                                            className="text-gray-500 hover:text-indigo-600"
                                                            title="Dupliquer"
                                                        >
                                                            <Copy className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(page)}
                                                            className="text-gray-500 hover:text-red-600"
                                                            title="Supprimer"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pages.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
                        <p className="text-sm text-gray-600">
                            {pages.from}–{pages.to} sur {pages.total}
                        </p>
                        <div className="flex gap-1">
                            {Array.from({ length: pages.last_page }, (_, i) => i + 1).map((p) => (
                                <Link
                                    key={p}
                                    href={`/admin/pages?page=${p}&status=${filters.status ?? ''}&search=${filters.search ?? ''}`}
                                    className={`rounded px-3 py-1 text-sm ${
                                        p === pages.current_page
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

            {/* Bulk delete confirmation modal */}
            {confirmBulkDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-sm rounded-xl bg-white shadow-xl">
                        <div className="p-6">
                            <div className="flex items-start gap-4">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                                    <Trash2 className="h-5 w-5 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900">
                                        Supprimer {selected.length} page{selected.length > 1 ? 's' : ''} ?
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Les pages seront déplacées dans la corbeille.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
                            <button
                                type="button"
                                onClick={() => setConfirmBulkDelete(false)}
                                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Annuler
                            </button>
                            <button
                                type="button"
                                onClick={() => executeBulk('delete')}
                                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                            >
                                Supprimer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}

