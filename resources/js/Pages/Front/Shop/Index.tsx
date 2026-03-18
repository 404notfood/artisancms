import { Head, Link, router } from '@inertiajs/react';
import FrontLayout from '@/Layouts/FrontLayout';
import type { ProductData, ProductCategoryData, PaginatedResponse, EcommerceSettingsData, MenuData } from '@/types/cms';
import { FormEvent, useState } from 'react';

interface ShopIndexProps {
    products: PaginatedResponse<ProductData>;
    categories: ProductCategoryData[];
    filters: { search?: string; category?: string; min_price?: string; max_price?: string; sort?: string };
    settings: EcommerceSettingsData;
    menus: Record<string, MenuData>;
    theme: { customizations: Record<string, string>; layouts: Array<{ slug: string; name: string }> };
}

const T = {
    primary: 'var(--color-primary, #1a3d1a)',
    gold:    'var(--color-gold, #c9a84c)',
    bg:      'var(--color-background, #fafaf5)',
    surface: 'var(--color-surface, #f0f5ec)',
    text:    'var(--color-text, #1a2e1a)',
    muted:   '#5a7a5a',
    border:  'rgba(26,61,26,0.12)',
    heading: "var(--font-heading, 'Cormorant Garamond', Georgia, serif)",
    body:    "var(--font-body, 'DM Sans', system-ui, sans-serif)",
};

function fp(p: number, s: string) { return `${Number(p).toFixed(2)} ${s}`; }

function ProductCard({ product, settings }: { product: ProductData; settings: EcommerceSettingsData }) {
    const [hovered, setHovered] = useState(false);
    const [added, setAdded] = useState(false);
    const hasPromo = product.compare_price && product.compare_price > product.price;
    const discount = hasPromo ? Math.round((1 - product.price / product.compare_price!) * 100) : 0;

    const addToCart = (e: React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation();
        if (product.stock <= 0) return;
        router.post('/cart/add', { product_id: product.id, quantity: 1 }, {
            preserveScroll: true,
            onSuccess: () => { setAdded(true); setTimeout(() => setAdded(false), 2000); },
        });
    };

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: '#fff',
                border: `1px solid ${hovered ? T.primary : T.border}`,
                borderRadius: '2px',
                overflow: 'hidden',
                transition: 'border-color 0.25s, box-shadow 0.25s',
                boxShadow: hovered ? '0 12px 32px rgba(26,61,26,0.1)' : '0 1px 4px rgba(26,61,26,0.04)',
                display: 'flex', flexDirection: 'column',
            }}
        >
            <Link href={`/shop/${product.slug}`} style={{ textDecoration: 'none', display: 'block', position: 'relative', overflow: 'hidden', background: T.surface }}>
                {product.featured_image ? (
                    <img src={product.featured_image} alt={product.name} style={{
                        width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block',
                        transition: 'transform 0.5s cubic-bezier(0.25,0.46,0.45,0.94)',
                        transform: hovered ? 'scale(1.06)' : 'scale(1)',
                    }} />
                ) : (
                    <div style={{ aspectRatio: '4/3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                            <circle cx="24" cy="24" r="22" stroke={T.primary} strokeWidth="1" strokeOpacity="0.2"/>
                            <circle cx="18" cy="18" r="4" fill={T.gold} fillOpacity="0.4"/>
                            <path d="M8 36 L18 24 L26 32 L32 22 L42 36Z" fill={T.primary} fillOpacity="0.08"/>
                        </svg>
                    </div>
                )}
                {hasPromo && (
                    <span style={{ position: 'absolute', top: '10px', left: '10px', background: T.gold, color: '#fff', fontSize: '10px', fontWeight: 700, fontFamily: T.body, padding: '3px 8px', borderRadius: '2px', letterSpacing: '0.06em' }}>
                        -{discount}%
                    </span>
                )}
                {product.stock <= 0 && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontFamily: T.body, fontSize: '12px', fontWeight: 600, color: '#888', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Rupture</span>
                    </div>
                )}
            </Link>

            <div style={{ padding: '16px 18px 18px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                {product.category && (
                    <Link href={`/shop/category/${product.category.slug}`} style={{ textDecoration: 'none' }}>
                        <span style={{ fontFamily: T.body, fontSize: '10px', fontWeight: 600, color: T.gold, letterSpacing: '0.15em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                            {product.category.name}
                        </span>
                    </Link>
                )}
                <Link href={`/shop/${product.slug}`} style={{ textDecoration: 'none' }}>
                    <h3 style={{ fontFamily: T.heading, fontSize: '17px', fontWeight: 600, color: T.text, lineHeight: 1.3, margin: '0 0 10px', transition: 'color 0.2s', ...(hovered ? { color: T.primary } : {}) }}>
                        {product.name}
                    </h3>
                </Link>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '14px' }}>
                    <span style={{ fontFamily: T.body, fontSize: '16px', fontWeight: 700, color: T.primary }}>{fp(product.price, settings.currency_symbol)}</span>
                    {hasPromo && <span style={{ fontFamily: T.body, fontSize: '12px', color: '#aaa', textDecoration: 'line-through' }}>{fp(product.compare_price!, settings.currency_symbol)}</span>}
                </div>
                <button
                    onClick={addToCart}
                    disabled={product.stock <= 0}
                    style={{
                        marginTop: 'auto', width: '100%', padding: '10px',
                        background: added ? '#2d7a2d' : (hovered && product.stock > 0 ? T.primary : 'transparent'),
                        color: added || (hovered && product.stock > 0) ? '#fff' : T.primary,
                        border: `1.5px solid ${added ? '#2d7a2d' : T.primary}`,
                        borderRadius: '2px', cursor: product.stock <= 0 ? 'not-allowed' : 'pointer',
                        fontFamily: T.body, fontSize: '12px', fontWeight: 600,
                        letterSpacing: '0.1em', textTransform: 'uppercase',
                        transition: 'all 0.25s', opacity: product.stock <= 0 ? 0.4 : 1,
                    }}
                >
                    {product.stock <= 0 ? 'Indisponible' : added ? '✓ Ajouté' : 'Ajouter au panier'}
                </button>
            </div>
        </div>
    );
}

function Pagination({ products }: { products: PaginatedResponse<ProductData> }) {
    if (products.last_page <= 1) return null;
    return (
        <nav style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '48px' }}>
            {Array.from({ length: products.last_page }, (_, i) => i + 1).map(page => (
                <Link key={page} href={`?page=${page}`} preserveState style={{
                    width: '38px', height: '38px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: '2px', fontSize: '13px', fontFamily: T.body, textDecoration: 'none',
                    fontWeight: page === products.current_page ? 700 : 400,
                    background: page === products.current_page ? T.primary : '#fff',
                    color: page === products.current_page ? '#fff' : T.muted,
                    border: `1px solid ${page === products.current_page ? T.primary : T.border}`,
                    transition: 'all 0.2s',
                }}>{page}</Link>
            ))}
        </nav>
    );
}

export default function ShopIndex({ products, categories, filters, settings, menus, theme }: ShopIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [minPrice, setMinPrice] = useState(filters.min_price || '');
    const [maxPrice, setMaxPrice] = useState(filters.max_price || '');

    const applyFilters = (extra: Record<string, string> = {}) => {
        const params: Record<string, string> = {};
        if (search) params.search = search;
        if (minPrice) params.min_price = minPrice;
        if (maxPrice) params.max_price = maxPrice;
        if (filters.sort) params.sort = filters.sort;
        if (filters.category) params.category = filters.category;
        router.get('/shop', { ...params, ...extra }, { preserveState: true });
    };

    const inputStyle: React.CSSProperties = {
        width: '100%', fontFamily: T.body, fontSize: '13px', color: T.text,
        background: '#fff', border: `1px solid ${T.border}`, borderRadius: '2px',
        padding: '9px 12px', outline: 'none', transition: 'border-color 0.2s',
        boxSizing: 'border-box',
    };

    return (
        <FrontLayout menus={menus} theme={theme}>
            <Head title={`${settings.store_name} - Boutique`} />

            {/* Hero band */}
            <div style={{ background: T.primary, color: '#fff', padding: '48px 24px', textAlign: 'center' }}>
                <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
                    <p style={{ fontFamily: T.body, fontSize: '11px', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: T.gold, marginBottom: '10px' }}>
                        {settings.store_name}
                    </p>
                    <h1 style={{ fontFamily: T.heading, fontSize: 'clamp(32px,5vw,56px)', fontWeight: 600, color: '#fff', margin: 0, lineHeight: 1.1, letterSpacing: '-0.01em' }}>
                        Notre boutique
                    </h1>
                    <p style={{ fontFamily: T.body, fontSize: '15px', color: 'rgba(255,255,255,0.65)', marginTop: '14px' }}>
                        {products.total} produit{products.total !== 1 ? 's' : ''} disponible{products.total !== 1 ? 's' : ''}
                    </p>
                </div>
            </div>

            <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '48px 24px', display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
                {/* Sidebar */}
                <aside style={{ width: '240px', flexShrink: 0, position: 'sticky', top: '100px' }}>
                    {/* Search */}
                    <div style={{ marginBottom: '32px' }}>
                        <p style={{ fontFamily: T.body, fontSize: '11px', fontWeight: 700, color: T.text, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '12px' }}>Rechercher</p>
                        <form onSubmit={(e: FormEvent) => { e.preventDefault(); applyFilters(); }} style={{ display: 'flex', gap: '6px' }}>
                            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Un produit..." style={inputStyle} />
                            <button type="submit" style={{ padding: '9px 12px', background: T.primary, border: 'none', borderRadius: '2px', cursor: 'pointer', color: '#fff', flexShrink: 0 }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                            </button>
                        </form>
                    </div>

                    {/* Categories */}
                    <div style={{ marginBottom: '32px' }}>
                        <p style={{ fontFamily: T.body, fontSize: '11px', fontWeight: 700, color: T.text, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '12px' }}>Catégories</p>
                        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <li>
                                <button onClick={() => applyFilters({ category: '' })} style={{
                                    width: '100%', textAlign: 'left', padding: '8px 12px', borderRadius: '2px', border: 'none', cursor: 'pointer',
                                    fontFamily: T.body, fontSize: '14px', transition: 'all 0.2s',
                                    background: !filters.category ? 'rgba(26,61,26,0.08)' : 'transparent',
                                    color: !filters.category ? T.primary : T.muted,
                                    fontWeight: !filters.category ? 600 : 400,
                                }}>
                                    Tous les produits
                                </button>
                            </li>
                            {categories.map(cat => (
                                <li key={cat.id}>
                                    <button onClick={() => applyFilters({ category: cat.slug })} style={{
                                        width: '100%', textAlign: 'left', padding: '8px 12px', borderRadius: '2px', border: 'none', cursor: 'pointer',
                                        fontFamily: T.body, fontSize: '14px', transition: 'all 0.2s',
                                        background: filters.category === cat.slug ? 'rgba(26,61,26,0.08)' : 'transparent',
                                        color: filters.category === cat.slug ? T.primary : T.muted,
                                        fontWeight: filters.category === cat.slug ? 600 : 400,
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    }}>
                                        <span>{cat.name}</span>
                                        {cat.products_count !== undefined && (
                                            <span style={{ fontSize: '11px', color: '#aaa' }}>{cat.products_count}</span>
                                        )}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Price */}
                    <div>
                        <p style={{ fontFamily: T.body, fontSize: '11px', fontWeight: 700, color: T.text, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '12px' }}>Prix</p>
                        <form onSubmit={(e: FormEvent) => { e.preventDefault(); applyFilters(); }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
                                <input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} placeholder="Min" min="0" step="1" style={{ ...inputStyle, width: '50%' }} />
                                <span style={{ color: T.border, fontSize: '16px', flexShrink: 0 }}>—</span>
                                <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="Max" min="0" step="1" style={{ ...inputStyle, width: '50%' }} />
                            </div>
                            <button type="submit" style={{
                                width: '100%', padding: '9px', background: 'transparent',
                                border: `1.5px solid ${T.primary}`, color: T.primary,
                                borderRadius: '2px', cursor: 'pointer', fontFamily: T.body,
                                fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
                                transition: 'all 0.2s',
                            }}>Filtrer</button>
                        </form>
                    </div>
                </aside>

                {/* Main */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Sort bar */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', paddingBottom: '16px', borderBottom: `1px solid ${T.border}` }}>
                        <span style={{ fontFamily: T.body, fontSize: '13px', color: T.muted }}>
                            {products.from || 0}–{products.to || 0} sur {products.total} produit{products.total !== 1 ? 's' : ''}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontFamily: T.body, fontSize: '12px', color: T.muted }}>Trier :</span>
                            <select value={filters.sort || 'recent'} onChange={e => applyFilters({ sort: e.target.value })} style={{ fontFamily: T.body, fontSize: '13px', color: T.text, border: `1px solid ${T.border}`, borderRadius: '2px', padding: '7px 10px', background: '#fff', cursor: 'pointer', outline: 'none' }}>
                                <option value="recent">Récents</option>
                                <option value="price_asc">Prix croissant</option>
                                <option value="price_desc">Prix décroissant</option>
                                <option value="name_asc">Nom A–Z</option>
                            </select>
                        </div>
                    </div>

                    {/* Grid */}
                    {products.data.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }} className="shop-grid">
                            {products.data.map(p => <ProductCard key={p.id} product={p} settings={settings} />)}
                        </div>
                    ) : (
                        <div style={{ padding: '80px 0', textAlign: 'center' }}>
                            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: T.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                            </div>
                            <h3 style={{ fontFamily: T.heading, fontSize: '22px', color: T.text, marginBottom: '8px' }}>Aucun produit trouvé</h3>
                            <p style={{ fontFamily: T.body, fontSize: '14px', color: T.muted }}>Modifiez vos filtres ou <button onClick={() => router.get('/shop', {}, { preserveState: true })} style={{ background: 'none', border: 'none', color: T.gold, cursor: 'pointer', fontFamily: T.body, fontSize: '14px', textDecoration: 'underline' }}>effacez tous les filtres</button></p>
                        </div>
                    )}

                    <Pagination products={products} />
                </div>
            </div>

            <style>{`
                @media (max-width: 1024px) { aside { display: none !important; } }
                @media (max-width: 768px) { .shop-grid { grid-template-columns: repeat(2, 1fr) !important; } }
                @media (max-width: 480px) { .shop-grid { grid-template-columns: 1fr !important; } }
            `}</style>
        </FrontLayout>
    );
}
