import { useState, useEffect, useCallback } from 'react';
import type { BlockRendererProps } from '../block-registry';

interface Product {
    id: number;
    name: string;
    slug: string;
    price: number;
    compare_price: number | null;
    featured_image: string | null;
    stock: number;
    status: string;
    category: { id: number; name: string } | null;
}

interface Category {
    id: number;
    name: string;
    slug: string;
}

// Thème Terra CBD : vert forêt + or + crème
const T = {
    primary:     'var(--color-primary,     #1a3d1a)',
    primaryLight:'var(--color-primary-light,#2d6a2d)',
    gold:        'var(--color-gold,         #c9a84c)',
    goldLight:   'var(--color-gold-light,   #f0d890)',
    bg:          'var(--color-background,   #fafaf5)',
    surface:     'var(--color-surface,      #f0f5ec)',
    text:        'var(--color-text,         #1a2e1a)',
    muted:       'var(--color-text-muted,   #5a7a5a)',
    border:      'var(--color-border,       #c8ddc8)',
    secondary:   'var(--color-secondary,    #f5f0e8)',
    fontHeading: 'var(--font-heading,       "Cormorant Garamond", Georgia, serif)',
    fontBody:    'var(--font-body,          "DM Sans", system-ui, sans-serif)',
    radius:      'var(--border-radius,      0.5rem)',
    shadow:      'var(--global-shadow-intensity, 0 4px 6px -1px rgb(0 0 0 / 0.1))',
};

const columnClasses: Record<number, string> = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 lg:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
};

function Badge({ children }: { children: React.ReactNode }) {
    return (
        <span style={{
            position: 'absolute', top: '0.75rem', left: '0.75rem',
            background: T.gold, color: '#fff',
            fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em',
            textTransform: 'uppercase' as const,
            padding: '0.2rem 0.55rem', borderRadius: '999px',
            fontFamily: T.fontBody,
        }}>
            {children}
        </span>
    );
}

function ProductCard({
    product, currency, buttonText, onAddToCart, adding,
}: {
    product: Product; currency: string; buttonText: string;
    onAddToCart: (id: number) => void; adding: boolean;
}) {
    const hasDiscount = product.compare_price && product.compare_price > product.price;
    const discountPct = hasDiscount ? Math.round((1 - product.price / product.compare_price!) * 100) : 0;
    const hasImage = !!product.featured_image;

    return (
        <div
            className="group"
            style={{
                background: '#fff', borderRadius: T.radius,
                border: `1px solid ${T.border}`, overflow: 'hidden',
                transition: 'transform 150ms ease, box-shadow 150ms ease',
                fontFamily: T.fontBody,
            }}
            onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px -4px rgb(26 61 26 / 0.12)';
            }}
            onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
            }}
        >
            {/* Image — toujours présente, placeholder si pas d'image */}
            <a href={`/shop/${product.slug}`} style={{ display: 'block', position: 'relative' }}>
                <div style={{
                    width: '100%', aspectRatio: '4/3',
                    overflow: 'hidden', background: T.surface,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    {hasImage ? (
                        <img
                            src={product.featured_image!}
                            alt={product.name}
                            className="group-hover:scale-105"
                            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 400ms ease' }}
                        />
                    ) : (
                        <svg width="36" height="36" fill="none" stroke={T.border} strokeWidth="1.2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round"
                                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                    )}
                </div>
                {hasDiscount && <Badge>-{discountPct}%</Badge>}
            </a>

            {/* Body */}
            <div style={{ padding: '0.7rem 0.85rem 0.85rem' }}>
                {/* Catégorie */}
                {product.category && (
                    <span style={{
                        fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.1em',
                        textTransform: 'uppercase' as const, color: T.muted,
                        display: 'block', marginBottom: '0.2rem',
                    }}>{product.category.name}</span>
                )}

                {/* Nom */}
                <a href={`/shop/${product.slug}`} style={{ textDecoration: 'none' }}>
                    <h3 style={{
                        fontFamily: T.fontHeading, fontSize: '1rem', fontWeight: 600,
                        color: T.text, margin: '0 0 0.35rem', lineHeight: 1.3,
                        display: '-webkit-box', WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
                    }}>{product.name}</h3>
                </a>

                {/* Prix */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', marginBottom: '0.55rem' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: T.primary }}>
                        {product.price.toFixed(2)} {currency}
                    </span>
                    {hasDiscount && (
                        <span style={{ fontSize: '0.7rem', color: T.muted, textDecoration: 'line-through' }}>
                            {product.compare_price!.toFixed(2)} {currency}
                        </span>
                    )}
                </div>

                {/* Bouton pleine largeur compact */}
                {product.stock > 0 ? (
                    <button
                        type="button"
                        onClick={() => onAddToCart(product.id)}
                        disabled={adding}
                        style={{
                            width: '100%', background: T.primary, color: '#fff',
                            border: 'none', borderRadius: T.radius,
                            padding: '0.42rem 0.7rem',
                            fontSize: '0.68rem', fontWeight: 600,
                            letterSpacing: '0.05em', textTransform: 'uppercase' as const,
                            fontFamily: T.fontBody,
                            cursor: adding ? 'not-allowed' : 'pointer',
                            transition: 'background 150ms',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
                            opacity: adding ? 0.7 : 1,
                        }}
                        onMouseEnter={e => !adding && ((e.currentTarget as HTMLElement).style.background = '#2d6a2d')}
                        onMouseLeave={e => !adding && ((e.currentTarget as HTMLElement).style.background = T.primary)}
                    >
                        {adding ? (
                            <svg width="11" height="11" fill="none" viewBox="0 0 24 24" style={{ animation: 'spin 0.8s linear infinite' }}>
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity: 0.25 }} />
                                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" style={{ opacity: 0.75 }} />
                            </svg>
                        ) : (
                            <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                            </svg>
                        )}
                        {adding ? 'Ajout...' : buttonText}
                    </button>
                ) : (
                    <span style={{ fontSize: '0.65rem', color: T.muted, fontStyle: 'italic' }}>Épuisé</span>
                )}
            </div>
        </div>
    );
}

function SkeletonCard() {
    return (
        <div style={{
            background: '#fff', borderRadius: T.radius,
            border: `1px solid ${T.border}`, overflow: 'hidden',
        }}>
            <div style={{ width: '100%', aspectRatio: '4/3', background: T.surface, animation: 'pulse 1.5s ease-in-out infinite' }} />
            <div style={{ padding: '0.6rem 0.8rem 0.8rem' }}>
                <div style={{ height: '0.45rem', background: T.surface, borderRadius: '4px', width: '40%', marginBottom: '0.35rem', animation: 'pulse 1.5s ease-in-out infinite' }} />
                <div style={{ height: '0.9rem', background: T.surface, borderRadius: '4px', width: '80%', marginBottom: '0.3rem', animation: 'pulse 1.5s ease-in-out infinite' }} />
                <div style={{ height: '0.75rem', background: T.surface, borderRadius: '4px', width: '45%', marginBottom: '0.55rem', animation: 'pulse 1.5s ease-in-out infinite' }} />
                <div style={{ height: '1.9rem', background: T.surface, borderRadius: T.radius, animation: 'pulse 1.5s ease-in-out infinite' }} />
            </div>
        </div>
    );
}

export default function ProductGridRenderer({ block, isEditing }: BlockRendererProps) {
    const columns      = (block.props.columns as number)  || 3;
    const limit        = (block.props.limit as number)    || 6;
    const gap          = (block.props.gap as string)      || '1.5rem';
    const showPagination     = block.props.showPagination === true;
    const showCategoryFilter = block.props.showCategoryFilter !== false;
    const buttonText   = (block.props.buttonText as string) || 'Ajouter au panier';
    const currency     = (block.props.currency as string)   || 'EUR';
    const filterCategoryId = (block.props.category_id as number) || 0;

    const [products,       setProducts]       = useState<Product[]>([]);
    const [categories,     setCategories]     = useState<Category[]>([]);
    const [loading,        setLoading]        = useState(false);
    const [activeCategory, setActiveCategory] = useState<number | null>(filterCategoryId || null);
    const [addingId,       setAddingId]       = useState<number | null>(null);
    const [page,           setPage]           = useState(1);
    const [toast,          setToast]          = useState<{ msg: string; ok: boolean } | null>(null);

    const fetchProducts = useCallback(async (categoryId: number | null) => {
        if (isEditing) return;
        setLoading(true);
        try {
            const params = new URLSearchParams({ limit: String(limit) });
            if (categoryId) params.set('category_id', String(categoryId));
            const res = await fetch(`/api/shop/products?${params}`);
            if (res.ok) {
                const data = await res.json();
                setProducts(data.products || []);
                if (data.categories?.length) setCategories(data.categories);
            }
        } catch { /* ignore */ } finally {
            setLoading(false);
        }
    }, [isEditing, limit]);

    useEffect(() => { fetchProducts(activeCategory); }, [fetchProducts, activeCategory]);

    const showToast = (msg: string, ok = true) => {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 2800);
    };

    const handleAddToCart = async (productId: number) => {
        setAddingId(productId);
        try {
            const res = await fetch('/api/shop/cart/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({ product_id: productId, quantity: 1 }),
            });
            if (res.ok) {
                const data = await res.json();
                window.dispatchEvent(new CustomEvent('cart:updated', { detail: { count: data.cart_count } }));
                showToast('Produit ajouté au panier !', true);
            } else {
                showToast('Erreur lors de l\'ajout', false);
            }
        } catch {
            showToast('Erreur réseau', false);
        } finally {
            setAddingId(null);
        }
    };

    const gridCols = columnClasses[columns] || columnClasses[3];

    // Mode édition : skeletons
    if (isEditing) {
        return (
            <div>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gap }} className={`shop-grid-${columns}`}>
                    {Array.from({ length: limit }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
                <p style={{ textAlign: 'center', fontSize: '0.75rem', color: T.muted, marginTop: '0.75rem', fontFamily: T.fontBody }}>
                    Grille produits · {limit} articles · {columns} colonnes
                </p>
            </div>
        );
    }

    return (
        <div style={{ position: 'relative' }}>
            <style>{`
                @keyframes spin{to{transform:rotate(360deg)}}
                @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
                @keyframes slideDown{from{transform:translateY(-8px);opacity:0}to{transform:translateY(0);opacity:1}}
                /* Mobile : 1 colonne */
                @media(max-width:480px){
                    .shop-grid-2,.shop-grid-3,.shop-grid-4{grid-template-columns:1fr!important}
                }
                /* Tablette : 2 colonnes */
                @media(min-width:481px) and (max-width:768px){
                    .shop-grid-3,.shop-grid-4{grid-template-columns:repeat(2,1fr)!important}
                }
                .group:hover img{transform:scale(1.05)}
            `}</style>

            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed', top: '1.25rem', right: '1.25rem', zIndex: 9999,
                    background: toast.ok ? T.primary : '#ef4444',
                    color: '#fff',
                    padding: '0.7rem 1.1rem',
                    borderRadius: T.radius,
                    boxShadow: '0 8px 24px rgb(0 0 0 / 0.18)',
                    fontSize: '0.875rem', fontWeight: 500,
                    fontFamily: T.fontBody,
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    animation: 'slideDown 0.2s ease',
                }}>
                    {toast.ok
                        ? <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                        : <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                    }
                    {toast.msg}
                </div>
            )}

            {/* Filtres catégories */}
            {showCategoryFilter && categories.length > 0 && (
                <div style={{
                    display: 'flex', flexWrap: 'wrap' as const, gap: '0.5rem',
                    marginBottom: '2rem',
                }}>
                    {[{ id: null, name: 'Tous les produits' }, ...categories.map(c => ({ id: c.id, name: c.name }))].map(cat => {
                        const isActive = activeCategory === cat.id;
                        return (
                            <button
                                key={cat.id ?? 'all'}
                                type="button"
                                onClick={() => { setActiveCategory(cat.id); setPage(1); }}
                                style={{
                                    padding: '0.4rem 1.1rem',
                                    borderRadius: '999px',
                                    border: `1.5px solid ${isActive ? T.primary : T.border}`,
                                    background: isActive ? T.primary : 'transparent',
                                    color: isActive ? '#fff' : T.text,
                                    fontSize: '0.82rem', fontWeight: 500,
                                    fontFamily: T.fontBody,
                                    cursor: 'pointer',
                                    transition: 'all 150ms ease',
                                    letterSpacing: '0.02em',
                                }}
                            >
                                {cat.name}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Grille — responsive : 1 col mobile, 2 tablette, N desktop */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                gap,
            }}
                className={`shop-grid-${columns}`}
            >
                {loading
                    ? Array.from({ length: limit }).map((_, i) => <SkeletonCard key={i} />)
                    : products.length > 0
                        ? products.map(p => (
                            <ProductCard
                                key={p.id}
                                product={p}
                                currency={currency}
                                buttonText={buttonText}
                                onAddToCart={handleAddToCart}
                                adding={addingId === p.id}
                            />
                        ))
                        : (
                            <div className={`col-span-${columns}`} style={{
                                textAlign: 'center', padding: '4rem 0',
                                color: T.muted, fontFamily: T.fontBody,
                            }}>
                                <svg width="48" height="48" fill="none" stroke={T.border} strokeWidth="1" viewBox="0 0 24 24" style={{ margin: '0 auto 1rem', display: 'block' }}>
                                    <path strokeLinecap="round" strokeLinejoin="round"
                                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                                Aucun produit disponible
                            </div>
                        )
                }
            </div>

            {/* Pagination */}
            {showPagination && products.length >= limit && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2.5rem' }}>
                    <button type="button" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                        style={{
                            padding: '0.5rem 1.2rem', borderRadius: T.radius,
                            border: `1.5px solid ${T.border}`, background: 'transparent',
                            color: T.text, fontSize: '0.85rem', fontFamily: T.fontBody,
                            cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1,
                        }}>← Précédent</button>
                    <span style={{
                        padding: '0.5rem 1rem', fontSize: '0.85rem',
                        color: T.muted, fontFamily: T.fontBody, display: 'flex', alignItems: 'center',
                    }}>Page {page}</span>
                    <button type="button" onClick={() => setPage(page + 1)}
                        style={{
                            padding: '0.5rem 1.2rem', borderRadius: T.radius,
                            border: `1.5px solid ${T.border}`, background: 'transparent',
                            color: T.text, fontSize: '0.85rem', fontFamily: T.fontBody, cursor: 'pointer',
                        }}>Suivant →</button>
                </div>
            )}
        </div>
    );
}
