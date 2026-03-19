/**
 * Shared e-commerce components and utilities for product block renderers.
 *
 * Extracts the MASSIVE duplication between:
 *   - product-grid-renderer.tsx (419 lines)
 *   - featured-products-renderer.tsx (346 lines)
 *
 * Both had near-identical copies of: Product interface, theme tokens (T),
 * ProductCard, SkeletonCard, Badge, toast logic, handleAddToCart, CSS keyframes.
 */
import { useState, useCallback } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Product {
    id: number;
    name: string;
    slug: string;
    price: number;
    compare_price: number | null;
    featured_image: string | null;
    stock: number;
    status?: string;
    category: { id: number; name: string } | null;
}

export interface ShopCategory {
    id: number;
    name: string;
    slug: string;
}

// ─── Theme Tokens (CSS variable defaults) ────────────────────────────────────

export const T = {
    primary:      'var(--color-primary,      #1a3d1a)',
    primaryLight: 'var(--color-primary-light, #2d6a2d)',
    gold:         'var(--color-gold,          #c9a84c)',
    goldLight:    'var(--color-gold-light,    #f0d890)',
    bg:           'var(--color-background,    #fafaf5)',
    surface:      'var(--color-surface,       #f0f5ec)',
    text:         'var(--color-text,          #1a2e1a)',
    muted:        'var(--color-text-muted,    #5a7a5a)',
    border:       'var(--color-border,        #c8ddc8)',
    secondary:    'var(--color-secondary,     #f5f0e8)',
    fontHeading:  'var(--font-heading,        "Cormorant Garamond", Georgia, serif)',
    fontBody:     'var(--font-body,           "DM Sans", system-ui, sans-serif)',
    radius:       'var(--border-radius,       0.5rem)',
} as const;

// ─── CSS Keyframes (injected once) ───────────────────────────────────────────

export function ShopKeyframes() {
    return (
        <style>{`
            @keyframes spin{to{transform:rotate(360deg)}}
            @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
            @keyframes slideDown{from{transform:translateY(-8px);opacity:0}to{transform:translateY(0);opacity:1}}
        `}</style>
    );
}

// ─── Toast Component ─────────────────────────────────────────────────────────

export interface ToastData {
    msg: string;
    ok: boolean;
}

export function ShopToast({ toast }: { toast: ToastData | null }) {
    if (!toast) return null;
    return (
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
                ? <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                : <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            }
            {toast.msg}
        </div>
    );
}

// ─── Badge ───────────────────────────────────────────────────────────────────

export function Badge({ children }: { children: React.ReactNode }) {
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

// ─── Product Card ────────────────────────────────────────────────────────────

interface ProductCardProps {
    product: Product;
    currency: string;
    buttonText: string;
    onAddToCart: (id: number) => void;
    adding: boolean;
    /** Card width constraints for carousel layout */
    style?: React.CSSProperties;
}

export function ProductCard({ product, currency, buttonText, onAddToCart, adding, style: cardStyle }: ProductCardProps) {
    const hasDiscount = product.compare_price != null && product.compare_price > product.price;
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
                ...cardStyle,
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
                        <ProductPlaceholderIcon />
                    )}
                </div>
                {hasDiscount && <Badge>-{discountPct}%</Badge>}
            </a>

            <div style={{ padding: '0.7rem 0.85rem 0.85rem' }}>
                {product.category && (
                    <span style={{
                        fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.1em',
                        textTransform: 'uppercase' as const, color: T.muted,
                        display: 'block', marginBottom: '0.2rem',
                    }}>{product.category.name}</span>
                )}

                <a href={`/shop/${product.slug}`} style={{ textDecoration: 'none' }}>
                    <h3 style={{
                        fontFamily: T.fontHeading, fontSize: '1rem', fontWeight: 600,
                        color: T.text, margin: '0 0 0.35rem', lineHeight: 1.3,
                        display: '-webkit-box', WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
                    }}>{product.name}</h3>
                </a>

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

                {product.stock > 0 ? (
                    <AddToCartButton
                        onClick={() => onAddToCart(product.id)}
                        adding={adding}
                        buttonText={buttonText}
                    />
                ) : (
                    <span style={{ fontSize: '0.65rem', color: T.muted, fontStyle: 'italic' }}>Epuise</span>
                )}
            </div>
        </div>
    );
}

// ─── Add to Cart Button ──────────────────────────────────────────────────────

function AddToCartButton({ onClick, adding, buttonText }: { onClick: () => void; adding: boolean; buttonText: string }) {
    return (
        <button
            type="button"
            onClick={onClick}
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
    );
}

// ─── Skeleton Card ───────────────────────────────────────────────────────────

export function SkeletonCard({ style: cardStyle }: { style?: React.CSSProperties }) {
    return (
        <div style={{
            background: '#fff', borderRadius: T.radius,
            border: `1px solid ${T.border}`, overflow: 'hidden',
            ...cardStyle,
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

// ─── Placeholder Icon ────────────────────────────────────────────────────────

function ProductPlaceholderIcon() {
    return (
        <svg width="36" height="36" fill="none" stroke={T.border} strokeWidth="1.2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round"
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
    );
}

// ─── Cart API Hook ───────────────────────────────────────────────────────────

export function useCartActions() {
    const [addingId, setAddingId] = useState<number | null>(null);
    const [toast, setToast] = useState<ToastData | null>(null);

    const showToast = (msg: string, ok = true) => {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 2800);
    };

    const handleAddToCart = useCallback(async (productId: number) => {
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
                showToast('Produit ajoute au panier !', true);
            } else {
                showToast('Erreur lors de l\'ajout', false);
            }
        } catch {
            showToast('Erreur reseau', false);
        } finally {
            setAddingId(null);
        }
    }, []);

    return { addingId, toast, handleAddToCart };
}

// ─── Product fetch hook ──────────────────────────────────────────────────────

export function useProductFetch(isEditing: boolean, limit: number, categoryId?: number) {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<ShopCategory[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchProducts = useCallback(async (activeCategoryId?: number | null) => {
        if (isEditing) return;
        setLoading(true);
        try {
            const params = new URLSearchParams({ limit: String(limit) });
            if (activeCategoryId) params.set('category_id', String(activeCategoryId));
            else if (categoryId) params.set('category_id', String(categoryId));
            const res = await fetch(`/api/shop/products?${params}`);
            if (res.ok) {
                const data = await res.json();
                setProducts(data.products || []);
                if (data.categories?.length) setCategories(data.categories);
            }
        } catch { /* ignore */ } finally {
            setLoading(false);
        }
    }, [isEditing, limit, categoryId]);

    return { products, categories, loading, fetchProducts };
}
