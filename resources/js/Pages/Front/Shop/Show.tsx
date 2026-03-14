import { Head, Link, router } from '@inertiajs/react';
import FrontLayout from '@/Layouts/FrontLayout';
import type {
    ProductData,
    ProductVariantData,
    EcommerceSettingsData,
    MenuData,
} from '@/types/cms';
import { useState } from 'react';

interface ShopShowProps {
    product: ProductData;
    relatedProducts: ProductData[];
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

function ImageGallery({
    featuredImage,
    gallery,
    productName,
}: {
    featuredImage: string | null;
    gallery: string[] | null;
    productName: string;
}) {
    const allImages = [
        ...(featuredImage ? [featuredImage] : []),
        ...(gallery || []),
    ];

    const [selectedIndex, setSelectedIndex] = useState(0);

    if (allImages.length === 0) {
        return (
            <div className="flex aspect-square items-center justify-center rounded-lg bg-gray-100">
                <svg
                    className="h-24 w-24 text-gray-300"
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
        );
    }

    return (
        <div>
            <div className="mb-4 overflow-hidden rounded-lg bg-gray-100">
                <img
                    src={allImages[selectedIndex]}
                    alt={productName}
                    className="h-full w-full object-cover"
                    style={{ aspectRatio: '1/1' }}
                />
            </div>
            {allImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                    {allImages.map((image, index) => (
                        <button
                            key={index}
                            onClick={() => setSelectedIndex(index)}
                            className={`h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border-2 transition-colors ${
                                index === selectedIndex
                                    ? 'border-gray-900'
                                    : 'border-transparent hover:border-gray-300'
                            }`}
                        >
                            <img
                                src={image}
                                alt={`${productName} - ${index + 1}`}
                                className="h-full w-full object-cover"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

function RelatedProductCard({
    product,
    settings,
}: {
    product: ProductData;
    settings: EcommerceSettingsData;
}) {
    return (
        <Link
            href={`/shop/${product.slug}`}
            className="group overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-lg"
        >
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
                            className="h-12 w-12"
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
            </div>
            <div className="p-3">
                <h4 className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                    {product.name}
                </h4>
                <div className="mt-1 flex items-center gap-2">
                    <span className="font-bold text-gray-900">
                        {formatPrice(product.price, settings.currency_symbol)}
                    </span>
                    {product.compare_price && product.compare_price > product.price && (
                        <span className="text-xs text-gray-400 line-through">
                            {formatPrice(product.compare_price, settings.currency_symbol)}
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}

export default function ShopShow({
    product,
    relatedProducts,
    settings,
    menus,
    theme,
}: ShopShowProps) {
    const [quantity, setQuantity] = useState(1);
    const [selectedVariant, setSelectedVariant] = useState<ProductVariantData | null>(
        product.variants && product.variants.length > 0 ? product.variants[0] : null,
    );

    const currentPrice = selectedVariant
        ? selectedVariant.price
        : product.price;

    const currentComparePrice = product.compare_price;

    const currentStock = selectedVariant
        ? selectedVariant.stock
        : product.stock;

    const currentSku = selectedVariant?.sku || product.sku;

    const handleAddToCart = () => {
        router.post(
            '/cart/add',
            {
                product_id: product.id,
                variant_id: selectedVariant?.id || null,
                quantity,
            },
            { preserveScroll: true },
        );
    };

    // Group variant attributes for display
    const variantAttributes: Record<string, Set<string>> = {};
    if (product.variants) {
        for (const variant of product.variants) {
            if (variant.attributes) {
                for (const [key, value] of Object.entries(variant.attributes)) {
                    if (!variantAttributes[key]) {
                        variantAttributes[key] = new Set();
                    }
                    variantAttributes[key].add(value);
                }
            }
        }
    }

    return (
        <FrontLayout menus={menus} theme={theme}>
            <Head title={`${product.name} - ${settings.store_name}`} />

            <div className="container py-8">
                {/* Breadcrumbs */}
                <nav className="mb-6 flex items-center gap-2 text-sm text-gray-500">
                    <Link href="/shop" className="hover:text-gray-700">
                        Boutique
                    </Link>
                    <span>/</span>
                    {product.category && (
                        <>
                            <Link
                                href={`/shop/category/${product.category.slug}`}
                                className="hover:text-gray-700"
                            >
                                {product.category.name}
                            </Link>
                            <span>/</span>
                        </>
                    )}
                    <span className="text-gray-900">{product.name}</span>
                </nav>

                {/* Product Detail */}
                <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
                    {/* Images */}
                    <ImageGallery
                        featuredImage={product.featured_image}
                        gallery={product.gallery}
                        productName={product.name}
                    />

                    {/* Product Info */}
                    <div>
                        {product.category && (
                            <Link
                                href={`/shop/category/${product.category.slug}`}
                                className="mb-2 inline-block text-sm font-medium uppercase tracking-wider text-gray-500 hover:text-gray-700"
                            >
                                {product.category.name}
                            </Link>
                        )}

                        <h1 className="mb-4 text-3xl font-bold text-gray-900">
                            {product.name}
                        </h1>

                        {/* Price */}
                        <div className="mb-6 flex items-center gap-3">
                            <span className="text-3xl font-bold text-gray-900">
                                {formatPrice(currentPrice, settings.currency_symbol)}
                            </span>
                            {currentComparePrice &&
                                currentComparePrice > currentPrice && (
                                    <span className="text-lg text-gray-400 line-through">
                                        {formatPrice(
                                            currentComparePrice,
                                            settings.currency_symbol,
                                        )}
                                    </span>
                                )}
                            {currentComparePrice &&
                                currentComparePrice > currentPrice && (
                                    <span className="rounded bg-red-100 px-2 py-1 text-xs font-bold text-red-700">
                                        -
                                        {Math.round(
                                            ((currentComparePrice - currentPrice) /
                                                currentComparePrice) *
                                                100,
                                        )}
                                        %
                                    </span>
                                )}
                        </div>

                        {/* Description */}
                        {product.description && (
                            <div className="prose prose-sm mb-6 max-w-none text-gray-600">
                                <p>{product.description}</p>
                            </div>
                        )}

                        {/* SKU & Stock */}
                        <div className="mb-6 flex flex-wrap gap-4 text-sm">
                            {currentSku && (
                                <div>
                                    <span className="font-medium text-gray-500">
                                        SKU :{' '}
                                    </span>
                                    <span className="text-gray-900">{currentSku}</span>
                                </div>
                            )}
                            <div>
                                <span className="font-medium text-gray-500">
                                    Disponibilite :{' '}
                                </span>
                                {currentStock > 0 ? (
                                    <span className="font-medium text-green-600">
                                        En stock ({currentStock})
                                    </span>
                                ) : (
                                    <span className="font-medium text-red-600">
                                        Rupture de stock
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Variants */}
                        {product.variants && product.variants.length > 0 && (
                            <div className="mb-6">
                                <label className="mb-2 block text-sm font-semibold text-gray-900">
                                    Variante
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {product.variants.map((variant) => (
                                        <button
                                            key={variant.id}
                                            onClick={() => setSelectedVariant(variant)}
                                            className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                                                selectedVariant?.id === variant.id
                                                    ? 'border-gray-900 bg-gray-900 text-white'
                                                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                                            } ${
                                                variant.stock <= 0
                                                    ? 'cursor-not-allowed opacity-50'
                                                    : ''
                                            }`}
                                            disabled={variant.stock <= 0}
                                        >
                                            {variant.name}
                                            {variant.price !== product.price && (
                                                <span className="ml-1 text-xs">
                                                    (
                                                    {formatPrice(
                                                        variant.price,
                                                        settings.currency_symbol,
                                                    )}
                                                    )
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quantity + Add to Cart */}
                        <div className="flex items-center gap-4">
                            <div className="flex items-center rounded-md border border-gray-300">
                                <button
                                    onClick={() =>
                                        setQuantity((q) => Math.max(1, q - 1))
                                    }
                                    className="px-3 py-2 text-gray-600 hover:text-gray-900"
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                    </svg>
                                </button>
                                <input
                                    type="number"
                                    min="1"
                                    max={currentStock}
                                    value={quantity}
                                    onChange={(e) =>
                                        setQuantity(
                                            Math.max(
                                                1,
                                                Math.min(
                                                    currentStock,
                                                    parseInt(e.target.value) || 1,
                                                ),
                                            ),
                                        )
                                    }
                                    className="w-16 border-x border-gray-300 py-2 text-center text-sm focus:outline-none"
                                />
                                <button
                                    onClick={() =>
                                        setQuantity((q) =>
                                            Math.min(currentStock, q + 1),
                                        )
                                    }
                                    className="px-3 py-2 text-gray-600 hover:text-gray-900"
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                </button>
                            </div>
                            <button
                                onClick={handleAddToCart}
                                disabled={currentStock <= 0}
                                className="flex-1 rounded-md bg-gray-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                            >
                                Ajouter au panier
                            </button>
                        </div>
                    </div>
                </div>

                {/* Related Products */}
                {relatedProducts.length > 0 && (
                    <section className="mt-16">
                        <h2 className="mb-6 text-2xl font-bold text-gray-900">
                            Produits similaires
                        </h2>
                        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                            {relatedProducts.map((relProduct) => (
                                <RelatedProductCard
                                    key={relProduct.id}
                                    product={relProduct}
                                    settings={settings}
                                />
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </FrontLayout>
    );
}
