import { Pencil, Trash2 } from 'lucide-react';
import type { ProductCategoryData } from '@/types/cms';
import type { useForm } from '@inertiajs/react';

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

export default function CategoryRow({
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
                        <Pencil className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => onDelete(category)}
                        className={`${hasProducts ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-red-600'}`}
                        title={hasProducts ? 'Impossible de supprimer (contient des produits)' : 'Supprimer'}
                        disabled={hasProducts}
                    >
                        <Trash2 className="h-4 w-4" />
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

export function flattenCategories(categories: ProductCategoryData[], depth = 0): ProductCategoryData[] {
    const result: ProductCategoryData[] = [];
    for (const cat of categories) {
        result.push(cat);
        if (cat.children?.length) {
            result.push(...flattenCategories(cat.children, depth + 1));
        }
    }
    return result;
}
