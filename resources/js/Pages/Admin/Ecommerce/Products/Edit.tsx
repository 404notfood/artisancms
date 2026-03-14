import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import type { ProductData, ProductCategoryData } from '@/types/cms';

interface ProductsEditProps {
    product: ProductData;
    categories: ProductCategoryData[];
}

interface VariantFormData {
    id?: number;
    name: string;
    sku: string;
    price: number;
    stock: number;
    attributes: Record<string, string>;
}

export default function ProductsEdit({ product, categories }: ProductsEditProps) {
    const { data, setData, put, processing, errors } = useForm({
        name: product.name,
        slug: product.slug,
        description: product.description ?? '',
        price: product.price,
        compare_price: product.compare_price ?? ('' as string | number),
        sku: product.sku ?? '',
        stock: product.stock,
        status: product.status,
        featured_image: product.featured_image ?? '',
        gallery: product.gallery ?? ([] as string[]),
        category_id: product.category_id ?? ('' as string | number),
        variants: (product.variants ?? []).map((v) => ({
            id: v.id,
            name: v.name,
            sku: v.sku ?? '',
            price: v.price,
            stock: v.stock,
            attributes: v.attributes ?? {},
        })) as VariantFormData[],
    });

    const [galleryInput, setGalleryInput] = useState('');
    const [showVariantForm, setShowVariantForm] = useState(false);
    const [newVariant, setNewVariant] = useState<VariantFormData>({
        name: '',
        sku: '',
        price: 0,
        stock: 0,
        attributes: {},
    });
    const [newAttrKey, setNewAttrKey] = useState('');
    const [newAttrValue, setNewAttrValue] = useState('');
    // For editing existing variant attributes
    const [editAttrKey, setEditAttrKey] = useState('');
    const [editAttrValue, setEditAttrValue] = useState('');
    const [editAttrIndex, setEditAttrIndex] = useState<number | null>(null);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        put(`/admin/shop/products/${product.id}`);
    }

    function handleDelete() {
        if (!confirm(`Supprimer le produit "${product.name}" ? Cette action est irreversible.`)) return;
        router.delete(`/admin/shop/products/${product.id}`);
    }

    function addGalleryImage() {
        if (!galleryInput.trim()) return;
        setData('gallery', [...data.gallery, galleryInput.trim()]);
        setGalleryInput('');
    }

    function removeGalleryImage(index: number) {
        setData('gallery', data.gallery.filter((_, i) => i !== index));
    }

    function addVariantAttribute() {
        if (!newAttrKey.trim()) return;
        setNewVariant({
            ...newVariant,
            attributes: { ...newVariant.attributes, [newAttrKey.trim()]: newAttrValue.trim() },
        });
        setNewAttrKey('');
        setNewAttrValue('');
    }

    function removeVariantAttribute(key: string) {
        const updated = { ...newVariant.attributes };
        delete updated[key];
        setNewVariant({ ...newVariant, attributes: updated });
    }

    function addVariant() {
        if (!newVariant.name) return;
        setData('variants', [...data.variants, { ...newVariant }]);
        setNewVariant({ name: '', sku: '', price: 0, stock: 0, attributes: {} });
        setShowVariantForm(false);
    }

    function removeVariant(index: number) {
        setData('variants', data.variants.filter((_, i) => i !== index));
    }

    function updateVariantField(index: number, field: keyof VariantFormData, value: string | number) {
        const updated = [...data.variants];
        updated[index] = { ...updated[index], [field]: value };
        setData('variants', updated);
    }

    function addExistingVariantAttribute(index: number) {
        if (!editAttrKey.trim()) return;
        const updated = [...data.variants];
        updated[index] = {
            ...updated[index],
            attributes: { ...updated[index].attributes, [editAttrKey.trim()]: editAttrValue.trim() },
        };
        setData('variants', updated);
        setEditAttrKey('');
        setEditAttrValue('');
        setEditAttrIndex(null);
    }

    function removeExistingVariantAttribute(variantIndex: number, key: string) {
        const updated = [...data.variants];
        const attrs = { ...updated[variantIndex].attributes };
        delete attrs[key];
        updated[variantIndex] = { ...updated[variantIndex], attributes: attrs };
        setData('variants', updated);
    }

    return (
        <AdminLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/shop/products" className="text-gray-500 hover:text-gray-700">
                            <BackIcon />
                        </Link>
                        <h1 className="text-xl font-semibold text-gray-900">Modifier le produit</h1>
                        <StatusBadge status={product.status} />
                    </div>
                    <button
                        type="button"
                        onClick={handleDelete}
                        className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
                    >
                        <TrashIcon />
                        Supprimer
                    </button>
                </div>
            }
        >
            <Head title={`Modifier : ${product.name}`} />

            <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">
                {/* Informations */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
                    <h2 className="text-lg font-medium text-gray-900">Informations</h2>

                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                            Nom du produit
                        </label>
                        <input
                            id="name"
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            required
                        />
                        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
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
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                            Description
                        </label>
                        <textarea
                            id="description"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            rows={4}
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="Description du produit..."
                        />
                        {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                    </div>
                </div>

                {/* Prix */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
                    <h2 className="text-lg font-medium text-gray-900">Prix</h2>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                                Prix
                            </label>
                            <div className="relative mt-1">
                                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 text-sm">
                                    &euro;
                                </span>
                                <input
                                    id="price"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={data.price}
                                    onChange={(e) => setData('price', parseFloat(e.target.value) || 0)}
                                    className="block w-full rounded-lg border border-gray-300 pl-8 pr-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    required
                                />
                            </div>
                            {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
                        </div>

                        <div>
                            <label htmlFor="compare_price" className="block text-sm font-medium text-gray-700">
                                Prix compare (barre)
                            </label>
                            <div className="relative mt-1">
                                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 text-sm">
                                    &euro;
                                </span>
                                <input
                                    id="compare_price"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={data.compare_price}
                                    onChange={(e) => setData('compare_price', e.target.value === '' ? '' : parseFloat(e.target.value))}
                                    className="block w-full rounded-lg border border-gray-300 pl-8 pr-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    placeholder="Optionnel"
                                />
                            </div>
                            {errors.compare_price && <p className="mt-1 text-sm text-red-600">{errors.compare_price}</p>}
                        </div>
                    </div>
                </div>

                {/* Inventaire */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
                    <h2 className="text-lg font-medium text-gray-900">Inventaire</h2>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="sku" className="block text-sm font-medium text-gray-700">
                                SKU
                            </label>
                            <input
                                id="sku"
                                type="text"
                                value={data.sku}
                                onChange={(e) => setData('sku', e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder="Optionnel"
                            />
                            {errors.sku && <p className="mt-1 text-sm text-red-600">{errors.sku}</p>}
                        </div>

                        <div>
                            <label htmlFor="stock" className="block text-sm font-medium text-gray-700">
                                Stock
                            </label>
                            <input
                                id="stock"
                                type="number"
                                min="0"
                                value={data.stock}
                                onChange={(e) => setData('stock', parseInt(e.target.value) || 0)}
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                required
                            />
                            {errors.stock && <p className="mt-1 text-sm text-red-600">{errors.stock}</p>}
                        </div>
                    </div>
                </div>

                {/* Images */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
                    <h2 className="text-lg font-medium text-gray-900">Images</h2>

                    <div>
                        <label htmlFor="featured_image" className="block text-sm font-medium text-gray-700">
                            Image principale
                        </label>
                        <input
                            id="featured_image"
                            type="text"
                            value={data.featured_image}
                            onChange={(e) => setData('featured_image', e.target.value)}
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="URL de l'image"
                        />
                        {data.featured_image && (
                            <div className="mt-2">
                                <img
                                    src={data.featured_image}
                                    alt="Apercu"
                                    className="h-32 w-auto rounded-lg border border-gray-200 object-cover"
                                />
                            </div>
                        )}
                        {errors.featured_image && <p className="mt-1 text-sm text-red-600">{errors.featured_image}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Galerie
                        </label>
                        {data.gallery.length > 0 && (
                            <div className="flex flex-wrap gap-3 mb-3">
                                {data.gallery.map((url, index) => (
                                    <div key={index} className="relative group">
                                        <img
                                            src={url}
                                            alt={`Galerie ${index + 1}`}
                                            className="h-20 w-20 rounded-lg border border-gray-200 object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeGalleryImage(index)}
                                            className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Retirer"
                                        >
                                            <XIcon />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={galleryInput}
                                onChange={(e) => setGalleryInput(e.target.value)}
                                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder="URL de l'image"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        addGalleryImage();
                                    }
                                }}
                            />
                            <button
                                type="button"
                                onClick={addGalleryImage}
                                className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                            >
                                Ajouter
                            </button>
                        </div>
                        {errors.gallery && <p className="mt-1 text-sm text-red-600">{errors.gallery}</p>}
                    </div>
                </div>

                {/* Organisation */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
                    <h2 className="text-lg font-medium text-gray-900">Organisation</h2>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                                Statut
                            </label>
                            <select
                                id="status"
                                value={data.status}
                                onChange={(e) => setData('status', e.target.value as ProductData['status'])}
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                                <option value="draft">Brouillon</option>
                                <option value="published">Publie</option>
                                <option value="archived">Archive</option>
                            </select>
                            {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status}</p>}
                        </div>

                        <div>
                            <label htmlFor="category_id" className="block text-sm font-medium text-gray-700">
                                Categorie
                            </label>
                            <select
                                id="category_id"
                                value={data.category_id}
                                onChange={(e) => setData('category_id', e.target.value === '' ? '' : parseInt(e.target.value))}
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                                <option value="">Aucune categorie</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                            {errors.category_id && <p className="mt-1 text-sm text-red-600">{errors.category_id}</p>}
                        </div>
                    </div>
                </div>

                {/* Variantes */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-medium text-gray-900">Variantes</h2>
                        <button
                            type="button"
                            onClick={() => setShowVariantForm(true)}
                            className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                        >
                            <PlusIcon />
                            Ajouter
                        </button>
                    </div>

                    {data.variants.length > 0 && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b border-gray-200 bg-gray-50">
                                    <tr>
                                        <th className="px-3 py-2 font-medium text-gray-700">Nom</th>
                                        <th className="px-3 py-2 font-medium text-gray-700">SKU</th>
                                        <th className="px-3 py-2 font-medium text-gray-700">Prix</th>
                                        <th className="px-3 py-2 font-medium text-gray-700">Stock</th>
                                        <th className="px-3 py-2 font-medium text-gray-700">Attributs</th>
                                        <th className="px-3 py-2 font-medium text-gray-700"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {data.variants.map((variant, index) => (
                                        <tr key={variant.id ?? `new-${index}`}>
                                            <td className="px-3 py-2">
                                                <input
                                                    type="text"
                                                    value={variant.name}
                                                    onChange={(e) => updateVariantField(index, 'name', e.target.value)}
                                                    className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                />
                                            </td>
                                            <td className="px-3 py-2">
                                                <input
                                                    type="text"
                                                    value={variant.sku}
                                                    onChange={(e) => updateVariantField(index, 'sku', e.target.value)}
                                                    className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                />
                                            </td>
                                            <td className="px-3 py-2">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={variant.price}
                                                    onChange={(e) => updateVariantField(index, 'price', parseFloat(e.target.value) || 0)}
                                                    className="w-24 rounded border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                />
                                            </td>
                                            <td className="px-3 py-2">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={variant.stock}
                                                    onChange={(e) => updateVariantField(index, 'stock', parseInt(e.target.value) || 0)}
                                                    className="w-20 rounded border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                />
                                            </td>
                                            <td className="px-3 py-2">
                                                <div className="flex flex-wrap gap-1">
                                                    {variant.attributes && Object.entries(variant.attributes).map(([key, value]) => (
                                                        <span
                                                            key={key}
                                                            className="inline-flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600"
                                                        >
                                                            {key}: {value}
                                                            <button
                                                                type="button"
                                                                onClick={() => removeExistingVariantAttribute(index, key)}
                                                                className="text-gray-400 hover:text-red-600"
                                                            >
                                                                <XIcon />
                                                            </button>
                                                        </span>
                                                    ))}
                                                    {editAttrIndex === index ? (
                                                        <div className="flex items-center gap-1 mt-1">
                                                            <input
                                                                type="text"
                                                                value={editAttrKey}
                                                                onChange={(e) => setEditAttrKey(e.target.value)}
                                                                placeholder="Cle"
                                                                className="w-16 rounded border border-gray-300 px-1 py-0.5 text-xs focus:border-indigo-500 focus:outline-none"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={editAttrValue}
                                                                onChange={(e) => setEditAttrValue(e.target.value)}
                                                                placeholder="Valeur"
                                                                className="w-16 rounded border border-gray-300 px-1 py-0.5 text-xs focus:border-indigo-500 focus:outline-none"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => addExistingVariantAttribute(index)}
                                                                className="text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                                                            >
                                                                OK
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setEditAttrIndex(null)}
                                                                className="text-gray-400 hover:text-gray-600 text-xs"
                                                            >
                                                                <XIcon />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => setEditAttrIndex(index)}
                                                            className="inline-flex items-center rounded border border-dashed border-gray-300 px-1.5 py-0.5 text-xs text-gray-400 hover:text-gray-600 hover:border-gray-400"
                                                        >
                                                            + attr
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-3 py-2">
                                                <button
                                                    type="button"
                                                    onClick={() => removeVariant(index)}
                                                    className="text-gray-400 hover:text-red-600"
                                                    title="Supprimer"
                                                >
                                                    <TrashIcon />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {showVariantForm && (
                        <div className="rounded-lg border border-dashed border-gray-300 p-4 space-y-3">
                            <h3 className="text-sm font-medium text-gray-700">Nouvelle variante</h3>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                <input
                                    type="text"
                                    value={newVariant.name}
                                    onChange={(e) => setNewVariant({ ...newVariant, name: e.target.value })}
                                    placeholder="Nom"
                                    className="rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                                <input
                                    type="text"
                                    value={newVariant.sku}
                                    onChange={(e) => setNewVariant({ ...newVariant, sku: e.target.value })}
                                    placeholder="SKU"
                                    className="rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={newVariant.price}
                                    onChange={(e) => setNewVariant({ ...newVariant, price: parseFloat(e.target.value) || 0 })}
                                    placeholder="Prix"
                                    className="rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                                <input
                                    type="number"
                                    min="0"
                                    value={newVariant.stock}
                                    onChange={(e) => setNewVariant({ ...newVariant, stock: parseInt(e.target.value) || 0 })}
                                    placeholder="Stock"
                                    className="rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>

                            {/* Attributes */}
                            <div className="space-y-2">
                                <p className="text-xs font-medium text-gray-500 uppercase">Attributs</p>
                                {Object.keys(newVariant.attributes).length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {Object.entries(newVariant.attributes).map(([key, value]) => (
                                            <span
                                                key={key}
                                                className="inline-flex items-center gap-1 rounded bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700"
                                            >
                                                {key}: {value}
                                                <button
                                                    type="button"
                                                    onClick={() => removeVariantAttribute(key)}
                                                    className="text-indigo-400 hover:text-indigo-700"
                                                >
                                                    <XIcon />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newAttrKey}
                                        onChange={(e) => setNewAttrKey(e.target.value)}
                                        placeholder="Cle (ex: Taille)"
                                        className="rounded border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                    <input
                                        type="text"
                                        value={newAttrValue}
                                        onChange={(e) => setNewAttrValue(e.target.value)}
                                        placeholder="Valeur (ex: XL)"
                                        className="rounded border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={addVariantAttribute}
                                        className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={addVariant}
                                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                                >
                                    Ajouter la variante
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowVariantForm(false)}
                                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Annuler
                                </button>
                            </div>
                        </div>
                    )}

                    {data.variants.length === 0 && !showVariantForm && (
                        <p className="text-sm text-gray-500">Aucune variante. Cliquez sur Ajouter pour en creer une.</p>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3">
                    <Link
                        href="/admin/shop/products"
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

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        published: 'bg-green-100 text-green-800',
        draft: 'bg-yellow-100 text-yellow-800',
        archived: 'bg-gray-100 text-gray-800',
    };
    const labels: Record<string, string> = {
        published: 'Publie',
        draft: 'Brouillon',
        archived: 'Archive',
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

function PlusIcon() {
    return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
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

function XIcon() {
    return (
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
    );
}
