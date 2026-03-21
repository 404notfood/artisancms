import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import type { ProductCategoryData, SharedProps } from '@/types/cms';
import CategoryRow, { flattenCategories } from './components/CategoryRow';

interface CategoriesIndexProps {
    categories: ProductCategoryData[];
}

export default function CategoriesIndex({ categories }: CategoriesIndexProps) {
    const { cms } = usePage<SharedProps>().props;
    const prefix = cms?.adminPrefix ?? 'admin';
    const [editingId, setEditingId] = useState<number | null>(null);

    const createForm = useForm({
        name: '',
        slug: '',
        description: '',
        image: '',
        parent_id: '' as string | number,
        order: 0,
    });

    const editForm = useForm({
        name: '',
        slug: '',
        description: '',
        image: '',
        parent_id: '' as string | number,
        order: 0,
    });

    function generateSlug(title: string): string {
        return title
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }

    function handleCreateNameChange(value: string) {
        createForm.setData((prev) => ({
            ...prev,
            name: value,
            slug: prev.slug === '' || prev.slug === generateSlug(prev.name) ? generateSlug(value) : prev.slug,
        }));
    }

    function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        createForm.post(`/${prefix}/shop/categories`, {
            onSuccess: () => {
                createForm.reset();
            },
        });
    }

    function startEdit(category: ProductCategoryData) {
        setEditingId(category.id);
        editForm.setData({
            name: category.name,
            slug: category.slug,
            description: category.description ?? '',
            image: category.image ?? '',
            parent_id: category.parent_id ?? '',
            order: category.order,
        });
    }

    function handleUpdate(e: React.FormEvent) {
        e.preventDefault();
        if (!editingId) return;
        editForm.put(`/admin/shop/categories/${editingId}`, {
            onSuccess: () => setEditingId(null),
        });
    }

    function handleDelete(category: ProductCategoryData) {
        if (category.products_count && category.products_count > 0) {
            alert(`Impossible de supprimer la categorie "${category.name}" car elle contient ${category.products_count} produit(s).`);
            return;
        }
        if (!confirm(`Supprimer la categorie "${category.name}" ?`)) return;
        router.delete(`/admin/shop/categories/${category.id}`);
    }

    const allCategories = flattenCategories(categories);

    return (
        <AdminLayout
            header={
                <h1 className="text-xl font-semibold text-gray-900">Categories produits</h1>
            }
        >
            <Head title="Categories produits" />

            <div className="mx-auto max-w-4xl space-y-6">
                {/* Create form */}
                <div className="rounded-lg border border-gray-200 bg-white p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Nouvelle categorie</h2>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label htmlFor="create-name" className="block text-sm font-medium text-gray-700">
                                    Nom
                                </label>
                                <input
                                    id="create-name"
                                    type="text"
                                    value={createForm.data.name}
                                    onChange={(e) => handleCreateNameChange(e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    required
                                />
                                {createForm.errors.name && <p className="mt-1 text-sm text-red-600">{createForm.errors.name}</p>}
                            </div>

                            <div>
                                <label htmlFor="create-slug" className="block text-sm font-medium text-gray-700">
                                    Slug
                                </label>
                                <input
                                    id="create-slug"
                                    type="text"
                                    value={createForm.data.slug}
                                    onChange={(e) => createForm.setData('slug', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                                {createForm.errors.slug && <p className="mt-1 text-sm text-red-600">{createForm.errors.slug}</p>}
                            </div>

                            <div>
                                <label htmlFor="create-parent" className="block text-sm font-medium text-gray-700">
                                    Categorie parente
                                </label>
                                <select
                                    id="create-parent"
                                    value={createForm.data.parent_id}
                                    onChange={(e) => createForm.setData('parent_id', e.target.value === '' ? '' : parseInt(e.target.value))}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                >
                                    <option value="">Aucune (racine)</option>
                                    {allCategories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="create-order" className="block text-sm font-medium text-gray-700">
                                    Ordre
                                </label>
                                <input
                                    id="create-order"
                                    type="number"
                                    min="0"
                                    value={createForm.data.order}
                                    onChange={(e) => createForm.setData('order', parseInt(e.target.value) || 0)}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="create-description" className="block text-sm font-medium text-gray-700">
                                Description
                            </label>
                            <textarea
                                id="create-description"
                                value={createForm.data.description}
                                onChange={(e) => createForm.setData('description', e.target.value)}
                                rows={2}
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder="Description optionnelle..."
                            />
                        </div>

                        <div>
                            <label htmlFor="create-image" className="block text-sm font-medium text-gray-700">
                                Image
                            </label>
                            <input
                                id="create-image"
                                type="text"
                                value={createForm.data.image}
                                onChange={(e) => createForm.setData('image', e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder="URL de l'image"
                            />
                            {createForm.data.image && (
                                <div className="mt-2">
                                    <img
                                        src={createForm.data.image}
                                        alt="Apercu"
                                        className="h-16 w-16 rounded-lg border border-gray-200 object-cover"
                                    />
                                </div>
                            )}
                            {createForm.errors.image && <p className="mt-1 text-sm text-red-600">{createForm.errors.image}</p>}
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={createForm.processing}
                                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                            >
                                {createForm.processing ? 'Ajout...' : 'Ajouter'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Categories list */}
                <div className="rounded-lg border border-gray-200 bg-white">
                    <div className="border-b border-gray-200 px-6 py-4">
                        <h2 className="text-lg font-medium text-gray-900">Categories existantes</h2>
                    </div>

                    {categories.length === 0 ? (
                        <div className="px-6 py-8 text-center text-gray-500">
                            Aucune categorie. Utilisez le formulaire ci-dessus pour en creer une.
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {categories.map((category) => (
                                <CategoryRow
                                    key={category.id}
                                    category={category}
                                    depth={0}
                                    editingId={editingId}
                                    editForm={editForm}
                                    allCategories={allCategories}
                                    onEdit={startEdit}
                                    onUpdate={handleUpdate}
                                    onCancelEdit={() => setEditingId(null)}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
