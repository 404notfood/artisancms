import { Head, Link, router } from '@inertiajs/react';
import FrontLayout from '@/Layouts/FrontLayout';
import type {
    ProductData,
    ProductVariantData,
    EcommerceSettingsData,
    MenuData,
} from '@/types/cms';
import { useState } from 'react';
import { T, formatPrice } from './components/shop-helpers';
import { ImageGallery } from './components/ProductGallery';
import RelatedCard from './components/RelatedCard';

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

export default function ShopShow({ product, relatedProducts, settings, menus, theme }: ShopShowProps) {
    const [quantity, setQuantity] = useState(1);
    const [selectedVariant, setSelectedVariant] = useState<ProductVariantData | null>(
        product.variants && product.variants.length > 0 ? product.variants[0] : null,
    );
    const [addedToCart, setAddedToCart] = useState(false);

    const currentPrice = selectedVariant ? selectedVariant.price : product.price;
    const currentComparePrice = product.compare_price;
    const currentStock = selectedVariant ? selectedVariant.stock : product.stock;
    const currentSku = selectedVariant?.sku || product.sku;
    const hasPromo = currentComparePrice && currentComparePrice > currentPrice;
    const discount = hasPromo ? Math.round((1 - currentPrice / currentComparePrice!) * 100) : 0;

    const handleAddToCart = () => {
        router.post('/cart/add', {
            product_id: product.id,
            variant_id: selectedVariant?.id || null,
            quantity,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setAddedToCart(true);
                setTimeout(() => setAddedToCart(false), 2500);
            },
        });
    };

    return (
        <FrontLayout menus={menus} theme={theme}>
            <Head title={`${product.name} - ${settings.store_name}`} />

            <div style={{ background: T.bg, minHeight: '100vh', fontFamily: T.body }}>
                {/* Breadcrumb */}
                <div style={{ borderBottom: '1px solid rgba(26,61,26,0.08)', background: '#fff' }}>
                    <div style={{
                        maxWidth: '1280px', margin: '0 auto',
                        padding: '12px 24px',
                        display: 'flex', alignItems: 'center', gap: '8px',
                        fontSize: '13px', color: '#888',
                    }}>
                            <Link href="/shop" style={{ color: '#888', textDecoration: 'none', transition: 'color 0.2s' }}
                                onMouseEnter={e => (e.currentTarget.style.color = T.primary)}
                                onMouseLeave={e => (e.currentTarget.style.color = '#888')}
                            >Boutique</Link>
                            <span style={{ opacity: 0.4 }}>></span>
                            {product.category && (
                                <>
                                    <Link href={`/shop/category/${product.category.slug}`}
                                        style={{ color: '#888', textDecoration: 'none', transition: 'color 0.2s' }}
                                        onMouseEnter={e => (e.currentTarget.style.color = T.primary)}
                                        onMouseLeave={e => (e.currentTarget.style.color = '#888')}
                                    >{product.category.name}</Link>
                                    <span style={{ opacity: 0.4 }}>></span>
                                </>
                            )}
                            <span style={{ color: T.text, fontWeight: 500 }}>{product.name}</span>
                    </div>
                </div>

                {/* Main product zone */}
                <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '48px 24px' }}>
                    <div className="shop-show-grid" style={{
                        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '64px', alignItems: 'start',
                    }}>
                        <div>
                            <ImageGallery
                                featuredImage={product.featured_image}
                                gallery={product.gallery}
                                productName={product.name}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                            {product.category && (
                                <Link href={`/shop/category/${product.category.slug}`} style={{ textDecoration: 'none' }}>
                                    <span style={{
                                        display: 'inline-block',
                                        fontFamily: T.body, fontSize: '11px', fontWeight: 600,
                                        letterSpacing: '0.15em', textTransform: 'uppercase',
                                        color: T.gold, marginBottom: '14px',
                                    }}>{product.category.name}</span>
                                </Link>
                            )}

                            <h1 style={{
                                fontFamily: T.heading, fontSize: 'clamp(28px, 3.5vw, 44px)',
                                fontWeight: 600, color: T.text, lineHeight: 1.15,
                                margin: '0 0 24px', letterSpacing: '-0.01em',
                            }}>{product.name}</h1>

                            {/* Price block */}
                            <div style={{
                                display: 'flex', alignItems: 'baseline', gap: '12px',
                                padding: '20px 0',
                                borderTop: `1px solid rgba(26,61,26,0.1)`,
                                borderBottom: `1px solid rgba(26,61,26,0.1)`,
                                marginBottom: '24px',
                            }}>
                                <span style={{
                                    fontFamily: T.heading, fontSize: '36px', fontWeight: 600,
                                    color: T.primary, letterSpacing: '-0.01em',
                                }}>
                                    {formatPrice(currentPrice, settings.currency_symbol)}
                                </span>
                                {hasPromo && (
                                    <>
                                        <span style={{ fontFamily: T.body, fontSize: '18px', color: '#aaa', textDecoration: 'line-through' }}>
                                            {formatPrice(currentComparePrice!, settings.currency_symbol)}
                                        </span>
                                        <span style={{
                                            fontFamily: T.body, fontSize: '12px', fontWeight: 700,
                                            background: T.gold, color: '#fff',
                                            padding: '3px 8px', borderRadius: '2px', letterSpacing: '0.05em',
                                        }}>-{discount}%</span>
                                    </>
                                )}
                            </div>

                            {product.description && (
                                <p style={{
                                    fontFamily: T.body, fontSize: '15px', lineHeight: 1.75,
                                    color: '#5a6a5a', margin: '0 0 28px',
                                }}>{product.description}</p>
                            )}

                            {/* Stock & SKU badges */}
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '28px' }}>
                                <span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                                    fontFamily: T.body, fontSize: '13px', fontWeight: 500,
                                    color: currentStock > 0 ? '#2d7a2d' : '#c0392b',
                                    background: currentStock > 0 ? 'rgba(45,122,45,0.08)' : 'rgba(192,57,43,0.08)',
                                    padding: '5px 12px', borderRadius: '20px',
                                }}>
                                    <span style={{
                                        width: '7px', height: '7px', borderRadius: '50%',
                                        background: currentStock > 0 ? '#2d7a2d' : '#c0392b', flexShrink: 0,
                                    }} />
                                    {currentStock > 0 ? `En stock (${currentStock})` : 'Rupture de stock'}
                                </span>
                                {currentSku && (
                                    <span style={{
                                        fontFamily: T.body, fontSize: '13px', color: '#888',
                                        background: 'rgba(26,61,26,0.05)', padding: '5px 12px', borderRadius: '20px',
                                    }}>SKU : {currentSku}</span>
                                )}
                            </div>

                            {/* Variants */}
                            {product.variants && product.variants.length > 0 && (
                                <div style={{ marginBottom: '28px' }}>
                                    <p style={{
                                        fontFamily: T.body, fontSize: '13px', fontWeight: 600,
                                        color: T.text, textTransform: 'uppercase', letterSpacing: '0.08em',
                                        marginBottom: '10px',
                                    }}>Variante</p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {product.variants.map((variant) => (
                                            <button
                                                key={variant.id}
                                                onClick={() => setSelectedVariant(variant)}
                                                disabled={variant.stock <= 0}
                                                style={{
                                                    fontFamily: T.body, fontSize: '13px', fontWeight: 500,
                                                    padding: '8px 18px', borderRadius: '2px',
                                                    border: `1.5px solid ${selectedVariant?.id === variant.id ? T.primary : 'rgba(26,61,26,0.2)'}`,
                                                    background: selectedVariant?.id === variant.id ? T.primary : 'transparent',
                                                    color: selectedVariant?.id === variant.id ? '#fff' : T.text,
                                                    cursor: variant.stock <= 0 ? 'not-allowed' : 'pointer',
                                                    opacity: variant.stock <= 0 ? 0.4 : 1,
                                                    transition: 'all 0.2s',
                                                }}
                                            >
                                                {variant.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Quantity + CTA */}
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'stretch' }}>
                                <div style={{
                                    display: 'flex', alignItems: 'center',
                                    border: `1.5px solid rgba(26,61,26,0.2)`,
                                    borderRadius: '2px', overflow: 'hidden', background: '#fff',
                                }}>
                                    <button
                                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                        style={{
                                            width: '42px', height: '50px', border: 'none', background: 'none',
                                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: T.text, fontSize: '18px', transition: 'background 0.15s',
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.background = T.surface)}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                                    >-</button>
                                    <span style={{
                                        width: '48px', textAlign: 'center',
                                        fontFamily: T.body, fontSize: '15px', fontWeight: 600,
                                        color: T.text, borderLeft: '1px solid rgba(26,61,26,0.12)',
                                        borderRight: '1px solid rgba(26,61,26,0.12)', lineHeight: '50px',
                                    }}>{quantity}</span>
                                    <button
                                        onClick={() => setQuantity(q => Math.min(currentStock, q + 1))}
                                        style={{
                                            width: '42px', height: '50px', border: 'none', background: 'none',
                                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: T.text, fontSize: '18px', transition: 'background 0.15s',
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.background = T.surface)}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                                    >+</button>
                                </div>

                                <button
                                    onClick={handleAddToCart}
                                    disabled={currentStock <= 0}
                                    style={{
                                        flex: 1, height: '52px',
                                        background: addedToCart ? '#2d7a2d' : T.primary,
                                        color: '#fff', border: 'none', borderRadius: '2px',
                                        cursor: currentStock <= 0 ? 'not-allowed' : 'pointer',
                                        fontFamily: T.body, fontSize: '14px', fontWeight: 600,
                                        letterSpacing: '0.08em', textTransform: 'uppercase',
                                        transition: 'background 0.25s, transform 0.15s',
                                        opacity: currentStock <= 0 ? 0.5 : 1,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                    }}
                                    onMouseEnter={e => { if (currentStock > 0 && !addedToCart) e.currentTarget.style.background = '#0f2610'; }}
                                    onMouseLeave={e => { if (!addedToCart) e.currentTarget.style.background = T.primary; }}
                                >
                                    {addedToCart ? (
                                        <>
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                <path d="M3 8l4 4 6-7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                            Ajoute !
                                        </>
                                    ) : (
                                        <>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                                                <line x1="3" y1="6" x2="21" y2="6"/>
                                                <path d="M16 10a4 4 0 01-8 0"/>
                                            </svg>
                                            Ajouter au panier
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Trust badges */}
                            <div className="shop-trust-badges" style={{
                                marginTop: '28px', paddingTop: '24px',
                                borderTop: '1px solid rgba(26,61,26,0.08)',
                                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px',
                            }}>
                                {[
                                    { icon: '\uD83D\uDE9A', label: 'Livraison gratuite', sub: 'des 50 EUR' },
                                    { icon: '\u21A9', label: 'Retours 30j', sub: 'satisfait ou rembourse' },
                                    { icon: '\uD83D\uDD12', label: 'Paiement securise', sub: 'SSL & 3D Secure' },
                                ].map((badge) => (
                                    <div key={badge.label} style={{
                                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                                        textAlign: 'center', gap: '4px',
                                    }}>
                                        <span style={{ fontSize: '20px', lineHeight: 1 }}>{badge.icon}</span>
                                        <span style={{ fontFamily: T.body, fontSize: '12px', fontWeight: 600, color: T.text, lineHeight: 1.3 }}>{badge.label}</span>
                                        <span style={{ fontFamily: T.body, fontSize: '11px', color: '#888', lineHeight: 1.3 }}>{badge.sub}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Related products */}
                {relatedProducts.length > 0 && (
                    <div style={{ borderTop: '1px solid rgba(26,61,26,0.08)', background: T.surface }}>
                        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '56px 24px' }}>
                            <div style={{
                                display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
                                marginBottom: '36px',
                            }}>
                                <h2 style={{
                                    fontFamily: T.heading, fontSize: 'clamp(22px, 2.5vw, 32px)',
                                    fontWeight: 600, color: T.text, margin: 0,
                                }}>Vous aimerez aussi</h2>
                                <Link href="/shop" style={{
                                    fontFamily: T.body, fontSize: '13px', fontWeight: 500,
                                    color: T.gold, textDecoration: 'none', letterSpacing: '0.05em',
                                }}>
                                    Voir tout ->
                                </Link>
                            </div>
                            <div className="shop-related-grid" style={{
                                display: 'grid',
                                gridTemplateColumns: `repeat(${Math.min(relatedProducts.length, 4)}, 1fr)`,
                                gap: '20px',
                            }}>
                                {relatedProducts.map((p) => (
                                    <RelatedCard key={p.id} product={p} settings={settings} />
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @media (max-width: 768px) {
                    .shop-show-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
                    .shop-trust-badges { grid-template-columns: 1fr !important; }
                    .shop-related-grid { grid-template-columns: repeat(2, 1fr) !important; }
                }
                @media (max-width: 480px) {
                    .shop-related-grid { grid-template-columns: 1fr !important; }
                }
            `}</style>
        </FrontLayout>
    );
}
