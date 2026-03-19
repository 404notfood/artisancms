import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import type { CommentData, PaginatedResponse } from '@/types/cms';
import { formatDate } from '@/lib/format';
import StatusBadge from '@/Components/admin/status-badge';
import { MessageSquare } from 'lucide-react';

interface Props {
    comments: PaginatedResponse<CommentData>;
    filters: {
        status?: string;
        search?: string;
        post_id?: string;
    };
    counts: {
        all: number;
        pending: number;
        approved: number;
        spam: number;
    };
}

const statusTabs = [
    { label: 'Tout', value: '', countKey: 'all' as const },
    { label: 'En attente', value: 'pending', countKey: 'pending' as const },
    { label: 'Approuvés', value: 'approved', countKey: 'approved' as const },
    { label: 'Spam', value: 'spam', countKey: 'spam' as const },
];

export default function CommentsIndex({ comments, filters, counts }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        router.get('/admin/comments', { search, status: filters.status }, { preserveState: true });
    }

    function handleTabChange(status: string) {
        router.get('/admin/comments', { status, search: filters.search }, { preserveState: true });
    }

    function handleApprove(id: number) {
        router.post(`/admin/comments/${id}/approve`, {}, { preserveScroll: true });
    }

    function handleReject(id: number) {
        router.post(`/admin/comments/${id}/reject`, {}, { preserveScroll: true });
    }

    function handleSpam(id: number) {
        router.post(`/admin/comments/${id}/spam`, {}, { preserveScroll: true });
    }

    function handleDelete(id: number) {
        if (!confirm('Supprimer ce commentaire definitivement ?')) return;
        router.delete(`/admin/comments/${id}`, { preserveScroll: true });
    }

    return (
        <AdminLayout
            header={
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Commentaires
                    </h1>
                </div>
            }
        >
            <Head title="Commentaires" />

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
                                <span className="ml-1 text-xs text-gray-400">
                                    ({counts[tab.countKey]})
                                </span>
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
                                <th className="px-4 py-3 font-medium text-gray-700">Auteur</th>
                                <th className="px-4 py-3 font-medium text-gray-700">Commentaire</th>
                                <th className="hidden px-4 py-3 font-medium text-gray-700 md:table-cell">Article</th>
                                <th className="px-4 py-3 font-medium text-gray-700">Statut</th>
                                <th className="hidden px-4 py-3 font-medium text-gray-700 sm:table-cell">Date</th>
                                <th className="px-4 py-3 font-medium text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {comments.data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                                        Aucun commentaire trouve.
                                    </td>
                                </tr>
                            ) : (
                                comments.data.map((comment) => (
                                    <tr key={comment.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-gray-900">
                                                {comment.author_name}
                                            </div>
                                            <p className="text-xs text-gray-500">{comment.author_email}</p>
                                            {comment.parent_id && (
                                                <span className="text-xs text-indigo-500">Reponse</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 max-w-xs">
                                            <p className="text-gray-700 truncate">{comment.content}</p>
                                        </td>
                                        <td className="hidden px-4 py-3 text-gray-600 md:table-cell">
                                            {comment.post?.title ?? '--'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadge status={comment.status} />
                                        </td>
                                        <td className="hidden px-4 py-3 text-gray-500 sm:table-cell">
                                            {formatDate(comment.created_at)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1 flex-wrap">
                                                {comment.status !== 'approved' && (
                                                    <button
                                                        onClick={() => handleApprove(comment.id)}
                                                        className="rounded px-2 py-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
                                                        title="Approuver"
                                                    >
                                                        Approuver
                                                    </button>
                                                )}
                                                {comment.status !== 'trash' && comment.status !== 'spam' && (
                                                    <button
                                                        onClick={() => handleReject(comment.id)}
                                                        className="rounded px-2 py-1 text-xs font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 transition-colors"
                                                        title="Rejeter"
                                                    >
                                                        Rejeter
                                                    </button>
                                                )}
                                                {comment.status !== 'spam' && (
                                                    <button
                                                        onClick={() => handleSpam(comment.id)}
                                                        className="rounded px-2 py-1 text-xs font-medium text-yellow-700 bg-yellow-50 hover:bg-yellow-100 transition-colors"
                                                        title="Spam"
                                                    >
                                                        Spam
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(comment.id)}
                                                    className="rounded px-2 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                                                    title="Supprimer"
                                                >
                                                    Supprimer
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
                {comments.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
                        <p className="text-sm text-gray-600">
                            {comments.from}--{comments.to} sur {comments.total}
                        </p>
                        <div className="flex gap-1">
                            {Array.from({ length: comments.last_page }, (_, i) => i + 1).map((p) => (
                                <a
                                    key={p}
                                    href={`/admin/comments?page=${p}&status=${filters.status ?? ''}&search=${filters.search ?? ''}`}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        router.get('/admin/comments', {
                                            page: p,
                                            status: filters.status ?? '',
                                            search: filters.search ?? '',
                                        }, { preserveState: true });
                                    }}
                                    className={`rounded px-3 py-1 text-sm ${
                                        p === comments.current_page
                                            ? 'bg-indigo-600 text-white'
                                            : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    {p}
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}

// StatusBadge, formatDate, and icons imported from shared modules.
