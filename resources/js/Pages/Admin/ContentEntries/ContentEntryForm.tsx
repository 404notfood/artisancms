import { useForm, Link } from '@inertiajs/react';
import { useState } from 'react';
import type { ContentTypeData, ContentEntryData, BlockNode } from '@/types/cms';
import DynamicField from './components/DynamicField';

interface ContentEntryFormProps {
    contentType: ContentTypeData;
    contentEntry?: ContentEntryData;
}

interface ContentEntryFormData {
    title: string;
    slug: string;
    content: BlockNode[] | null;
    excerpt: string;
    featured_image: string;
    status: string;
    fields_data: Record<string, unknown>;
    published_at: string;
}

function slugify(str: string): string {
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

export default function ContentEntryForm({ contentType, contentEntry }: ContentEntryFormProps) {
    const isEditing = !!contentEntry;
    const supports = contentType.supports ?? [];

    // @ts-expect-error Inertia FormDataType doesn't support nested objects/arrays
    const { data, setData, post, put, processing, errors } = useForm<ContentEntryFormData>({
        title: contentEntry?.title ?? '',
        slug: contentEntry?.slug ?? '',
        content: contentEntry?.content ?? null,
        excerpt: contentEntry?.excerpt ?? '',
        featured_image: contentEntry?.featured_image ?? '',
        status: contentEntry?.status ?? 'draft',
        fields_data: contentEntry?.fields_data ?? {},
        published_at: contentEntry?.published_at
            ? contentEntry.published_at.slice(0, 16)
            : '',
    });

    const [slugManual, setSlugManual] = useState(isEditing);

    function handleTitleChange(title: string) {
        setData('title', title);
        if (!slugManual) {
            setData((prev: ContentEntryFormData) => ({ ...prev, title, slug: slugify(title) }));
        }
    }

    function setFieldValue(slug: string, value: unknown) {
        setData('fields_data', { ...data.fields_data, [slug]: value } as Record<string, unknown>);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const baseUrl = `/admin/content/${contentType.id}/entries`;
        if (isEditing) {
            put(`${baseUrl}/${contentEntry.id}`);
        } else {
            post(baseUrl);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Main content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Title / Slug */}
                    {supports.includes('title') && (
                        <div className="rounded-lg border border-gray-200 bg-white p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Titre <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={data.title}
                                        onChange={(e) => handleTitleChange(e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        placeholder="Titre de l'entree..."
                                        required
                                    />
                                    {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
                                </div>

                                {supports.includes('slug') && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                                        <input
                                            type="text"
                                            value={data.slug}
                                            onChange={(e) => {
                                                setSlugManual(true);
                                                setData('slug', e.target.value);
                                            }}
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        />
                                        {errors.slug && <p className="mt-1 text-xs text-red-600">{errors.slug}</p>}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Excerpt */}
                    {supports.includes('excerpt') && (
                        <div className="rounded-lg border border-gray-200 bg-white p-6">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Extrait</label>
                            <textarea
                                value={data.excerpt}
                                onChange={(e) => setData('excerpt', e.target.value)}
                                rows={3}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder="Resume court de l'entree..."
                            />
                            {errors.excerpt && <p className="mt-1 text-xs text-red-600">{errors.excerpt}</p>}
                        </div>
                    )}

                    {/* Content area placeholder */}
                    {supports.includes('content') && (
                        <div className="rounded-lg border border-gray-200 bg-white p-6">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contenu</label>
                            <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
                                Le contenu sera editable via le page builder apres la creation.
                            </div>
                        </div>
                    )}

                    {/* Custom Fields */}
                    {(contentType.fields ?? []).length > 0 && (
                        <div className="rounded-lg border border-gray-200 bg-white p-6">
                            <h2 className="text-lg font-medium text-gray-900 mb-4">Champs personnalises</h2>
                            <div className="space-y-4">
                                {(contentType.fields ?? [])
                                    .sort((a, b) => a.order - b.order)
                                    .map((field) => (
                                        <DynamicField
                                            key={field.slug}
                                            field={field}
                                            value={data.fields_data[field.slug]}
                                            onChange={(val) => setFieldValue(field.slug, val)}
                                            error={errors[`fields_data.${field.slug}` as keyof typeof errors]}
                                        />
                                    ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Publish box */}
                    <div className="rounded-lg border border-gray-200 bg-white p-6">
                        <h3 className="text-sm font-semibold text-gray-900 mb-4">Publication</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Statut</label>
                                <select
                                    value={data.status}
                                    onChange={(e) => setData('status', e.target.value as ContentEntryData['status'])}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                >
                                    <option value="draft">Brouillon</option>
                                    <option value="published">Publie</option>
                                    <option value="scheduled">Planifie</option>
                                </select>
                            </div>

                            {data.status === 'scheduled' && (
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                        Date de publication
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={data.published_at}
                                        onChange={(e) => setData('published_at', e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                </div>
                            )}

                            <div className="flex items-center gap-2 pt-2">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                                >
                                    {processing
                                        ? 'Enregistrement...'
                                        : isEditing
                                            ? 'Mettre a jour'
                                            : 'Creer'}
                                </button>
                                <Link
                                    href={`/admin/content/${contentType.id}/entries`}
                                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Annuler
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Featured image */}
                    {supports.includes('featured_image') && (
                        <div className="rounded-lg border border-gray-200 bg-white p-6">
                            <h3 className="text-sm font-semibold text-gray-900 mb-4">Image mise en avant</h3>
                            <input
                                type="text"
                                value={data.featured_image}
                                onChange={(e) => setData('featured_image', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder="URL de l'image..."
                            />
                            {data.featured_image && (
                                <img
                                    src={data.featured_image}
                                    alt="Apercu"
                                    className="mt-3 w-full rounded-lg object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                            )}
                        </div>
                    )}

                    {/* Info */}
                    {isEditing && contentEntry && (
                        <div className="rounded-lg border border-gray-200 bg-white p-6">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">Informations</h3>
                            <dl className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <dt className="text-gray-500">Auteur</dt>
                                    <dd className="text-gray-900">{contentEntry.author?.name ?? '—'}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-gray-500">Cree le</dt>
                                    <dd className="text-gray-900">
                                        {new Date(contentEntry.created_at).toLocaleDateString('fr-FR')}
                                    </dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-gray-500">Modifie le</dt>
                                    <dd className="text-gray-900">
                                        {new Date(contentEntry.updated_at).toLocaleDateString('fr-FR')}
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    )}
                </div>
            </div>
        </form>
    );
}
