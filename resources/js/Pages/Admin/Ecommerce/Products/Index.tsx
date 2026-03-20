import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router , usePage } from '@inertiajs/react';
import { useState } from 'react';
import type { ProductData, ProductCategoryData, PaginatedResponse, SharedProps } from '@/types/cms';
import StatusBadge from '@/Components/admin/status-badge';
import { Plus, Pencil, Trash2, ImageIcon } from 'lucide-react';

interface ProductsIndexProps {
    products: PaginatedResponse<ProductData>;
    categories: ProductCategoryData[];
    filters: {
        status?: string;
        search?: string;
        category_id?: string;
    };
}

const statusTabs = [
    { label: 'Tout', value: '' },
    { label: 'Publies', value: 'published' },
    { label: 'Brouillons', value: 'draft' },
    { label: 'Archives', value: 'archived' },
];

export default function ProductsIndex({ products, categories, filters }: ProductsIndexProps) {
    const { cms } = usePage<SharedProps>().props;
    const prefix = cms?.adminPrefix ?? 'admin';
    const [search, setSearch] = useState(filters.search ?? '');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const allIds = products.data.map((p) => p.id);
    const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.includes(id));

    function toggleAll() {
        if (allSelected) {
            setSelectedIds([]);
        } else {
            setSelectedIds(allIds);
        }
    }

    function toggleOne(id: number) {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );
    }

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        router.get(
            `/${prefix}/shop/products`,
            { search, status: filters.status, category_id: filters.category_id },
            { preserveState: true },
        );
    }

    function handleTabChange(status: string) {
        router.get(
            `/${prefix}/shop/products`,
            { status, search: filters.search, category_id: filters.category_id },
            { preserveState: true },
        );
    }

    function handleCategoryChange(categoryId: string) {
        router.get(
            `/${prefix}/shop/products`,
            { category_id: categoryId, status: filters.status, search: filters.search },
            { preserveState: true },
        );
    }

    function handleDelete(product: ProductData) {
        if (!confirm(`Supprimer le produit "${product.name}" ?`)) return;
        router.delete(`/admin/shop/products/${product.id}`);
    }

    function handleBulkDelete() {
        if (selectedIds.length === 0) return;
        if (!confirm(`Supprimer ${selectedIds.length} produit(s) selectionne(s) ?`)) return;
        selectedIds.forEach((id) => {
            router.delete(`/admin/shop/products/${id}`, { preserveState: true });
        });
        setSelectedIds([]);
    }

    function formatPrice(price: number): string {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price);
    }

    return (
        <AdminLayout
            header={
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-gray-900">Produits</h1>
                    <Link
                        href={`/${prefix}/shop/products/create`}
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        Ajouter un produit
                    </Link>
                </div>
            }
        >
            <Head title="Produits" />

            <div className="rounded-lg border border-gray-200 bg-white">
                {/* Tabs + Search + Category filter */}
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

                        <div className="flex flex-wrap items-center gap-2">
                            <select
                                value={filters.category_id ?? ''}
                                onChange={(e) => handleCategoryChange(e.target.value)}
                                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                                <option value="">Toutes les categories</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>

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
                    </div>

                    {/* Bulk actions */}
                    {selectedIds.length > 0 && (
                        <div className="flex items-center gap-3 rounded-lg bg-indigo-50 px-4 py-2">
                            <span className="text-sm font-medium text-indigo-700">
                                {selectedIds.length} selectionne(s)
                            </span>
                            <button
                                onClick={handleBulkDelete}
                                className="rounded-lg bg-red-600 px-3 py-1 text-sm font-medium text-white hover:bg-red-700 transition-colors"
                            >
                                Supprimer
                            </button>
                            <button
                                onClick={() => setSelectedIds([])}
                                className="text-sm text-gray-600 hover:text-gray-900"
                            >
                                Deselectionner
                            </button>
                        </div>
                    )}
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-gray-200 bg-gray-50">
                            <tr>
                                <th className="px-4 py-3">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        onChange={toggleAll}
                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                </th>
                                <th className="px-4 py-3 font-medium text-gray-700">Image</th>
                                <th className="px-4 py-3 font-medium text-gray-700">Nom</th>
                                <th className="hidden px-4 py-3 font-medium text-gray-700 md:table-cell">SKU</th>
                                <th className="px-4 py-3 font-medium text-gray-700">Prix</th>
                                <th className="hidden px-4 py-3 font-medium text-gray-700 md:table-cell">Stock</th>
                                <th className="px-4 py-3 font-medium text-gray-700">Statut</th>
                                <th className="hidden px-4 py-3 font-medium text-gray-700 lg:table-cell">Categorie</th>
                                <th className="px-4 py-3 font-medium text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {products.data.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                                        Aucun produit trouve.
                                    </td>
                                </tr>
                            ) : (
                                products.data.map((product) => (
                                    <tr key={product.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(product.id)}
                                                onChange={() => toggleOne(product.id)}
                                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            {product.featured_image ? (
                                                <img
                                                    src={product.featured_image}
                                                    alt={product.name}
                                                    className="h-10 w-10 rounded-lg border border-gray-200 object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
                                                    <ImageIcon className="h-5 w-5 text-gray-400" />
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Link
                                                href={`/admin/shop/products/${product.id}/edit`}
                                                className="font-medium text-gray-900 hover:text-indigo-600"
                                            >
                                                {product.name}
                                            </Link>
                                        </td>
                                        <td className="hidden px-4 py-3 text-gray-500 md:table-cell">
                                            {product.sku ? (
                                                <span className="font-mono text-xs">{product.sku}</span>
                                            ) : (
                                                <span className="text-gray-300">---</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="font-medium text-gray-900">
                                                {formatPrice(product.price)}
                                            </span>
                                            {product.compare_price && product.compare_price > product.price && (
                                                <span className="ml-1 text-xs text-gray-400 line-through">
                                                    {formatPrice(product.compare_price)}
                                                </span>
                                            )}
                                        </td>
                                        <td className="hidden px-4 py-3 md:table-cell">
                                            <StockBadge stock={product.stock} />
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadge status={product.status} />
                                        </td>
                                        <td className="hidden px-4 py-3 text-gray-600 lg:table-cell">
                                            {product.category?.name ?? '---'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    href={`/admin/shop/products/${product.id}/edit`}
                                                    className="text-gray-500 hover:text-indigo-600"
                                                    title="Modifier"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(product)}
                                                    className="text-gray-500 hover:text-red-600"
                                                    title="Supprimer"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {products.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
                        <p className="text-sm text-gray-600">
                            {products.from}--{products.to} sur {products.total}
                        </p>
                        <div className="flex gap-1">
                            {Array.from({ length: products.last_page }, (_, i) => i + 1).map((p) => (
                                <Link
                                    key={p}
                                    href={`/admin/shop/products?page=${p}&status=${filters.status ?? ''}&search=${filters.search ?? ''}&category_id=${filters.category_id ?? ''}`}
                                    className={`rounded px-3 py-1 text-sm ${
                                        p === products.current_page
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

function StockBadge({ stock }: { stock: number }) {
    if (stock === 0) {
        return <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">Rupture</span>;
    }
    if (stock <= 5) {
        return <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-800">{stock}</span>;
    }
    return <span className="text-gray-600">{stock}</span>;
}

