import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import type { TaxonomyData } from '@/types/cms';
import { ArrowLeft } from 'lucide-react';

interface PostsCreateProps {
    taxonomies: TaxonomyData[];
}

export default function PostsCreate({ taxonomies }: PostsCreateProps) {
    const { data, setData, post, processing, errors } = useForm({
        title: '',
        slug: '',
        excerpt: '',
        status: 'draft' as string,
        featured_image: '',
        allow_comments: true,
        published_at: '',
        term_ids: [] as number[],
    });

    function generateSlug(title: string): string {
        return title
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }

    function handleTitleChange(value: string) {
        setData((prev) => ({
            ...prev,
            title: value,
            slug: prev.slug === '' || prev.slug === generateSlug(prev.title) ? generateSlug(value) : prev.slug,
        }));
    }

    function toggleTerm(termId: number) {
        setData('term_ids', data.term_ids.includes(termId)
            ? data.term_ids.filter((id) => id !== termId)
            : [...data.term_ids, termId]
        );
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/admin/posts');
    }

    return (
        <AdminLayout
            header={
                <div className="flex items-center gap-4">
                    <Link href="/admin/posts" className="text-gray-500 hover:text-gray-700">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <h1 className="text-xl font-semibold text-gray-900">Nouvel article</h1>
                </div>
            }
        >
            <Head title="Nouvel article" />

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
                            onChange={(e) => handleTitleChange(e.target.value)}
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

                    <div>
                        <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700">
                            Extrait
                        </label>
                        <textarea
                            id="excerpt"
                            value={data.excerpt}
                            onChange={(e) => setData('excerpt', e.target.value)}
                            rows={3}
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="Bref résumé de l'article..."
                        />
                        {errors.excerpt && <p className="mt-1 text-sm text-red-600">{errors.excerpt}</p>}
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                                Statut
                            </label>
                            <select
                                id="status"
                                value={data.status}
                                onChange={(e) => setData('status', e.target.value as 'draft' | 'published' | 'scheduled')}
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                                <option value="draft">Brouillon</option>
                                <option value="published">Publié</option>
                                <option value="scheduled">Planifié</option>
                            </select>
                            {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status}</p>}
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

                    <div>
                        <label htmlFor="featured_image" className="block text-sm font-medium text-gray-700">
                            Image mise en avant
                        </label>
                        <input
                            id="featured_image"
                            type="text"
                            value={data.featured_image}
                            onChange={(e) => setData('featured_image', e.target.value)}
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="URL de l'image ou sélectionner depuis la médiathèque"
                        />
                        {data.featured_image && (
                            <div className="mt-2">
                                <img
                                    src={data.featured_image}
                                    alt="Aperçu"
                                    className="h-32 w-auto rounded-lg border border-gray-200 object-cover"
                                />
                            </div>
                        )}
                        {errors.featured_image && <p className="mt-1 text-sm text-red-600">{errors.featured_image}</p>}
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            id="allow_comments"
                            type="checkbox"
                            checked={data.allow_comments}
                            onChange={(e) => setData('allow_comments', e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <label htmlFor="allow_comments" className="text-sm font-medium text-gray-700">
                            Autoriser les commentaires
                        </label>
                    </div>
                </div>

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
                                            <label
                                                key={term.id}
                                                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors ${
                                                    data.term_ids.includes(term.id)
                                                        ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                                                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={data.term_ids.includes(term.id)}
                                                    onChange={() => toggleTerm(term.id)}
                                                    className="sr-only"
                                                />
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

                {/* Actions */}
                <div className="flex items-center justify-end gap-3">
                    <Link
                        href="/admin/posts"
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
        </AdminLayout>
    );
}

// ArrowLeft icon imported from lucide-react.
