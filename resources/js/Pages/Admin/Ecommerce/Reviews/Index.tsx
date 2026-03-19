import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import type { PaginatedResponse, ProductReviewData } from '@/types/cms';
import { formatDate } from '@/lib/format';
import StatusBadge from '@/Components/admin/status-badge';

interface ReviewsIndexProps {
    reviews: PaginatedResponse<ProductReviewData>;
    filters: {
        status?: string;
        product_id?: string;
        rating?: string;
        search?: string;
    };
    products: { id: number; name: string }[];
}

const statusTabs = [
    { label: 'Tout', value: '' },
    { label: 'En attente', value: 'pending' },
    { label: 'Approuves', value: 'approved' },
    { label: 'Rejetes', value: 'rejected' },
];

export default function ReviewsIndex({ reviews, filters, products }: ReviewsIndexProps) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [replyText, setReplyText] = useState('');
    const [replyingId, setReplyingId] = useState<number | null>(null);

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        router.get('/admin/shop/reviews', {
            search,
            status: filters.status,
            product_id: filters.product_id,
            rating: filters.rating,
        }, { preserveState: true });
    }

    function handleTabChange(status: string) {
        router.get('/admin/shop/reviews', {
            status,
            search: filters.search,
            product_id: filters.product_id,
            rating: filters.rating,
        }, { preserveState: true });
    }

    function handleProductFilter(productId: string) {
        router.get('/admin/shop/reviews', {
            product_id: productId,
            status: filters.status,
            search: filters.search,
            rating: filters.rating,
        }, { preserveState: true });
    }

    function handleRatingFilter(rating: string) {
        router.get('/admin/shop/reviews', {
            rating,
            status: filters.status,
            search: filters.search,
            product_id: filters.product_id,
        }, { preserveState: true });
    }

    function handleApprove(id: number) {
        router.post(`/admin/shop/reviews/${id}/approve`, {}, { preserveState: true });
    }

    function handleReject(id: number) {
        router.post(`/admin/shop/reviews/${id}/reject`, {}, { preserveState: true });
    }

    function handleDelete(id: number) {
        if (confirm('Supprimer cet avis ?')) {
            router.delete(`/admin/shop/reviews/${id}`, { preserveState: true });
        }
    }

    function handleReply(id: number) {
        if (replyText.trim() === '') return;
        router.post(`/admin/shop/reviews/${id}/reply`, {
            admin_reply: replyText,
        }, {
            preserveState: true,
            onSuccess: () => {
                setReplyingId(null);
                setReplyText('');
            },
        });
    }

    function toggleExpand(id: number) {
        setExpandedId(expandedId === id ? null : id);
    }

    function startReply(review: ProductReviewData) {
        setReplyingId(review.id);
        setReplyText(review.admin_reply ?? '');
    }

    function renderStars(rating: number): string {
        return '\u2605'.repeat(rating) + '\u2606'.repeat(5 - rating);
    }

    return (
        <AdminLayout
            header={
                <h1 className="text-xl font-semibold text-gray-900">Avis produits</h1>
            }
        >
            <Head title="Avis produits" />

            <div className="rounded-lg border border-gray-200 bg-white">
                {/* Tabs + Filters */}
                <div className="flex flex-col gap-4 border-b border-gray-200 p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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

                    <div className="flex flex-wrap gap-3">
                        <select
                            value={filters.product_id ?? ''}
                            onChange={(e) => handleProductFilter(e.target.value)}
                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                            <option value="">Tous les produits</option>
                            {products.map((product) => (
                                <option key={product.id} value={product.id}>
                                    {product.name}
                                </option>
                            ))}
                        </select>

                        <select
                            value={filters.rating ?? ''}
                            onChange={(e) => handleRatingFilter(e.target.value)}
                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                            <option value="">Toutes les notes</option>
                            {[5, 4, 3, 2, 1].map((r) => (
                                <option key={r} value={r}>
                                    {r} {r > 1 ? 'etoiles' : 'etoile'}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-gray-200 bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 font-medium text-gray-700">Produit</th>
                                <th className="px-4 py-3 font-medium text-gray-700">Auteur</th>
                                <th className="px-4 py-3 font-medium text-gray-700">Note</th>
                                <th className="px-4 py-3 font-medium text-gray-700">Titre</th>
                                <th className="px-4 py-3 font-medium text-gray-700">Statut</th>
                                <th className="hidden px-4 py-3 font-medium text-gray-700 sm:table-cell">Date</th>
                                <th className="px-4 py-3 font-medium text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {reviews.data.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                                        Aucun avis trouve.
                                    </td>
                                </tr>
                            ) : (
                                reviews.data.map((review) => (
                                    <>
                                        <tr
                                            key={review.id}
                                            className="hover:bg-gray-50 cursor-pointer"
                                            onClick={() => toggleExpand(review.id)}
                                        >
                                            <td className="px-4 py-3">
                                                <span className="font-medium text-gray-900">
                                                    {review.product?.name ?? `Produit #${review.product_id}`}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div>
                                                    <p className="font-medium text-gray-900">{review.author_name}</p>
                                                    <p className="text-xs text-gray-500">{review.author_email}</p>
                                                    {review.verified_purchase && (
                                                        <span className="inline-flex items-center rounded-full bg-green-50 px-1.5 py-0.5 text-xs font-medium text-green-700 mt-0.5">
                                                            Achat verifie
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-yellow-500 text-base" title={`${review.rating}/5`}>
                                                    {renderStars(review.rating)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-900 max-w-[200px] truncate">
                                                {review.title}
                                            </td>
                                            <td className="px-4 py-3">
                                                <StatusBadge status={review.status} />
                                            </td>
                                            <td className="hidden px-4 py-3 text-gray-500 sm:table-cell">
                                                {formatDate(review.created_at)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                                    {review.status !== 'approved' && (
                                                        <button
                                                            onClick={() => handleApprove(review.id)}
                                                            className="rounded px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-50 transition-colors"
                                                            title="Approuver"
                                                        >
                                                            Approuver
                                                        </button>
                                                    )}
                                                    {review.status !== 'rejected' && (
                                                        <button
                                                            onClick={() => handleReject(review.id)}
                                                            className="rounded px-2 py-1 text-xs font-medium text-orange-700 hover:bg-orange-50 transition-colors"
                                                            title="Rejeter"
                                                        >
                                                            Rejeter
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(review.id)}
                                                        className="rounded px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 transition-colors"
                                                        title="Supprimer"
                                                    >
                                                        Supprimer
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>

                                        {/* Expanded content row */}
                                        {expandedId === review.id && (
                                            <tr key={`${review.id}-detail`} className="bg-gray-50">
                                                <td colSpan={7} className="px-4 py-4">
                                                    <div className="space-y-4">
                                                        <div>
                                                            <h4 className="text-sm font-semibold text-gray-700 mb-1">Contenu de l'avis</h4>
                                                            <p className="text-sm text-gray-600 whitespace-pre-wrap">{review.content}</p>
                                                        </div>

                                                        {review.admin_reply && replyingId !== review.id && (
                                                            <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-3">
                                                                <h4 className="text-sm font-semibold text-indigo-700 mb-1">Reponse admin</h4>
                                                                <p className="text-sm text-indigo-600 whitespace-pre-wrap">{review.admin_reply}</p>
                                                            </div>
                                                        )}

                                                        {replyingId === review.id ? (
                                                            <div className="space-y-2">
                                                                <textarea
                                                                    value={replyText}
                                                                    onChange={(e) => setReplyText(e.target.value)}
                                                                    rows={3}
                                                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                                    placeholder="Votre reponse..."
                                                                />
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        onClick={() => handleReply(review.id)}
                                                                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                                                                    >
                                                                        Enregistrer
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            setReplyingId(null);
                                                                            setReplyText('');
                                                                        }}
                                                                        className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                                                                    >
                                                                        Annuler
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => startReply(review)}
                                                                className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                                                            >
                                                                {review.admin_reply ? 'Modifier la reponse' : 'Repondre'}
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {reviews.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
                        <p className="text-sm text-gray-600">
                            {reviews.from}--{reviews.to} sur {reviews.total}
                        </p>
                        <div className="flex gap-1">
                            {Array.from({ length: reviews.last_page }, (_, i) => i + 1).map((p) => (
                                <Link
                                    key={p}
                                    href={`/admin/shop/reviews?page=${p}&status=${filters.status ?? ''}&search=${filters.search ?? ''}&product_id=${filters.product_id ?? ''}&rating=${filters.rating ?? ''}`}
                                    className={`rounded px-3 py-1 text-sm ${
                                        p === reviews.current_page
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

