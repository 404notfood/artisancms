import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import type { PostData, PaginatedResponse } from '@/types/cms';
import { formatDate } from '@/lib/format';
import StatusBadge from '@/Components/admin/status-badge';
import { Plus, Pencil, Copy, Trash2 } from 'lucide-react';

interface PostsIndexProps {
    posts: PaginatedResponse<PostData>;
    filters: {
        status?: string;
        search?: string;
    };
}

const statusTabs = [
    { label: 'Tout', value: '' },
    { label: 'Publiés', value: 'published' },
    { label: 'Brouillons', value: 'draft' },
    { label: 'En revue', value: 'pending_review' },
    { label: 'Approuvés', value: 'approved' },
    { label: 'Corbeille', value: 'trash' },
];

export default function PostsIndex({ posts, filters }: PostsIndexProps) {
    const [search, setSearch] = useState(filters.search ?? '');

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        router.get('/admin/posts', { search, status: filters.status }, { preserveState: true });
    }

    function handleTabChange(status: string) {
        router.get('/admin/posts', { status, search: filters.search }, { preserveState: true });
    }

    function handleDelete(post: PostData) {
        if (!confirm(`Êtes-vous sûr de vouloir supprimer l'article "${post.title}" ?`)) return;
        router.delete(`/admin/posts/${post.id}`);
    }

    function handleRestore(post: PostData) {
        router.post(`/admin/posts/${post.id}/restore`);
    }

    function handleForceDelete(post: PostData) {
        if (!confirm(`Êtes-vous sûr de vouloir supprimer définitivement l'article "${post.title}" ? Cette action est irréversible.`)) return;
        router.delete(`/admin/posts/${post.id}/force-delete`);
    }

    function handleEmptyTrash() {
        if (!confirm('Êtes-vous sûr de vouloir vider la corbeille ? Tous les articles seront supprimés définitivement.')) return;
        router.post('/admin/posts/empty-trash');
    }

    function handleDuplicate(post: PostData) {
        router.post(`/admin/posts/${post.id}/duplicate`);
    }

    const isTrash = (filters.status ?? '') === 'trash';

    return (
        <AdminLayout
            header={
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-gray-900">Articles</h1>
                    <Link
                        href="/admin/posts/create"
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        Nouvel article
                    </Link>
                </div>
            }
        >
            <Head title="Articles" />

            <div className="rounded-lg border border-gray-200 bg-white">
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

                    {isTrash && posts.data.length > 0 && (
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

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-gray-200 bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 font-medium text-gray-700">Titre</th>
                                <th className="px-4 py-3 font-medium text-gray-700">Statut</th>
                                <th className="hidden px-4 py-3 font-medium text-gray-700 md:table-cell">Auteur</th>
                                <th className="hidden px-4 py-3 font-medium text-gray-700 lg:table-cell">Catégories</th>
                                <th className="hidden px-4 py-3 font-medium text-gray-700 sm:table-cell">Modifié le</th>
                                <th className="px-4 py-3 font-medium text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {posts.data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                                        Aucun article trouvé.
                                    </td>
                                </tr>
                            ) : (
                                posts.data.map((post) => (
                                    <tr key={post.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <Link
                                                href={`/admin/posts/${post.id}/edit`}
                                                className="font-medium text-gray-900 hover:text-indigo-600"
                                            >
                                                {post.title}
                                            </Link>
                                            <p className="text-xs text-gray-500">/{post.slug}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadge status={post.status} />
                                        </td>
                                        <td className="hidden px-4 py-3 text-gray-600 md:table-cell">
                                            {post.author?.name ?? '—'}
                                        </td>
                                        <td className="hidden px-4 py-3 lg:table-cell">
                                            <div className="flex flex-wrap gap-1">
                                                {post.terms && post.terms.length > 0 ? (
                                                    post.terms.slice(0, 3).map((term) => (
                                                        <span
                                                            key={term.id}
                                                            className="inline-flex rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
                                                        >
                                                            {term.name}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-gray-400">—</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="hidden px-4 py-3 text-gray-500 sm:table-cell">
                                            {formatDate(post.updated_at)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                {isTrash ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleRestore(post)}
                                                            className="rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-200 transition-colors"
                                                            title="Restaurer"
                                                        >
                                                            Restaurer
                                                        </button>
                                                        <button
                                                            onClick={() => handleForceDelete(post)}
                                                            className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-200 transition-colors"
                                                            title="Supprimer définitivement"
                                                        >
                                                            Supprimer définitivement
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Link
                                                            href={`/admin/posts/${post.id}/edit`}
                                                            className="text-gray-500 hover:text-indigo-600"
                                                            title="Modifier"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDuplicate(post)}
                                                            className="text-gray-500 hover:text-indigo-600"
                                                            title="Dupliquer"
                                                        >
                                                            <Copy className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(post)}
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

                {posts.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
                        <p className="text-sm text-gray-600">
                            {posts.from}–{posts.to} sur {posts.total}
                        </p>
                        <div className="flex gap-1">
                            {Array.from({ length: posts.last_page }, (_, i) => i + 1).map((p) => (
                                <Link
                                    key={p}
                                    href={`/admin/posts?page=${p}&status=${filters.status ?? ''}&search=${filters.search ?? ''}`}
                                    className={`rounded px-3 py-1 text-sm ${
                                        p === posts.current_page
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
