import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import type { ProductCategoryData } from '@/types/cms';

interface CategoriesIndexProps {
    categories: ProductCategoryData[];
}

export default function CategoriesIndex({ categories }: CategoriesIndexProps) {
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
        createForm.post('/admin/shop/categories', {
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

    // Flatten categories for parent select
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

interface CategoryRowProps {
    category: ProductCategoryData;
    depth: number;
    editingId: number | null;
    editForm: ReturnType<typeof useForm<{
        name: string;
        slug: string;
        description: string;
        image: string;
        parent_id: string | number;
        order: number;
    }>>;
    allCategories: ProductCategoryData[];
    onEdit: (category: ProductCategoryData) => void;
    onUpdate: (e: React.FormEvent) => void;
    onCancelEdit: () => void;
    onDelete: (category: ProductCategoryData) => void;
}

function CategoryRow({
    category,
    depth,
    editingId,
    editForm,
    allCategories,
    onEdit,
    onUpdate,
    onCancelEdit,
    onDelete,
}: CategoryRowProps) {
    const isEditing = editingId === category.id;
    const hasProducts = (category.products_count ?? 0) > 0;

    return (
        <>
            <div className="flex items-center justify-between px-6 py-3 hover:bg-gray-50">
                <div className="flex items-center gap-3" style={{ paddingLeft: `${depth * 24}px` }}>
                    {depth > 0 && (
                        <span className="text-gray-300">--</span>
                    )}
                    {category.image && (
                        <img
                            src={category.image}
                            alt={category.name}
                            className="h-8 w-8 rounded border border-gray-200 object-cover"
                        />
                    )}
                    <div>
                        <p className="font-medium text-gray-900">{category.name}</p>
                        <p className="text-xs text-gray-500">/{category.slug}</p>
                    </div>
                    {category.products_count !== undefined && (
                        <span className="inline-flex rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                            {category.products_count} produit{category.products_count !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onEdit(category)}
                        className="text-gray-500 hover:text-indigo-600"
                        title="Modifier"
                    >
                        <EditIcon />
                    </button>
                    <button
                        onClick={() => onDelete(category)}
                        className={`${hasProducts ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-red-600'}`}
                        title={hasProducts ? 'Impossible de supprimer (contient des produits)' : 'Supprimer'}
                        disabled={hasProducts}
                    >
                        <TrashIcon />
                    </button>
                </div>
            </div>

            {isEditing && (
                <div className="bg-indigo-50 border-y border-indigo-100 px-6 py-4">
                    <form onSubmit={onUpdate} className="space-y-3">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <input
                                type="text"
                                value={editForm.data.name}
                                onChange={(e) => editForm.setData('name', e.target.value)}
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder="Nom"
                                required
                            />
                            <input
                                type="text"
                                value={editForm.data.slug}
                                onChange={(e) => editForm.setData('slug', e.target.value)}
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder="Slug"
                            />
                            <input
                                type="number"
                                min="0"
                                value={editForm.data.order}
                                onChange={(e) => editForm.setData('order', parseInt(e.target.value) || 0)}
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder="Ordre"
                            />
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                                <textarea
                                    value={editForm.data.description}
                                    onChange={(e) => editForm.setData('description', e.target.value)}
                                    rows={2}
                                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    placeholder="Description"
                                />
                            </div>
                            <div>
                                <input
                                    type="text"
                                    value={editForm.data.image}
                                    onChange={(e) => editForm.setData('image', e.target.value)}
                                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    placeholder="URL de l'image"
                                />
                                {editForm.data.image && (
                                    <img
                                        src={editForm.data.image}
                                        alt="Apercu"
                                        className="mt-2 h-12 w-12 rounded border border-gray-200 object-cover"
                                    />
                                )}
                            </div>
                        </div>
                        <div>
                            <select
                                value={editForm.data.parent_id}
                                onChange={(e) => editForm.setData('parent_id', e.target.value === '' ? '' : parseInt(e.target.value))}
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                                <option value="">Aucune parente (racine)</option>
                                {allCategories
                                    .filter((c) => c.id !== category.id)
                                    .map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                disabled={editForm.processing}
                                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                            >
                                Enregistrer
                            </button>
                            <button
                                type="button"
                                onClick={onCancelEdit}
                                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Annuler
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {category.children?.map((child) => (
                <CategoryRow
                    key={child.id}
                    category={child}
                    depth={depth + 1}
                    editingId={editingId}
                    editForm={editForm}
                    allCategories={allCategories}
                    onEdit={onEdit}
                    onUpdate={onUpdate}
                    onCancelEdit={onCancelEdit}
                    onDelete={onDelete}
                />
            ))}
        </>
    );
}

function flattenCategories(categories: ProductCategoryData[], depth = 0): ProductCategoryData[] {
    const result: ProductCategoryData[] = [];
    for (const cat of categories) {
        result.push(cat);
        if (cat.children?.length) {
            result.push(...flattenCategories(cat.children, depth + 1));
        }
    }
    return result;
}

function EditIcon() {
    return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
        </svg>
    );
}

function TrashIcon() {
    return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
        </svg>
    );
}
