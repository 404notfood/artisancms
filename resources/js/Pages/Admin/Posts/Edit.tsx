import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import type { PostData, TaxonomyData } from '@/types/cms';
import RevisionHistory from '@/Components/admin/revision-history';
import StatusBadge from '@/Components/admin/status-badge';
import RejectModal from '@/Components/admin/RejectModal';
import PreviewModal from '@/Components/admin/PreviewModal';
import { usePreviewLink } from '@/Components/admin/usePreviewLink';
import { ArrowLeft, Link as LinkIcon } from 'lucide-react';

interface PostsEditProps {
    post: PostData;
    taxonomies: TaxonomyData[];
}

export default function PostsEdit({ post, taxonomies }: PostsEditProps) {
    const currentTermIds = post.terms?.map((t) => t.id) ?? [];
    const [showRejectModal, setShowRejectModal] = useState(false);
    const preview = usePreviewLink(`/admin/posts/${post.id}/preview`);

    const { data, setData, put, processing, errors } = useForm({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt ?? '',
        status: post.status,
        access_level: post.access_level ?? 'public',
        featured_image: post.featured_image ?? '',
        allow_comments: post.allow_comments,
        published_at: post.published_at ? post.published_at.slice(0, 16) : '',
        term_ids: currentTermIds,
    });

    function toggleTerm(termId: number) {
        setData('term_ids', data.term_ids.includes(termId)
            ? data.term_ids.filter((id) => id !== termId)
            : [...data.term_ids, termId]
        );
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        put(`/admin/posts/${post.id}`);
    }

    function handlePublish() {
        router.put(`/admin/posts/${post.id}`, {
            ...data,
            status: 'published',
            published_at: data.published_at || new Date().toISOString().slice(0, 16),
        });
    }

    function handleUnpublish() {
        router.put(`/admin/posts/${post.id}`, { ...data, status: 'draft' });
    }

    function handleSubmitForReview() {
        router.post(`/admin/posts/${post.id}/submit-review`);
    }

    function handleApprove() {
        router.post(`/admin/posts/${post.id}/approve`);
    }

    function handleReject(reason: string) {
        router.post(`/admin/posts/${post.id}/reject`, { reason });
        setShowRejectModal(false);
    }

    return (
        <AdminLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/posts" className="text-gray-500 hover:text-gray-700">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <h1 className="text-xl font-semibold text-gray-900">Modifier l'article</h1>
                        <StatusBadge status={post.status} />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            type="button"
                            onClick={preview.handleGeneratePreview}
                            disabled={preview.previewLoading}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                        >
                            <LinkIcon className="h-4 w-4" />
                            {preview.previewLoading ? 'Generation...' : 'Generer un lien d\'apercu'}
                        </button>
                        {post.status === 'draft' && (
                            <button type="button" onClick={handleSubmitForReview} className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors">
                                Soumettre pour revue
                            </button>
                        )}
                        {post.status === 'pending_review' && (
                            <>
                                <button type="button" onClick={handleApprove} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors">Approuver</button>
                                <button type="button" onClick={() => setShowRejectModal(true)} className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors">Rejeter</button>
                            </>
                        )}
                        {(post.status === 'approved' || post.status === 'draft') && (
                            <button type="button" onClick={handlePublish} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors">Publier</button>
                        )}
                        {post.status === 'published' && (
                            <button type="button" onClick={handleUnpublish} className="rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-2 text-sm font-medium text-yellow-700 hover:bg-yellow-100 transition-colors">Depublier</button>
                        )}
                    </div>
                </div>
            }
        >
            <Head title={`Modifier : ${post.title}`} />

            <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">
                {/* Main fields */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
                    <h2 className="text-lg font-medium text-gray-900">Informations</h2>
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">Titre</label>
                        <input id="title" type="text" value={data.title} onChange={(e) => setData('title', e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" required />
                        {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
                    </div>
                    <div>
                        <label htmlFor="slug" className="block text-sm font-medium text-gray-700">Slug</label>
                        <input id="slug" type="text" value={data.slug} onChange={(e) => setData('slug', e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" required />
                        {errors.slug && <p className="mt-1 text-sm text-red-600">{errors.slug}</p>}
                    </div>
                    <div>
                        <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700">Extrait</label>
                        <textarea id="excerpt" value={data.excerpt} onChange={(e) => setData('excerpt', e.target.value)} rows={3} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" placeholder="Bref resume de l'article..." />
                        {errors.excerpt && <p className="mt-1 text-sm text-red-600">{errors.excerpt}</p>}
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-gray-700">Statut</label>
                            <select id="status" value={data.status} onChange={(e) => setData('status', e.target.value as PostData['status'])} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                                <option value="draft">Brouillon</option>
                                <option value="pending_review">En revue</option>
                                <option value="approved">Approuve</option>
                                <option value="published">Publie</option>
                                <option value="scheduled">Planifie</option>
                                <option value="trash">Corbeille</option>
                            </select>
                            {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status}</p>}
                        </div>
                        <div>
                            <label htmlFor="published_at" className="block text-sm font-medium text-gray-700">Date de publication</label>
                            <input id="published_at" type="datetime-local" value={data.published_at} onChange={(e) => setData('published_at', e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                            {errors.published_at && <p className="mt-1 text-sm text-red-600">{errors.published_at}</p>}
                        </div>
                    </div>
                    <div>
                        <label htmlFor="featured_image" className="block text-sm font-medium text-gray-700">Image mise en avant</label>
                        <input id="featured_image" type="text" value={data.featured_image} onChange={(e) => setData('featured_image', e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" placeholder="URL de l'image ou selectionner depuis la mediatheque" />
                        {data.featured_image && (
                            <div className="mt-2">
                                <img src={data.featured_image} alt="Apercu" className="h-32 w-auto rounded-lg border border-gray-200 object-cover" />
                            </div>
                        )}
                        {errors.featured_image && <p className="mt-1 text-sm text-red-600">{errors.featured_image}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                        <input id="allow_comments" type="checkbox" checked={data.allow_comments} onChange={(e) => setData('allow_comments', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                        <label htmlFor="allow_comments" className="text-sm font-medium text-gray-700">Autoriser les commentaires</label>
                    </div>
                </div>

                {/* Access Level */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
                    <h2 className="text-lg font-medium text-gray-900">Niveau d'acces</h2>
                    <div>
                        <label htmlFor="access_level" className="block text-sm font-medium text-gray-700">Qui peut voir cet article ?</label>
                        <select id="access_level" value={data.access_level} onChange={(e) => setData('access_level', e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                            <option value="public">Public (tout le monde)</option>
                            <option value="authenticated">Utilisateurs connectes uniquement</option>
                            <option value="role:admin">Administrateurs uniquement</option>
                            <option value="role:editor">Editeurs et administrateurs</option>
                        </select>
                        {errors.access_level && <p className="mt-1 text-sm text-red-600">{errors.access_level}</p>}
                        <p className="mt-1 text-xs text-gray-500">Controle qui peut voir cet article sur le site public.</p>
                    </div>
                </div>

                {/* Rejection notice */}
                {post.rejection_reason && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                        <h3 className="text-sm font-medium text-red-800">Article rejete</h3>
                        <p className="mt-1 text-sm text-red-700">{post.rejection_reason}</p>
                        {post.reviewed_at && (
                            <p className="mt-1 text-xs text-red-500">
                                Le {new Date(post.reviewed_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                        )}
                    </div>
                )}

                {/* Taxonomies */}
                {taxonomies.length > 0 && (
                    <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
                        <h2 className="text-lg font-medium text-gray-900">Taxonomies</h2>
                        {taxonomies.map((taxonomy) => (
                            <div key={taxonomy.id}>
                                <h3 className="text-sm font-medium text-gray-700 mb-2">{taxonomy.name}</h3>
                                <div className="flex flex-wrap gap-2">
                                    {taxonomy.terms && taxonomy.terms.length > 0 ? (
                                        taxonomy.terms.map((term) => (
                                            <label key={term.id} className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors ${data.term_ids.includes(term.id) ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`}>
                                                <input type="checkbox" checked={data.term_ids.includes(term.id)} onChange={() => toggleTerm(term.id)} className="sr-only" />
                                                {term.name}
                                            </label>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-500">Aucun terme disponible.</p>
                                    )}
                                </div>
                            </div>
                        ))}
                        {errors.term_ids && <p className="mt-1 text-sm text-red-600">{errors.term_ids}</p>}
                    </div>
                )}

                <RevisionHistory entityType="post" entityId={post.id} />

                <div className="flex items-center justify-end gap-3">
                    <Link href="/admin/posts" className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Annuler</Link>
                    <button type="submit" disabled={processing} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                        {processing ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                </div>
            </form>

            {showRejectModal && (
                <RejectModal
                    entityLabel="l'article"
                    onConfirm={handleReject}
                    onCancel={() => setShowRejectModal(false)}
                />
            )}

            {preview.showPreviewModal && (
                <PreviewModal
                    previewUrl={preview.previewUrl}
                    expiresAt={preview.previewExpiresAt}
                    onClose={() => preview.setShowPreviewModal(false)}
                />
            )}
        </AdminLayout>
    );
}
