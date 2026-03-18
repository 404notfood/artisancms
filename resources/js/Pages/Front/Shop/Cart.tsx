import { Head, Link, router } from '@inertiajs/react';
import FrontLayout from '@/Layouts/FrontLayout';
import type { EcommerceSettingsData, MenuData } from '@/types/cms';
import { useState } from 'react';

interface CartItemData {
    id: number; product_id: number; variant_id: number | null;
    name: string; variant_name: string | null; variant_attributes: Record<string, string> | null;
    price: number; quantity: number; total: number; featured_image: string | null; slug: string; stock: number;
}

interface CartPageProps {
    cartItems: CartItemData[]; subtotal: number; tax: number; shipping: number; total: number;
    settings: EcommerceSettingsData; menus: Record<string, MenuData>;
    theme: { customizations: Record<string, string>; layouts: Array<{ slug: string; name: string }> };
}

/** Theme CSS variable tokens used for inline styles */
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

function formatPrice(price: number, symbol: string) { return `${Number(price).toFixed(2)} ${symbol}`; }

function CartRow({ item, settings }: { item: CartItemData; settings: EcommerceSettingsData }) {
    const [qty, setQty] = useState(item.quantity);

    const update = (n: number) => {
        const q = Math.max(1, Math.min(item.stock, n));
        setQty(q);
        router.put(`/cart/${item.id}`, { quantity: q }, { preserveScroll: true });
    };

    return (
        <div className="cart-row" style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '24px', alignItems: 'center', padding: '24px 0', borderBottom: `1px solid ${T.border}` }}>
            {/* Product */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <Link href={`/shop/${item.slug}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '2px', overflow: 'hidden', background: T.surface, flexShrink: 0 }}>
                        {item.featured_image
                            ? <img src={item.featured_image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                              </div>
                        }
                    </div>
                </Link>
                <div>
                    <Link href={`/shop/${item.slug}`} style={{ textDecoration: 'none' }}>
                        <p style={{ fontFamily: T.heading, fontSize: '17px', fontWeight: 600, color: T.text, margin: '0 0 4px', lineHeight: 1.3 }}>{item.name}</p>
                    </Link>
                    {item.variant_name && <p style={{ fontFamily: T.body, fontSize: '12px', color: T.muted, margin: 0 }}>Variante : {item.variant_name}</p>}
                    <button onClick={() => router.delete(`/cart/${item.id}`, { preserveScroll: true })} style={{ background: 'none', border: 'none', padding: 0, marginTop: '8px', cursor: 'pointer', fontFamily: T.body, fontSize: '12px', color: '#c0392b', textDecoration: 'underline' }}>
                        Supprimer
                    </button>
                </div>
            </div>

            {/* Unit price */}
            <div style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: T.body, fontSize: '11px', color: T.muted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>Prix</p>
                <p style={{ fontFamily: T.body, fontSize: '15px', fontWeight: 600, color: T.text }}>{formatPrice(item.price, settings.currency_symbol)}</p>
            </div>

            {/* Qty */}
            <div style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: T.body, fontSize: '11px', color: T.muted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>Qté</p>
                <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${T.border}`, borderRadius: '2px', overflow: 'hidden', background: '#fff' }}>
                    <button onClick={() => update(qty - 1)} style={{ width: '32px', height: '36px', border: 'none', background: 'none', cursor: 'pointer', color: T.muted, fontSize: '16px', lineHeight: 1 }}>−</button>
                    <span style={{ width: '36px', textAlign: 'center', fontFamily: T.body, fontSize: '14px', fontWeight: 600, color: T.text, borderLeft: `1px solid ${T.border}`, borderRight: `1px solid ${T.border}`, lineHeight: '36px' }}>{qty}</span>
                    <button onClick={() => update(qty + 1)} style={{ width: '32px', height: '36px', border: 'none', background: 'none', cursor: 'pointer', color: T.muted, fontSize: '16px', lineHeight: 1 }}>+</button>
                </div>
            </div>

            {/* Total */}
            <div style={{ textAlign: 'right', minWidth: '80px' }}>
                <p style={{ fontFamily: T.body, fontSize: '11px', color: T.muted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>Total</p>
                <p style={{ fontFamily: T.body, fontSize: '16px', fontWeight: 700, color: T.primary }}>{formatPrice(item.price * qty, settings.currency_symbol)}</p>
            </div>
        </div>
    );
}

export default function CartPage({ cartItems, subtotal, tax, shipping, total, settings, menus, theme }: CartPageProps) {
    const [couponCode, setCouponCode] = useState('');
    const [couponMsg, setCouponMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
    const [discount, setDiscount] = useState(0);
    const [applying, setApplying] = useState(false);

    const applyCoupon = async () => {
        if (!couponCode.trim()) return;
        setApplying(true);
        setCouponMsg(null);

        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

        try {
            const response = await fetch('/checkout/apply-coupon', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    Accept: 'application/json',
                },
                body: JSON.stringify({ code: couponCode, subtotal }),
            });
            const result = await response.json();

            if (response.ok && result.success) {
                setDiscount(result.discount);
                setCouponMsg({ type: 'ok', text: result.message });
            } else {
                setCouponMsg({ type: 'err', text: result.message || 'Code invalide.' });
            }
        } catch {
            setCouponMsg({ type: 'err', text: 'Erreur r\u00e9seau.' });
        } finally {
            setApplying(false);
        }
    };

    const adjustedTotal = Math.max(0, total - discount);
    const freeShippingLeft = settings.free_shipping_threshold - subtotal;

    if (cartItems.length === 0) {
        return (
            <FrontLayout menus={menus} theme={theme}>
                <Head title="Panier vide" />
                <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', padding: '80px 24px', fontFamily: T.body }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: T.surface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="1.5">
                            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
                        </svg>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <h2 style={{ fontFamily: T.heading, fontSize: '32px', color: T.text, margin: '0 0 10px' }}>Votre panier est vide</h2>
                        <p style={{ color: T.muted, fontSize: '15px' }}>Découvrez notre collection et ajoutez vos produits préférés.</p>
                    </div>
                    <Link href="/shop" style={{ textDecoration: 'none', background: T.primary, color: '#fff', fontFamily: T.body, fontSize: '13px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '14px 32px', borderRadius: '2px' }}>
                        Voir la boutique
                    </Link>
                </div>
            </FrontLayout>
        );
    }

    return (
        <FrontLayout menus={menus} theme={theme}>
            <Head title="Mon panier" />

            {/* Free shipping bar */}
            {freeShippingLeft > 0 && (
                <div style={{ background: T.gold, padding: '10px 24px', textAlign: 'center' }}>
                    <p style={{ fontFamily: T.body, fontSize: '13px', color: '#fff', margin: 0, fontWeight: 500 }}>
                        Plus que <strong>{freeShippingLeft.toFixed(2)} {settings.currency_symbol}</strong> pour bénéficier de la livraison gratuite 🎁
                    </p>
                </div>
            )}

            <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '48px 24px' }}>
                {/* Title */}
                <div style={{ marginBottom: '40px' }}>
                    <h1 style={{ fontFamily: T.heading, fontSize: 'clamp(28px,4vw,44px)', fontWeight: 600, color: T.text, margin: '0 0 4px' }}>Mon panier</h1>
                    <p style={{ fontFamily: T.body, fontSize: '14px', color: T.muted }}>
                        {cartItems.length} article{cartItems.length !== 1 ? 's' : ''}
                    </p>
                </div>

                <div className="cart-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '48px', alignItems: 'start' }}>
                    {/* Items */}
                    <div>
                        <div style={{ borderTop: `1px solid ${T.border}` }}>
                            {cartItems.map(item => <CartRow key={item.id} item={item} settings={settings} />)}
                        </div>
                        <div style={{ marginTop: '24px' }}>
                            <Link href="/shop" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', fontFamily: T.body, fontSize: '13px', color: T.muted, transition: 'color 0.2s' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
                                Continuer les achats
                            </Link>
                        </div>
                    </div>

                    {/* Summary */}
                    <div style={{ background: T.surface, borderRadius: '2px', padding: '32px', border: `1px solid ${T.border}`, position: 'sticky', top: '100px' }}>
                        <h2 style={{ fontFamily: T.heading, fontSize: '24px', fontWeight: 600, color: T.text, margin: '0 0 24px' }}>Résumé</h2>

                        {/* Coupon */}
                        <div style={{ marginBottom: '24px' }}>
                            <p style={{ fontFamily: T.body, fontSize: '11px', fontWeight: 700, color: T.text, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '10px' }}>Code promo</p>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input type="text" value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} placeholder="PROMO2024" style={{ flex: 1, fontFamily: T.body, fontSize: '13px', color: T.text, border: `1px solid ${T.border}`, borderRadius: '2px', padding: '9px 12px', background: '#fff', outline: 'none' }} />
                                <button onClick={applyCoupon} disabled={applying} style={{ padding: '9px 14px', background: T.primary, color: '#fff', border: 'none', borderRadius: '2px', cursor: applying ? 'wait' : 'pointer', fontFamily: T.body, fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
                                    {applying ? '...' : 'Appliquer'}
                                </button>
                            </div>
                            {couponMsg && <p style={{ fontFamily: T.body, fontSize: '12px', color: couponMsg.type === 'ok' ? '#2d7a2d' : '#c0392b', marginTop: '6px' }}>{couponMsg.text}</p>}
                        </div>

                        {/* Lines */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '16px', borderTop: `1px solid ${T.border}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: T.body, fontSize: '14px' }}>
                                <span style={{ color: T.muted }}>Sous-total</span>
                                <span style={{ color: T.text, fontWeight: 500 }}>{formatPrice(subtotal, settings.currency_symbol)}</span>
                            </div>
                            {discount > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: T.body, fontSize: '14px' }}>
                                    <span style={{ color: '#2d7a2d' }}>Réduction</span>
                                    <span style={{ color: '#2d7a2d', fontWeight: 500 }}>−{formatPrice(discount, settings.currency_symbol)}</span>
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: T.body, fontSize: '14px' }}>
                                <span style={{ color: T.muted }}>TVA ({settings.tax_rate}%)</span>
                                <span style={{ color: T.text, fontWeight: 500 }}>{formatPrice(tax, settings.currency_symbol)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: T.body, fontSize: '14px' }}>
                                <span style={{ color: T.muted }}>Livraison</span>
                                <span style={{ color: shipping === 0 ? '#2d7a2d' : T.text, fontWeight: 500 }}>{shipping === 0 ? 'Gratuite 🎁' : formatPrice(shipping, settings.currency_symbol)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '16px', marginTop: '4px', borderTop: `1px solid ${T.border}` }}>
                                <span style={{ fontFamily: T.heading, fontSize: '20px', fontWeight: 600, color: T.text }}>Total</span>
                                <span style={{ fontFamily: T.heading, fontSize: '22px', fontWeight: 700, color: T.primary }}>{formatPrice(adjustedTotal, settings.currency_symbol)}</span>
                            </div>
                        </div>

                        <Link href="/checkout" style={{
                            display: 'block', marginTop: '24px', width: '100%', textAlign: 'center',
                            background: T.primary, color: '#fff', padding: '15px',
                            fontFamily: T.body, fontSize: '13px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
                            textDecoration: 'none', borderRadius: '2px', transition: 'opacity 0.2s',
                        }}>
                            Commander →
                        </Link>
                        <p style={{ fontFamily: T.body, fontSize: '12px', color: T.muted, textAlign: 'center', marginTop: '12px' }}>
                            🔒 Paiement 100% sécurisé
                        </p>
                    </div>
                </div>
            </div>

            <style>{`
                @media (max-width: 768px) {
                    .cart-layout { grid-template-columns: 1fr !important; }
                    .cart-row { grid-template-columns: 1fr auto !important; }
                }
            `}</style>
        </FrontLayout>
    );
}
