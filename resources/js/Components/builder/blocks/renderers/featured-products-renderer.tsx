import { useState, useEffect, useRef, useCallback } from 'react';
import type { BlockRendererProps } from '../block-registry';

interface Product {
    id: number;
    name: string;
    slug: string;
    price: number;
    compare_price: number | null;
    featured_image: string | null;
    stock: number;
    category: { id: number; name: string } | null;
}

const T = {
    primary:     'var(--color-primary,      #1a3d1a)',
    primaryLight:'var(--color-primary-light, #2d6a2d)',
    gold:        'var(--color-gold,          #c9a84c)',
    bg:          'var(--color-background,    #fafaf5)',
    surface:     'var(--color-surface,       #f0f5ec)',
    text:        'var(--color-text,          #1a2e1a)',
    muted:       'var(--color-text-muted,    #5a7a5a)',
    border:      'var(--color-border,        #c8ddc8)',
    fontHeading: 'var(--font-heading,        "Cormorant Garamond", Georgia, serif)',
    fontBody:    'var(--font-body,           "DM Sans", system-ui, sans-serif)',
    radius:      'var(--border-radius,       0.5rem)',
};

function ProductCard({
    product, currency, buttonText, onAddToCart, adding,
}: {
    product: Product; currency: string; buttonText: string;
    onAddToCart: (id: number) => void; adding: boolean;
}) {
    const hasDiscount = product.compare_price && product.compare_price > product.price;
    const discountPct = hasDiscount ? Math.round((1 - product.price / product.compare_price!) * 100) : 0;

    return (
        <div
            className="group"
            style={{
                minWidth: '220px', maxWidth: '260px', flexShrink: 0,
                background: '#fff',
                borderRadius: T.radius,
                border: `1px solid ${T.border}`,
                overflow: 'hidden',
                scrollSnapAlign: 'start',
                transition: 'transform 150ms ease, box-shadow 150ms ease',
                fontFamily: T.fontBody,
            }}
            onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 32px -4px rgb(26 61 26 / 0.15)';
            }}
            onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
            }}
        >
            <a href={`/shop/${product.slug}`} style={{ display: 'block', position: 'relative' }}>
                <div style={{
                    width: '100%', aspectRatio: '1/1',
                    background: T.surface,
                    overflow: 'hidden',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    {product.featured_image ? (
                        <img
                            src={product.featured_image}
                            alt={product.name}
                            className="group-hover:scale-105"
                            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 400ms ease' }}
                        />
                    ) : (
                        <svg width="40" height="40" fill="none" stroke={T.border} strokeWidth="1.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round"
                                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                    )}
                </div>
                {hasDiscount && (
                    <span style={{
                        position: 'absolute', top: '0.65rem', left: '0.65rem',
                        background: T.gold, color: '#fff',
                        fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.07em',
                        textTransform: 'uppercase' as const,
                        padding: '0.18rem 0.5rem', borderRadius: '999px',
                    }}>-{discountPct}%</span>
                )}
            </a>

            <div style={{ padding: '0.85rem 1rem 1rem' }}>
                {product.category && (
                    <span style={{
                        fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.09em',
                        textTransform: 'uppercase' as const, color: T.muted,
                        display: 'block', marginBottom: '0.25rem',
                    }}>{product.category.name}</span>
                )}
                <a href={`/shop/${product.slug}`} style={{ textDecoration: 'none' }}>
                    <h4 style={{
                        fontFamily: T.fontHeading,
                        fontSize: '1.05rem', fontWeight: 600,
                        color: T.text, margin: '0 0 0.5rem',
                        lineHeight: 1.3,
                        display: '-webkit-box', WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
                    }}>{product.name}</h4>
                </a>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '1.05rem', fontWeight: 700, color: T.primary }}>
                        {product.price.toFixed(2)} {currency}
                    </span>
                    {hasDiscount && (
                        <span style={{ fontSize: '0.8rem', color: T.muted, textDecoration: 'line-through' }}>
                            {product.compare_price!.toFixed(2)} {currency}
                        </span>
                    )}
                </div>

                {product.stock > 0 ? (
                    <button
                        type="button"
                        onClick={() => onAddToCart(product.id)}
                        disabled={adding}
                        style={{
                            width: '100%', background: T.primary, color: '#fff',
                            border: 'none', borderRadius: T.radius,
                            padding: '0.55rem 0.8rem',
                            fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em',
                            textTransform: 'uppercase' as const, fontFamily: T.fontBody,
                            cursor: adding ? 'not-allowed' : 'pointer',
                            transition: 'background 150ms',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
                        }}
                    >
                        {adding ? (
                            <>
                                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" style={{ animation: 'spin 0.8s linear infinite' }}>
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity: 0.25 }} />
                                    <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" style={{ opacity: 0.75 }} />
                                </svg>
                                Ajout...
                            </>
                        ) : buttonText}
                    </button>
                ) : (
                    <button type="button" disabled style={{
                        width: '100%', background: T.surface,
                        color: T.muted, border: `1px solid ${T.border}`,
                        borderRadius: T.radius, padding: '0.55rem 0.8rem',
                        fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em',
                        textTransform: 'uppercase' as const, fontFamily: T.fontBody,
                        cursor: 'not-allowed',
                    }}>Épuisé</button>
                )}
            </div>
        </div>
    );
}

function SkeletonCard() {
    return (
        <div style={{
            minWidth: '220px', maxWidth: '260px', flexShrink: 0,
            background: '#fff', borderRadius: T.radius, border: `1px solid ${T.border}`, overflow: 'hidden',
        }}>
            <div style={{ width: '100%', aspectRatio: '1/1', background: T.surface, animation: 'pulse 1.5s ease-in-out infinite' }} />
            <div style={{ padding: '0.85rem 1rem 1rem' }}>
                <div style={{ height: '0.45rem', background: T.surface, borderRadius: '4px', width: '35%', marginBottom: '0.4rem', animation: 'pulse 1.5s ease-in-out infinite' }} />
                <div style={{ height: '1rem', background: T.surface, borderRadius: '4px', width: '85%', marginBottom: '0.35rem', animation: 'pulse 1.5s ease-in-out infinite' }} />
                <div style={{ height: '0.85rem', background: T.surface, borderRadius: '4px', width: '50%', marginBottom: '0.75rem', animation: 'pulse 1.5s ease-in-out infinite' }} />
                <div style={{ height: '2.1rem', background: T.surface, borderRadius: T.radius, animation: 'pulse 1.5s ease-in-out infinite' }} />
            </div>
        </div>
    );
}

export default function FeaturedProductsRenderer({ block, isEditing }: BlockRendererProps) {
    const title      = (block.props.title as string)    || 'Produits en vedette';
    const limit      = (block.props.limit as number)    || 4;
    const layout     = (block.props.layout as string)   || 'scroll';
    const showArrows = block.props.showArrows !== false;
    const buttonText = (block.props.buttonText as string) || 'Ajouter';
    const currency   = (block.props.currency as string)   || 'EUR';
    const categoryId = (block.props.category_id as number) || 0;

    const [products, setProducts]   = useState<Product[]>([]);
    const [loading, setLoading]     = useState(false);
    const [addingId, setAddingId]   = useState<number | null>(null);
    const [toast, setToast]         = useState<{ msg: string; ok: boolean } | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const fetchProducts = useCallback(async () => {
        if (isEditing) return;
        setLoading(true);
        try {
            const params = new URLSearchParams({ limit: String(limit) });
            if (categoryId) params.set('category_id', String(categoryId));
            const res = await fetch(`/api/shop/products?${params}`);
            if (res.ok) {
                const data = await res.json();
                setProducts(data.products || []);
            }
        } catch { /* ignore */ } finally {
            setLoading(false);
        }
    }, [isEditing, limit, categoryId]);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

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
            }
        } catch { showToast('Erreur réseau', false); } finally {
            setAddingId(null);
        }
    };

    const scroll = (dir: 'left' | 'right') =>
        scrollRef.current?.scrollBy({ left: dir === 'left' ? -280 : 280, behavior: 'smooth' });

    // Mode édition
    if (isEditing) {
        return (
            <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontFamily: T.fontHeading, fontSize: '2rem', fontWeight: 600, color: T.text, margin: 0 }}>{title}</h2>
                    <span style={{ fontSize: '0.8rem', color: T.muted, fontFamily: T.fontBody }}>Voir tout →</span>
                </div>
                <div style={{ display: 'flex', gap: '1rem', overflow: 'hidden' }}>
                    {Array.from({ length: limit }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
            </div>
        );
    }

    const cards = loading
        ? Array.from({ length: limit }).map((_, i) => <SkeletonCard key={i} />)
        : products.map(p => (
            <ProductCard
                key={p.id} product={p} currency={currency} buttonText={buttonText}
                onAddToCart={handleAddToCart} adding={addingId === p.id}
            />
        ));

    return (
        <div style={{ position: 'relative' }}>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}@keyframes slideDown{from{transform:translateY(-8px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>

            {toast && (
                <div style={{
                    position: 'fixed', top: '1.25rem', right: '1.25rem', zIndex: 9999,
                    background: toast.ok ? T.primary : '#ef4444', color: '#fff',
                    padding: '0.7rem 1.1rem', borderRadius: T.radius,
                    boxShadow: '0 8px 24px rgb(0 0 0 / 0.18)',
                    fontSize: '0.875rem', fontWeight: 500, fontFamily: T.fontBody,
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    animation: 'slideDown 0.2s ease',
                }}>
                    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
                <h2 style={{ fontFamily: T.fontHeading, fontSize: '2rem', fontWeight: 600, color: T.text, margin: 0 }}>
                    {title}
                </h2>
                <a href="/shop" style={{
                    fontSize: '0.82rem', fontWeight: 500, color: T.gold,
                    textDecoration: 'none', fontFamily: T.fontBody,
                    borderBottom: `1px solid ${T.gold}`, paddingBottom: '1px',
                }}>Voir tout →</a>
            </div>

            {layout === 'scroll' ? (
                <div style={{ position: 'relative' }}>
                    {showArrows && products.length > 0 && (
                        <>
                            <button type="button" onClick={() => scroll('left')} style={{
                                position: 'absolute', left: '-1.25rem', top: '50%',
                                transform: 'translateY(-50%)', zIndex: 10,
                                background: '#fff', border: `1px solid ${T.border}`,
                                borderRadius: '50%', width: '2.5rem', height: '2.5rem',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', boxShadow: '0 2px 8px rgb(0 0 0 / 0.1)',
                                transition: 'box-shadow 150ms',
                            }}>
                                <svg width="16" height="16" fill="none" stroke={T.text} strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <button type="button" onClick={() => scroll('right')} style={{
                                position: 'absolute', right: '-1.25rem', top: '50%',
                                transform: 'translateY(-50%)', zIndex: 10,
                                background: '#fff', border: `1px solid ${T.border}`,
                                borderRadius: '50%', width: '2.5rem', height: '2.5rem',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', boxShadow: '0 2px 8px rgb(0 0 0 / 0.1)',
                            }}>
                                <svg width="16" height="16" fill="none" stroke={T.text} strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </>
                    )}
                    <div ref={scrollRef} style={{
                        display: 'flex', gap: '1.25rem',
                        overflowX: 'auto', paddingBottom: '0.75rem',
                        scrollSnapType: 'x mandatory',
                        scrollbarWidth: 'none',
                    }}>
                        {cards}
                    </div>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
                    {cards}
                </div>
            )}
        </div>
    );
}
