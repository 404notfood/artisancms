import { useState, useEffect } from 'react';
import type { BlockRendererProps } from '../block-registry';
import {
    T, ProductCard, SkeletonCard, ShopKeyframes, ShopToast,
    useCartActions, useProductFetch,
} from '../shared/shop-utils';

const columnClasses: Record<number, string> = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 lg:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
};

export default function ProductGridRenderer({ block, isEditing }: BlockRendererProps) {
    const columns      = (block.props.columns as number)  || 3;
    const limit        = (block.props.limit as number)    || 6;
    const gap          = (block.props.gap as string)      || '1.5rem';
    const showPagination     = block.props.showPagination === true;
    const showCategoryFilter = block.props.showCategoryFilter !== false;
    const buttonText   = (block.props.buttonText as string) || 'Ajouter au panier';
    const currency     = (block.props.currency as string)   || 'EUR';
    const filterCategoryId = (block.props.category_id as number) || 0;

    const [activeCategory, setActiveCategory] = useState<number | null>(filterCategoryId || null);
    const [page, setPage] = useState(1);

    const { products, categories, loading, fetchProducts } = useProductFetch(isEditing, limit, filterCategoryId);
    const { addingId, toast, handleAddToCart } = useCartActions();

    useEffect(() => { fetchProducts(activeCategory); }, [fetchProducts, activeCategory]);

    // Mode edition : skeletons
    if (isEditing) {
        return (
            <div>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gap }} className={`shop-grid-${columns}`}>
                    {Array.from({ length: limit }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
                <p style={{ textAlign: 'center', fontSize: '0.75rem', color: T.muted, marginTop: '0.75rem', fontFamily: T.fontBody }}>
                    Grille produits - {limit} articles - {columns} colonnes
                </p>
            </div>
        );
    }

    return (
        <div style={{ position: 'relative' }}>
            <ShopKeyframes />
            <ShopToast toast={toast} />

            <style>{`
                @media(max-width:480px){
                    .shop-grid-2,.shop-grid-3,.shop-grid-4{grid-template-columns:1fr!important}
                }
                @media(min-width:481px) and (max-width:768px){
                    .shop-grid-3,.shop-grid-4{grid-template-columns:repeat(2,1fr)!important}
                }
                .group:hover img{transform:scale(1.05)}
            `}</style>

            {/* Category filters */}
            {showCategoryFilter && categories.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '0.5rem', marginBottom: '2rem' }}>
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

            {/* Product grid */}
            <div
                style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gap }}
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
                        }}>Precedent</button>
                    <span style={{
                        padding: '0.5rem 1rem', fontSize: '0.85rem',
                        color: T.muted, fontFamily: T.fontBody, display: 'flex', alignItems: 'center',
                    }}>Page {page}</span>
                    <button type="button" onClick={() => setPage(page + 1)}
                        style={{
                            padding: '0.5rem 1.2rem', borderRadius: T.radius,
                            border: `1.5px solid ${T.border}`, background: 'transparent',
                            color: T.text, fontSize: '0.85rem', fontFamily: T.fontBody, cursor: 'pointer',
                        }}>Suivant</button>
                </div>
            )}
        </div>
    );
}
