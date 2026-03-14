import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import type { PageData } from '@/types/cms';
import RevisionHistory from '@/Components/admin/revision-history';

interface PagesEditProps {
    page: PageData;
    parentPages: PageData[];
}

export default function PagesEdit({ page, parentPages }: PagesEditProps) {
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');
    const [previewExpiresAt, setPreviewExpiresAt] = useState('');
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewCopied, setPreviewCopied] = useState(false);

    const { data, setData, put, processing, errors } = useForm({
        title: page.title,
        slug: page.slug,
        status: page.status,
        access_level: page.access_level ?? 'public',
        template: page.template ?? '',
        meta_title: page.meta_title ?? '',
        meta_description: page.meta_description ?? '',
        parent_id: page.parent_id ?? ('' as string | number),
        published_at: page.published_at ? page.published_at.slice(0, 16) : '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        put(`/admin/pages/${page.id}`);
    }

    function handlePublish() {
        router.put(`/admin/pages/${page.id}`, {
            ...data,
            status: 'published',
            published_at: data.published_at || new Date().toISOString().slice(0, 16),
        });
    }

    function handleUnpublish() {
        router.put(`/admin/pages/${page.id}`, {
            ...data,
            status: 'draft',
        });
    }

    function handleSubmitForReview() {
        router.post(`/admin/pages/${page.id}/submit-review`);
    }

    function handleApprove() {
        router.post(`/admin/pages/${page.id}/approve`);
    }

    function handleReject() {
        if (!rejectReason.trim()) return;
        router.post(`/admin/pages/${page.id}/reject`, { reason: rejectReason });
        setShowRejectModal(false);
        setRejectReason('');
    }

    function handleGeneratePreview() {
        setPreviewLoading(true);
        fetch(`/admin/pages/${page.id}/preview`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-XSRF-TOKEN': decodeURIComponent(
                    document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? ''
                ),
            },
            credentials: 'same-origin',
        })
            .then((res) => res.json())
            .then((data) => {
                setPreviewUrl(data.url);
                setPreviewExpiresAt(data.expires_at);
                setShowPreviewModal(true);
            })
            .catch(() => {})
            .finally(() => setPreviewLoading(false));
    }

    function copyPreviewUrl() {
        navigator.clipboard.writeText(previewUrl).then(() => {
            setPreviewCopied(true);
            setTimeout(() => setPreviewCopied(false), 2000);
        });
    }

    // Filter out the current page from parent options
    const availableParents = parentPages.filter((p) => p.id !== page.id);

    return (
        <AdminLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/pages" className="text-gray-500 hover:text-gray-700">
                            <BackIcon />
                        </Link>
                        <h1 className="text-xl font-semibold text-gray-900">Modifier la page</h1>
                        <StatusBadge status={page.status} />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            type="button"
                            onClick={handleGeneratePreview}
                            disabled={previewLoading}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                        >
                            <PreviewIcon />
                            {previewLoading ? 'Generation...' : 'Generer un lien d\'apercu'}
                        </button>
                        <Link
                            href={`/admin/pages/${page.id}/builder`}
                            className="inline-flex items-center gap-2 rounded-lg border border-indigo-300 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
                        >
                            <BuilderIcon />
                            Page Builder
                        </Link>
                        {page.status === 'draft' && (
                            <button
                                type="button"
                                onClick={handleSubmitForReview}
                                className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
                            >
                                Soumettre pour revue
                            </button>
                        )}
                        {page.status === 'pending_review' && (
                            <>
                                <button
                                    type="button"
                                    onClick={handleApprove}
                                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
                                >
                                    Approuver
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowRejectModal(true)}
                                    className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
                                >
                                    Rejeter
                                </button>
                            </>
                        )}
                        {(page.status === 'approved' || page.status === 'draft') && (
                            <button
                                type="button"
                                onClick={handlePublish}
                                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
                            >
                                Publier
                            </button>
                        )}
                        {page.status === 'published' && (
                            <button
                                type="button"
                                onClick={handleUnpublish}
                                className="rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-2 text-sm font-medium text-yellow-700 hover:bg-yellow-100 transition-colors"
                            >
                                Depublier
                            </button>
                        )}
                    </div>
                </div>
            }
        >
            <Head title={`Modifier : ${page.title}`} />

            <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">
                {/* Main fields */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
                    <h2 className="text-lg font-medium text-gray-900">Informations</h2>

                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                            Titre
                        </label>
                        <input
                            id="title"
                            type="text"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            required
                        />
                        {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
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
                            required
                        />
                        {errors.slug && <p className="mt-1 text-sm text-red-600">{errors.slug}</p>}
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                                Statut
                            </label>
                            <select
                                id="status"
                                value={data.status}
                                onChange={(e) => setData('status', e.target.value as PageData['status'])}
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
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
                            <label htmlFor="template" className="block text-sm font-medium text-gray-700">
                                Template
                            </label>
                            <select
                                id="template"
                                value={data.template}
                                onChange={(e) => setData('template', e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                                <option value="">Par défaut</option>
                                <option value="full-width">Pleine largeur</option>
                                <option value="sidebar">Avec barre latérale</option>
                                <option value="landing">Landing page</option>
                            </select>
                            {errors.template && <p className="mt-1 text-sm text-red-600">{errors.template}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="parent_id" className="block text-sm font-medium text-gray-700">
                                Page parente
                            </label>
                            <select
                                id="parent_id"
                                value={data.parent_id}
                                onChange={(e) => setData('parent_id', e.target.value ? Number(e.target.value) : '')}
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                                <option value="">Aucune (racine)</option>
                                {availableParents.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.title}
                                    </option>
                                ))}
                            </select>
                            {errors.parent_id && <p className="mt-1 text-sm text-red-600">{errors.parent_id}</p>}
                        </div>

                        <div>
                            <label htmlFor="published_at" className="block text-sm font-medium text-gray-700">
                                Date de publication
                            </label>
                            <input
                                id="published_at"
                                type="datetime-local"
                                value={data.published_at}
                                onChange={(e) => setData('published_at', e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            {errors.published_at && <p className="mt-1 text-sm text-red-600">{errors.published_at}</p>}
                        </div>
                    </div>
                </div>

                {/* Access Level */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
                    <h2 className="text-lg font-medium text-gray-900">Niveau d'acces</h2>

                    <div>
                        <label htmlFor="access_level" className="block text-sm font-medium text-gray-700">
                            Qui peut voir cette page ?
                        </label>
                        <select
                            id="access_level"
                            value={data.access_level}
                            onChange={(e) => setData('access_level', e.target.value)}
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                            <option value="public">Public (tout le monde)</option>
                            <option value="authenticated">Utilisateurs connectes uniquement</option>
                            <option value="role:admin">Administrateurs uniquement</option>
                            <option value="role:editor">Editeurs et administrateurs</option>
                        </select>
                        {errors.access_level && <p className="mt-1 text-sm text-red-600">{errors.access_level}</p>}
                        <p className="mt-1 text-xs text-gray-500">
                            Controle qui peut voir cette page sur le site public.
                        </p>
                    </div>
                </div>

                {/* Rejection notice */}
                {page.rejection_reason && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                        <h3 className="text-sm font-medium text-red-800">Page rejetee</h3>
                        <p className="mt-1 text-sm text-red-700">{page.rejection_reason}</p>
                        {page.reviewed_at && (
                            <p className="mt-1 text-xs text-red-500">
                                Le {new Date(page.reviewed_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                        )}
                    </div>
                )}

                {/* SEO */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
                    <h2 className="text-lg font-medium text-gray-900">SEO</h2>

                    <div>
                        <label htmlFor="meta_title" className="block text-sm font-medium text-gray-700">
                            Meta titre
                        </label>
                        <input
                            id="meta_title"
                            type="text"
                            value={data.meta_title}
                            onChange={(e) => setData('meta_title', e.target.value)}
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            maxLength={60}
                        />
                        <p className="mt-1 text-xs text-gray-500">{data.meta_title.length}/60 caractères</p>
                        {errors.meta_title && <p className="mt-1 text-sm text-red-600">{errors.meta_title}</p>}
                    </div>

                    <div>
                        <label htmlFor="meta_description" className="block text-sm font-medium text-gray-700">
                            Meta description
                        </label>
                        <textarea
                            id="meta_description"
                            value={data.meta_description}
                            onChange={(e) => setData('meta_description', e.target.value)}
                            rows={3}
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            maxLength={160}
                        />
                        <p className="mt-1 text-xs text-gray-500">{data.meta_description.length}/160 caractères</p>
                        {errors.meta_description && <p className="mt-1 text-sm text-red-600">{errors.meta_description}</p>}
                    </div>
                </div>

                {/* Revision History */}
                <RevisionHistory entityType="page" entityId={page.id} />

                {/* Actions */}
                <div className="flex items-center justify-end gap-3">
                    <Link
                        href="/admin/pages"
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

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                        <h3 className="text-lg font-medium text-gray-900">Rejeter la page</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Indiquez la raison du rejet. L'auteur la verra sur la page.
                        </p>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            rows={4}
                            className="mt-3 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="Raison du rejet..."
                            required
                        />
                        <div className="mt-4 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowRejectModal(false)}
                                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                type="button"
                                onClick={handleReject}
                                disabled={!rejectReason.trim()}
                                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                            >
                                Confirmer le rejet
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {showPreviewModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
                        <h3 className="text-lg font-medium text-gray-900">Lien d'apercu</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Ce lien permet de visualiser la page sans etre connecte. Il expire automatiquement.
                        </p>
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">URL de l'apercu</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    readOnly
                                    value={previewUrl}
                                    className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700"
                                />
                                <button
                                    type="button"
                                    onClick={copyPreviewUrl}
                                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors shrink-0"
                                >
                                    {previewCopied ? 'Copie !' : 'Copier'}
                                </button>
                            </div>
                        </div>
                        {previewExpiresAt && (
                            <p className="mt-3 text-xs text-gray-500">
                                Expire le {new Date(previewExpiresAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                        )}
                        <div className="mt-4 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowPreviewModal(false)}
                                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Fermer
                            </button>
                            <a
                                href={previewUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
                            >
                                Ouvrir l'apercu
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        published: 'bg-green-100 text-green-800',
        draft: 'bg-yellow-100 text-yellow-800',
        pending_review: 'bg-orange-100 text-orange-800',
        approved: 'bg-emerald-100 text-emerald-800',
        scheduled: 'bg-blue-100 text-blue-800',
        trash: 'bg-red-100 text-red-800',
    };
    const labels: Record<string, string> = {
        published: 'Publie',
        draft: 'Brouillon',
        pending_review: 'En revue',
        approved: 'Approuve',
        scheduled: 'Planifie',
        trash: 'Corbeille',
    };
    return (
        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${styles[status] ?? 'bg-gray-100 text-gray-800'}`}>
            {labels[status] ?? status}
        </span>
    );
}

function BackIcon() {
    return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
    );
}

function BuilderIcon() {
    return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125z" />
        </svg>
    );
}

function PreviewIcon() {
    return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.07-9.07a4.5 4.5 0 016.364 6.364l-4.5 4.5a4.5 4.5 0 01-7.244-1.242" />
        </svg>
    );
}
