import { Head, Link, useForm } from '@inertiajs/react';
import FrontLayout from '@/Layouts/FrontLayout';
import type { EcommerceSettingsData, MenuData } from '@/types/cms';
import { FormEvent, useState } from 'react';

interface CartItemSummary {
    id: number; product_id: number; variant_id: number | null;
    name: string; variant_name: string | null;
    price: number; quantity: number; total: number; featured_image: string | null;
}

interface CouponInfo { code: string; type: 'percentage' | 'fixed'; value: number; }

interface CheckoutPageProps {
    cartItems: CartItemSummary[]; subtotal: number; tax: number; shipping: number;
    discount: number; total: number; settings: EcommerceSettingsData; coupon: CouponInfo | null;
    menus: Record<string, MenuData>;
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

interface AddressFormData { first_name: string; last_name: string; address: string; address2: string; city: string; postal_code: string; country: string; phone: string; }

const inputStyle = (hasError = false): React.CSSProperties => ({
    width: '100%', fontFamily: T.body, fontSize: '14px', color: T.text,
    background: '#fff', border: `1px solid ${hasError ? '#c0392b' : T.border}`,
    borderRadius: '2px', padding: '11px 14px', outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s',
});

const labelStyle: React.CSSProperties = {
    display: 'block', fontFamily: T.body, fontSize: '11px', fontWeight: 700,
    color: T.text, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '7px',
};

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
    return (
        <div>
            <label style={labelStyle}>{label}{required && <span style={{ color: T.gold }}> *</span>}</label>
            {children}
            {error && <p style={{ fontFamily: T.body, fontSize: '12px', color: '#c0392b', marginTop: '5px' }}>{error}</p>}
        </div>
    );
}

function AddressForm({ title, prefix, data, errors, onChange }: { title: string; prefix: string; data: AddressFormData; errors: Record<string, string>; onChange: (f: string, v: string) => void }) {
    return (
        <div>
            <h3 style={{ fontFamily: T.heading, fontSize: '22px', fontWeight: 600, color: T.text, margin: '0 0 20px' }}>{title}</h3>
            <div className="checkout-address-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Field label="Prénom" required error={errors[`${prefix}.first_name`]}>
                    <input type="text" value={data.first_name} onChange={e => onChange('first_name', e.target.value)} style={inputStyle(!!errors[`${prefix}.first_name`])} />
                </Field>
                <Field label="Nom" required error={errors[`${prefix}.last_name`]}>
                    <input type="text" value={data.last_name} onChange={e => onChange('last_name', e.target.value)} style={inputStyle(!!errors[`${prefix}.last_name`])} />
                </Field>
                <div style={{ gridColumn: '1 / -1' }}>
                    <Field label="Adresse" required error={errors[`${prefix}.address`]}>
                        <input type="text" value={data.address} onChange={e => onChange('address', e.target.value)} style={inputStyle(!!errors[`${prefix}.address`])} />
                    </Field>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                    <Field label="Complément d'adresse">
                        <input type="text" value={data.address2} onChange={e => onChange('address2', e.target.value)} placeholder="Appartement, bâtiment..." style={inputStyle()} />
                    </Field>
                </div>
                <Field label="Ville" required error={errors[`${prefix}.city`]}>
                    <input type="text" value={data.city} onChange={e => onChange('city', e.target.value)} style={inputStyle(!!errors[`${prefix}.city`])} />
                </Field>
                <Field label="Code postal" required error={errors[`${prefix}.postal_code`]}>
                    <input type="text" value={data.postal_code} onChange={e => onChange('postal_code', e.target.value)} style={inputStyle(!!errors[`${prefix}.postal_code`])} />
                </Field>
                <Field label="Pays" required error={errors[`${prefix}.country`]}>
                    <input type="text" value={data.country} onChange={e => onChange('country', e.target.value)} style={inputStyle(!!errors[`${prefix}.country`])} />
                </Field>
                <Field label="Téléphone">
                    <input type="tel" value={data.phone} onChange={e => onChange('phone', e.target.value)} style={inputStyle()} />
                </Field>
            </div>
        </div>
    );
}

const sectionStyle: React.CSSProperties = {
    background: '#fff', border: `1px solid ${T.border}`, borderRadius: '2px', padding: '32px',
};

export default function CheckoutPage({ cartItems, subtotal, tax, shipping, discount, total, settings, coupon, menus, theme }: CheckoutPageProps) {
    const [billingSame, setBillingSame] = useState(true);
    const { data, setData, post, processing, errors } = useForm({
        shipping_address: { first_name: '', last_name: '', address: '', address2: '', city: '', postal_code: '', country: 'France', phone: '' } as AddressFormData,
        billing_same_as_shipping: true,
        billing_address: { first_name: '', last_name: '', address: '', address2: '', city: '', postal_code: '', country: 'France', phone: '' } as AddressFormData,
        payment_method: 'cod' as string,
        notes: '',
    });

    if (cartItems.length === 0) {
        return (
            <FrontLayout menus={menus} theme={theme}>
                <Head title="Commande" />
                <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', padding: '80px 24px', textAlign: 'center' }}>
                    <h2 style={{ fontFamily: T.heading, fontSize: '32px', color: T.text, margin: 0 }}>Votre panier est vide</h2>
                    <Link href="/shop" style={{ background: T.primary, color: '#fff', padding: '14px 32px', textDecoration: 'none', fontFamily: T.body, fontSize: '13px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: '2px' }}>Voir la boutique</Link>
                </div>
            </FrontLayout>
        );
    }

    // Steps indicator
    const steps = ['Panier', 'Livraison', 'Paiement', 'Confirmation'];

    return (
        <FrontLayout menus={menus} theme={theme}>
            <Head title="Passer commande" />

            {/* Steps */}
            <div style={{ background: '#fff', borderBottom: `1px solid ${T.border}`, padding: '16px 24px' }}>
                <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0' }}>
                    {steps.map((step, i) => (
                        <div key={step} style={{ display: 'flex', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{
                                    width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: i <= 1 ? T.primary : T.border, color: i <= 1 ? '#fff' : T.muted,
                                    fontSize: '12px', fontFamily: T.body, fontWeight: 700,
                                }}>{i + 1}</div>
                                <span style={{ fontFamily: T.body, fontSize: '13px', fontWeight: i === 1 ? 600 : 400, color: i <= 1 ? T.text : T.muted }}>
                                    {step}
                                </span>
                            </div>
                            {i < steps.length - 1 && <div style={{ width: '40px', height: '1px', background: i < 1 ? T.primary : T.border, margin: '0 12px' }} />}
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '48px 24px' }}>
                <h1 style={{ fontFamily: T.heading, fontSize: 'clamp(28px,4vw,40px)', fontWeight: 600, color: T.text, margin: '0 0 36px' }}>Informations de livraison</h1>

                <form onSubmit={(e: FormEvent) => { e.preventDefault(); post('/checkout'); }}>
                    <div className="checkout-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '40px', alignItems: 'start' }}>
                        {/* Left */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {/* Shipping */}
                            <div style={sectionStyle}>
                                <AddressForm
                                    title="Adresse de livraison"
                                    prefix="shipping_address"
                                    data={data.shipping_address}
                                    errors={errors as Record<string, string>}
                                    onChange={(f, v) => setData('shipping_address', { ...data.shipping_address, [f]: v })}
                                />
                            </div>

                            {/* Billing toggle */}
                            <div style={sectionStyle}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={billingSame}
                                        onChange={() => { const next = !billingSame; setBillingSame(next); setData('billing_same_as_shipping', next); }}
                                        style={{ accentColor: T.primary, width: '18px', height: '18px', flexShrink: 0, cursor: 'pointer' }}
                                    />
                                    <span style={{ fontFamily: T.body, fontSize: '14px', color: T.text }}>Adresse de facturation identique à la livraison</span>
                                </label>
                                {!billingSame && (
                                    <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: `1px solid ${T.border}` }}>
                                        <AddressForm
                                            title="Adresse de facturation"
                                            prefix="billing_address"
                                            data={data.billing_address}
                                            errors={errors as Record<string, string>}
                                            onChange={(f, v) => setData('billing_address', { ...data.billing_address, [f]: v })}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Payment */}
                            <div style={sectionStyle}>
                                <h3 style={{ fontFamily: T.heading, fontSize: '22px', fontWeight: 600, color: T.text, margin: '0 0 20px' }}>Mode de paiement</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {[
                                        { value: 'cod', label: 'Paiement à la livraison', sub: 'Réglez en espèces à la réception de votre colis', icon: '💵' },
                                        { value: 'card', label: 'Carte bancaire', sub: 'Paiement sécurisé SSL & 3D Secure', icon: '💳' },
                                    ].map(opt => (
                                        <label key={opt.value} style={{
                                            display: 'flex', alignItems: 'center', gap: '14px',
                                            padding: '16px 20px', borderRadius: '2px', cursor: 'pointer',
                                            border: `1.5px solid ${data.payment_method === opt.value ? T.primary : T.border}`,
                                            background: data.payment_method === opt.value ? 'rgba(26,61,26,0.04)' : '#fff',
                                            transition: 'all 0.2s',
                                        }}>
                                            <input type="radio" name="payment_method" value={opt.value} checked={data.payment_method === opt.value} onChange={e => setData('payment_method', e.target.value)} style={{ accentColor: T.primary, width: '16px', height: '16px', flexShrink: 0 }} />
                                            <span style={{ fontSize: '20px' }}>{opt.icon}</span>
                                            <div>
                                                <p style={{ fontFamily: T.body, fontSize: '14px', fontWeight: 600, color: T.text, margin: '0 0 2px' }}>{opt.label}</p>
                                                <p style={{ fontFamily: T.body, fontSize: '12px', color: T.muted, margin: 0 }}>{opt.sub}</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Notes */}
                            <div style={sectionStyle}>
                                <h3 style={{ fontFamily: T.heading, fontSize: '22px', fontWeight: 600, color: T.text, margin: '0 0 16px' }}>Notes de commande</h3>
                                <textarea
                                    value={data.notes}
                                    onChange={e => setData('notes', e.target.value)}
                                    rows={3}
                                    placeholder="Instructions spéciales pour votre commande (optionnel)"
                                    style={{ ...inputStyle(), resize: 'vertical', fontFamily: T.body }}
                                />
                            </div>
                        </div>

                        {/* Right -- Order summary */}
                        <div className="checkout-summary" style={{ ...sectionStyle, position: 'sticky', top: '100px' }}>
                            <h3 style={{ fontFamily: T.heading, fontSize: '22px', fontWeight: 600, color: T.text, margin: '0 0 20px' }}>Votre commande</h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                                {cartItems.map(item => (
                                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '52px', height: '52px', borderRadius: '2px', overflow: 'hidden', background: T.surface, flexShrink: 0, position: 'relative' }}>
                                            {item.featured_image
                                                ? <img src={item.featured_image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="1"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                                                  </div>
                                            }
                                            <span style={{ position: 'absolute', top: '-6px', right: '-6px', background: T.primary, color: '#fff', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, fontFamily: T.body }}>{item.quantity}</span>
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ fontFamily: T.body, fontSize: '13px', fontWeight: 600, color: T.text, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</p>
                                            {item.variant_name && <p style={{ fontFamily: T.body, fontSize: '11px', color: T.muted, margin: 0 }}>{item.variant_name}</p>}
                                        </div>
                                        <span style={{ fontFamily: T.body, fontSize: '13px', fontWeight: 600, color: T.text, flexShrink: 0 }}>{formatPrice(item.total, settings.currency_symbol)}</span>
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '16px', borderTop: `1px solid ${T.border}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: T.body, fontSize: '13px' }}>
                                    <span style={{ color: T.muted }}>Sous-total</span>
                                    <span style={{ color: T.text }}>{formatPrice(subtotal, settings.currency_symbol)}</span>
                                </div>
                                {discount > 0 && coupon && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: T.body, fontSize: '13px' }}>
                                        <span style={{ color: '#2d7a2d' }}>Réduction ({coupon.code})</span>
                                        <span style={{ color: '#2d7a2d' }}>−{formatPrice(discount, settings.currency_symbol)}</span>
                                    </div>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: T.body, fontSize: '13px' }}>
                                    <span style={{ color: T.muted }}>TVA ({settings.tax_rate}%)</span>
                                    <span style={{ color: T.text }}>{formatPrice(tax, settings.currency_symbol)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: T.body, fontSize: '13px' }}>
                                    <span style={{ color: T.muted }}>Livraison</span>
                                    <span style={{ color: shipping === 0 ? '#2d7a2d' : T.text }}>{shipping === 0 ? 'Gratuite' : formatPrice(shipping, settings.currency_symbol)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '14px', marginTop: '4px', borderTop: `1px solid ${T.border}` }}>
                                    <span style={{ fontFamily: T.heading, fontSize: '20px', fontWeight: 600, color: T.text }}>Total TTC</span>
                                    <span style={{ fontFamily: T.heading, fontSize: '22px', fontWeight: 700, color: T.primary }}>{formatPrice(total, settings.currency_symbol)}</span>
                                </div>
                            </div>

                            <button type="submit" disabled={processing} style={{
                                marginTop: '24px', width: '100%', padding: '15px',
                                background: processing ? T.muted : T.primary, color: '#fff', border: 'none',
                                borderRadius: '2px', cursor: processing ? 'wait' : 'pointer',
                                fontFamily: T.body, fontSize: '13px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
                                transition: 'opacity 0.2s',
                            }}>
                                {processing ? 'Traitement…' : 'Confirmer la commande'}
                            </button>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '12px' }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                                <span style={{ fontFamily: T.body, fontSize: '12px', color: T.muted }}>Paiement sécurisé SSL</span>
                            </div>

                            <Link href="/cart" style={{ display: 'block', textAlign: 'center', marginTop: '14px', fontFamily: T.body, fontSize: '12px', color: T.muted, textDecoration: 'underline' }}>
                                ← Retour au panier
                            </Link>
                        </div>
                    </div>
                </form>
            </div>

            <style>{`
                @media (max-width: 900px) {
                    .checkout-grid { grid-template-columns: 1fr !important; }
                    .checkout-summary { position: static !important; }
                    .checkout-address-grid { grid-template-columns: 1fr !important; }
                }
            `}</style>
        </FrontLayout>
    );
}
