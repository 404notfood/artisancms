import { Link } from '@inertiajs/react';
import { useState } from 'react';
import type { ProductData, EcommerceSettingsData } from '@/types/cms';
import { T, formatPrice } from './shop-helpers';

export default function RelatedCard({ product, settings }: { product: ProductData; settings: EcommerceSettingsData }) {
    const [hovered, setHovered] = useState(false);
    const hasPromo = product.compare_price && product.compare_price > product.price;
    const discount = hasPromo ? Math.round((1 - product.price / product.compare_price!) * 100) : 0;

    return (
        <Link
            href={`/shop/${product.slug}`}
            style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <div style={{
                background: '#fff',
                border: `1px solid ${hovered ? T.primary : 'rgba(26,61,26,0.12)'}`,
                borderRadius: '2px',
                overflow: 'hidden',
                transition: 'border-color 0.25s, box-shadow 0.25s',
                boxShadow: hovered ? '0 8px 24px rgba(26,61,26,0.1)' : '0 1px 4px rgba(26,61,26,0.05)',
            }}>
                <div style={{ position: 'relative', overflow: 'hidden', background: T.surface }}>
                    {product.featured_image ? (
                        <img
                            src={product.featured_image}
                            alt={product.name}
                            style={{
                                width: '100%', aspectRatio: '4/3', objectFit: 'cover',
                                display: 'block', transition: 'transform 0.4s',
                                transform: hovered ? 'scale(1.04)' : 'scale(1)',
                            }}
                        />
                    ) : (
                        <div style={{ aspectRatio: '4/3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                                <circle cx="20" cy="20" r="18" stroke={T.primary} strokeWidth="1" strokeOpacity="0.25"/>
                                <circle cx="15" cy="15" r="3" fill={T.gold} fillOpacity="0.5"/>
                            </svg>
                        </div>
                    )}
                    {hasPromo && (
                        <span style={{
                            position: 'absolute', top: '10px', left: '10px',
                            background: T.gold, color: '#fff',
                            fontSize: '10px', fontWeight: 700, fontFamily: T.body,
                            padding: '3px 7px', borderRadius: '2px', letterSpacing: '0.05em',
                        }}>-{discount}%</span>
                    )}
                </div>
                <div style={{ padding: '14px 16px' }}>
                    <p style={{
                        fontFamily: T.heading, fontSize: '16px', fontWeight: 600,
                        color: T.text, margin: '0 0 8px', lineHeight: 1.3,
                        transition: 'color 0.2s',
                    }}>
                        {product.name}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <span style={{ fontFamily: T.body, fontWeight: 700, fontSize: '15px', color: T.primary }}>
                            {formatPrice(product.price, settings.currency_symbol)}
                        </span>
                        {hasPromo && (
                            <span style={{ fontFamily: T.body, fontSize: '12px', color: '#999', textDecoration: 'line-through' }}>
                                {formatPrice(product.compare_price!, settings.currency_symbol)}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}
