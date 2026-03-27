import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm , usePage } from '@inertiajs/react';
import type { PageData, SharedProps } from '@/types/cms';
import SeoPanel from '@/Components/admin/seo-panel';
import { ArrowLeft } from 'lucide-react';

interface PagesCreateProps {
    parentPages: PageData[];
}

export default function PagesCreate({ parentPages }: PagesCreateProps) {
    const { cms } = usePage<SharedProps>().props;
    const prefix = cms?.adminPrefix ?? 'admin';
    const { data, setData, post, processing, errors } = useForm({
        title: '',
        slug: '',
        status: 'draft' as string,
        access_level: 'public',
        template: '',
        meta_title: '',
        meta_description: '',
        og_image: '',
        meta_robots: 'index, follow',
        canonical_url: '',
        focus_keyword: '',
        parent_id: '' as string | number,
        published_at: '',
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

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post(`/${prefix}/pages`);
    }

    return (
        <AdminLayout
            header={
                <div className="flex items-center gap-4">
                    <Link href={`/${prefix}/pages`} className="text-gray-500 hover:text-gray-700">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <h1 className="text-xl font-semibold text-gray-900">Nouvelle page</h1>
                </div>
            }
        >
            <Head title="Nouvelle page" />

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

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                                Statut
                            </label>
                            <select
                                id="status"
                                value={data.status}
                                onChange={(e) => setData('status', e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                                <option value="draft">Brouillon</option>
                                <option value="published">Publie</option>
                                <option value="scheduled">Planifie</option>
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
                                {parentPages.map((p) => (
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
                    </div>
                </div>

                {/* SEO */}
                <SeoPanel
                    data={{
                        meta_title: data.meta_title,
                        meta_description: data.meta_description,
                        og_image: data.og_image,
                        meta_robots: data.meta_robots,
                        canonical_url: data.canonical_url,
                        focus_keyword: data.focus_keyword,
                    }}
                    errors={errors}
                    onChange={(field, value) => setData(field as keyof typeof data, value)}
                    pageTitle={data.title}
                    pageSlug={data.slug}
                    pageUrl={`/${data.slug}`}
                />

                {/* Actions */}
                <div className="flex items-center justify-end gap-3">
                    <Link
                        href={`/${prefix}/pages`}
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
