import { Head, Link, router } from '@inertiajs/react';
import FrontLayout from '@/Layouts/FrontLayout';
import type {
    ProductData,
    ProductCategoryData,
    PaginatedResponse,
    EcommerceSettingsData,
    MenuData,
} from '@/types/cms';
import { FormEvent, useState } from 'react';

interface ShopIndexProps {
    products: PaginatedResponse<ProductData>;
    categories: ProductCategoryData[];
    filters: {
        search?: string;
        category?: string;
        min_price?: string;
        max_price?: string;
        sort?: string;
    };
    settings: EcommerceSettingsData;
    menus: Record<string, MenuData>;
    theme: {
        customizations: Record<string, string>;
        layouts: Array<{ slug: string; name: string }>;
    };
}

function formatPrice(price: number, symbol: string): string {
    return `${Number(price).toFixed(2)} ${symbol}`;
}

function ProductCard({
    product,
    settings,
}: {
    product: ProductData;
    settings: EcommerceSettingsData;
}) {
    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        router.post(
            '/cart/add',
            { product_id: product.id, quantity: 1 },
            { preserveScroll: true },
        );
    };

    return (
        <div className="group overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-lg">
            <Link href={`/shop/${product.slug}`} className="block">
                <div className="relative aspect-square overflow-hidden bg-gray-100">
                    {product.featured_image ? (
                        <img
                            src={product.featured_image}
                            alt={product.name}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-gray-400">
                            <svg
                                className="h-16 w-16"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1}
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                            </svg>
                        </div>
                    )}
                    {product.compare_price && product.compare_price > product.price && (
                        <span className="absolute left-2 top-2 rounded bg-red-500 px-2 py-1 text-xs font-bold text-white">
                            Promo
                        </span>
                    )}
                    {product.stock <= 0 && (
                        <span className="absolute right-2 top-2 rounded bg-gray-800 px-2 py-1 text-xs font-bold text-white">
                            Rupture
                        </span>
                    )}
                </div>
            </Link>
            <div className="p-4">
                {product.category && (
                    <Link
                        href={`/shop/category/${product.category.slug}`}
                        className="mb-1 inline-block text-xs font-medium uppercase tracking-wider text-gray-500 hover:text-gray-700"
                    >
                        {product.category.name}
                    </Link>
                )}
                <Link href={`/shop/${product.slug}`}>
                    <h3 className="mb-2 text-sm font-semibold text-gray-900 transition-colors group-hover:text-blue-600">
                        {product.name}
                    </h3>
                </Link>
                <div className="mb-3 flex items-center gap-2">
                    <span className="text-lg font-bold text-gray-900">
                        {formatPrice(product.price, settings.currency_symbol)}
                    </span>
                    {product.compare_price && product.compare_price > product.price && (
                        <span className="text-sm text-gray-400 line-through">
                            {formatPrice(product.compare_price, settings.currency_symbol)}
                        </span>
                    )}
                </div>
                <button
                    onClick={handleAddToCart}
                    disabled={product.stock <= 0}
                    className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                    {product.stock > 0 ? 'Ajouter au panier' : 'Indisponible'}
                </button>
            </div>
        </div>
    );
}

function Pagination({ products }: { products: PaginatedResponse<ProductData> }) {
    if (products.last_page <= 1) return null;

    const pages = [];
    for (let i = 1; i <= products.last_page; i++) {
        pages.push(i);
    }

    return (
        <nav className="mt-8 flex items-center justify-center gap-1">
            {pages.map((page) => (
                <Link
                    key={page}
                    href={`?page=${page}`}
                    preserveState
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-md text-sm font-medium transition-colors ${
                        page === products.current_page
                            ? 'bg-gray-900 text-white'
                            : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                >
                    {page}
                </Link>
            ))}
        </nav>
    );
}

export default function ShopIndex({
    products,
    categories,
    filters,
    settings,
    menus,
    theme,
}: ShopIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [minPrice, setMinPrice] = useState(filters.min_price || '');
    const [maxPrice, setMaxPrice] = useState(filters.max_price || '');

    const handleFilterSubmit = (e: FormEvent) => {
        e.preventDefault();
        const params: Record<string, string> = {};
        if (search) params.search = search;
        if (minPrice) params.min_price = minPrice;
        if (maxPrice) params.max_price = maxPrice;
        if (filters.sort) params.sort = filters.sort;
        if (filters.category) params.category = filters.category;
        router.get('/shop', params, { preserveState: true });
    };

    const handleSortChange = (sort: string) => {
        const params: Record<string, string> = { ...filters, sort };
        router.get('/shop', params, { preserveState: true });
    };

    const handleCategoryClick = (slug: string | null) => {
        const params: Record<string, string> = {};
        if (filters.search) params.search = filters.search;
        if (filters.min_price) params.min_price = filters.min_price;
        if (filters.max_price) params.max_price = filters.max_price;
        if (filters.sort) params.sort = filters.sort;
        if (slug) params.category = slug;
        router.get('/shop', params, { preserveState: true });
    };

    return (
        <FrontLayout menus={menus} theme={theme}>
            <Head title={`${settings.store_name} - Boutique`} />

            <div className="container py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Boutique</h1>
                    <p className="mt-2 text-gray-600">
                        {products.total} produit{products.total !== 1 ? 's' : ''}
                    </p>
                </div>

                <div className="flex flex-col gap-8 lg:flex-row">
                    {/* Sidebar */}
                    <aside className="w-full shrink-0 lg:w-64">
                        {/* Search */}
                        <form onSubmit={handleFilterSubmit} className="mb-6">
                            <label className="mb-2 block text-sm font-semibold text-gray-900">
                                Rechercher
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Rechercher un produit..."
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-500 focus:outline-none"
                                />
                                <button
                                    type="submit"
                                    className="rounded-md bg-gray-900 px-3 py-2 text-sm text-white hover:bg-gray-700"
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </button>
                            </div>
                        </form>

                        {/* Categories */}
                        <div className="mb-6">
                            <h3 className="mb-3 text-sm font-semibold text-gray-900">
                                Categories
                            </h3>
                            <ul className="space-y-1">
                                <li>
                                    <button
                                        onClick={() => handleCategoryClick(null)}
                                        className={`w-full rounded px-2 py-1.5 text-left text-sm transition-colors ${
                                            !filters.category
                                                ? 'bg-gray-100 font-medium text-gray-900'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                    >
                                        Toutes les categories
                                    </button>
                                </li>
                                {categories.map((cat) => (
                                    <li key={cat.id}>
                                        <button
                                            onClick={() => handleCategoryClick(cat.slug)}
                                            className={`w-full rounded px-2 py-1.5 text-left text-sm transition-colors ${
                                                filters.category === cat.slug
                                                    ? 'bg-gray-100 font-medium text-gray-900'
                                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                            }`}
                                        >
                                            {cat.name}
                                            {cat.products_count !== undefined && (
                                                <span className="ml-1 text-xs text-gray-400">
                                                    ({cat.products_count})
                                                </span>
                                            )}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Price Range */}
                        <form onSubmit={handleFilterSubmit} className="mb-6">
                            <h3 className="mb-3 text-sm font-semibold text-gray-900">
                                Fourchette de prix
                            </h3>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={minPrice}
                                    onChange={(e) => setMinPrice(e.target.value)}
                                    placeholder="Min"
                                    min="0"
                                    step="0.01"
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-500 focus:outline-none"
                                />
                                <span className="text-gray-400">-</span>
                                <input
                                    type="number"
                                    value={maxPrice}
                                    onChange={(e) => setMaxPrice(e.target.value)}
                                    placeholder="Max"
                                    min="0"
                                    step="0.01"
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-500 focus:outline-none"
                                />
                            </div>
                            <button
                                type="submit"
                                className="mt-2 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Filtrer
                            </button>
                        </form>
                    </aside>

                    {/* Main Content */}
                    <div className="flex-1">
                        {/* Sort Bar */}
                        <div className="mb-6 flex items-center justify-between">
                            <p className="text-sm text-gray-500">
                                Affichage de {products.from || 0} a {products.to || 0} sur{' '}
                                {products.total} produits
                            </p>
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-gray-600">Trier par :</label>
                                <select
                                    value={filters.sort || 'recent'}
                                    onChange={(e) => handleSortChange(e.target.value)}
                                    className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-500 focus:outline-none"
                                >
                                    <option value="recent">Recents</option>
                                    <option value="price_asc">Prix croissant</option>
                                    <option value="price_desc">Prix decroissant</option>
                                    <option value="name_asc">Nom A-Z</option>
                                </select>
                            </div>
                        </div>

                        {/* Product Grid */}
                        {products.data.length > 0 ? (
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {products.data.map((product) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        settings={settings}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="py-20 text-center">
                                <svg
                                    className="mx-auto h-12 w-12 text-gray-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1}
                                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                                    />
                                </svg>
                                <h3 className="mt-4 text-lg font-medium text-gray-900">
                                    Aucun produit trouve
                                </h3>
                                <p className="mt-2 text-sm text-gray-500">
                                    Essayez de modifier vos filtres ou votre recherche.
                                </p>
                            </div>
                        )}

                        <Pagination products={products} />
                    </div>
                </div>
            </div>
        </FrontLayout>
    );
}
