import { useEffect, useRef } from 'react';
import type { BlockRendererProps } from '../block-registry';
import {
    T, ProductCard, SkeletonCard, ShopKeyframes, ShopToast,
    useCartActions, useProductFetch,
} from '../shared/shop-utils';

export default function FeaturedProductsRenderer({ block, isEditing }: BlockRendererProps) {
    const title      = (block.props.title as string)    || 'Produits en vedette';
    const limit      = (block.props.limit as number)    || 4;
    const layout     = (block.props.layout as string)   || 'scroll';
    const showArrows = block.props.showArrows !== false;
    const buttonText = (block.props.buttonText as string) || 'Ajouter';
    const currency   = (block.props.currency as string)   || 'EUR';
    const categoryId = (block.props.category_id as number) || 0;

    const { products, loading, fetchProducts } = useProductFetch(isEditing, limit, categoryId);
    const { addingId, toast, handleAddToCart } = useCartActions();
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    const scroll = (dir: 'left' | 'right') =>
        scrollRef.current?.scrollBy({ left: dir === 'left' ? -280 : 280, behavior: 'smooth' });

    const carouselCardStyle: React.CSSProperties = { minWidth: '220px', maxWidth: '260px', flexShrink: 0, scrollSnapAlign: 'start' };

    // Mode edition
    if (isEditing) {
        return (
            <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontFamily: T.fontHeading, fontSize: '2rem', fontWeight: 600, color: T.text, margin: 0 }}>{title}</h2>
                    <span style={{ fontSize: '0.8rem', color: T.muted, fontFamily: T.fontBody }}>Voir tout &rarr;</span>
                </div>
                <div style={{ display: 'flex', gap: '1rem', overflow: 'hidden' }}>
                    {Array.from({ length: limit }).map((_, i) => <SkeletonCard key={i} style={carouselCardStyle} />)}
                </div>
            </div>
        );
    }

    const cards = loading
        ? Array.from({ length: limit }).map((_, i) => <SkeletonCard key={i} style={carouselCardStyle} />)
        : products.map(p => (
            <ProductCard
                key={p.id} product={p} currency={currency} buttonText={buttonText}
                onAddToCart={handleAddToCart} adding={addingId === p.id}
                style={layout === 'scroll' ? carouselCardStyle : undefined}
            />
        ));

    return (
        <div style={{ position: 'relative' }}>
            <ShopKeyframes />
            <ShopToast toast={toast} />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
                <h2 style={{ fontFamily: T.fontHeading, fontSize: '2rem', fontWeight: 600, color: T.text, margin: 0 }}>
                    {title}
                </h2>
                <a href="/shop" style={{
                    fontSize: '0.82rem', fontWeight: 500, color: T.gold,
                    textDecoration: 'none', fontFamily: T.fontBody,
                    borderBottom: `1px solid ${T.gold}`, paddingBottom: '1px',
                }}>Voir tout &rarr;</a>
            </div>

            {layout === 'scroll' ? (
                <div style={{ position: 'relative' }}>
                    {showArrows && products.length > 0 && (
                        <>
                            <ScrollArrow direction="left" onClick={() => scroll('left')} />
                            <ScrollArrow direction="right" onClick={() => scroll('right')} />
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

function ScrollArrow({ direction, onClick }: { direction: 'left' | 'right'; onClick: () => void }) {
    const isLeft = direction === 'left';
    return (
        <button type="button" onClick={onClick} style={{
            position: 'absolute', [isLeft ? 'left' : 'right']: '-1.25rem', top: '50%',
            transform: 'translateY(-50%)', zIndex: 10,
            background: '#fff', border: `1px solid ${T.border}`,
            borderRadius: '50%', width: '2.5rem', height: '2.5rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', boxShadow: '0 2px 8px rgb(0 0 0 / 0.1)',
            transition: 'box-shadow 150ms',
        }}>
            <svg width="16" height="16" fill="none" stroke={T.text} strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d={isLeft ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'} />
            </svg>
        </button>
    );
}
