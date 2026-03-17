import type { BlockRendererProps } from '../block-registry';

interface PricingPlan {
    name: string;
    price: string;
    period: string;
    features: string[];
    ctaText: string;
    ctaUrl: string;
    highlighted: boolean;
}

export default function PricingTableRenderer({ block }: BlockRendererProps) {
    const plans = (block.props.plans as PricingPlan[]) || [];
    const columns = (block.props.columns as number) || 3;

    if (plans.length === 0) {
        return (
            <div style={{
                width: '100%',
                padding: '2rem',
                textAlign: 'center',
                color: 'var(--color-text-muted, #94a3b8)',
                border: '2px dashed var(--color-border, rgba(100,116,139,0.2))',
                borderRadius: 'var(--border-radius, 0.5rem)',
            }}>
                Aucun forfait configuré
            </div>
        );
    }

    const gridCols: Record<number, string> = {
        1: 'repeat(1, 1fr)',
        2: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
        3: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: gridCols[columns] || gridCols[3], gap: '1.5rem', alignItems: 'stretch' }}>
            {plans.map((plan, index) => (
                <div
                    key={index}
                    style={{
                        position: 'relative',
                        borderRadius: 'var(--border-radius, 0.875rem)',
                        padding: plan.highlighted ? '2.25rem 1.75rem' : '2rem 1.75rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.25rem',
                        backgroundColor: plan.highlighted
                            ? 'var(--color-primary, #6366f1)'
                            : 'var(--color-surface, rgba(255,255,255,0.04))',
                        border: plan.highlighted
                            ? 'none'
                            : '1px solid var(--color-border, rgba(255,255,255,0.08))',
                        boxShadow: plan.highlighted
                            ? '0 0 50px var(--color-primary, #6366f1)40, 0 20px 40px rgba(0,0,0,0.2)'
                            : 'none',
                        color: plan.highlighted ? '#ffffff' : 'var(--color-text, inherit)',
                        transform: plan.highlighted ? 'scale(1.03)' : 'scale(1)',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                        if (!plan.highlighted) {
                            (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
                            (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 40px rgba(0,0,0,0.12)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!plan.highlighted) {
                            (e.currentTarget as HTMLElement).style.transform = '';
                            (e.currentTarget as HTMLElement).style.boxShadow = '';
                        }
                    }}
                >
                    {/* Popular badge */}
                    {plan.highlighted && (
                        <div style={{
                            position: 'absolute',
                            top: '-0.75rem',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            backgroundColor: 'var(--color-accent, #f59e0b)',
                            color: '#000',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            padding: '0.3rem 0.9rem',
                            borderRadius: '999px',
                            whiteSpace: 'nowrap',
                        }}>
                            Populaire
                        </div>
                    )}

                    {/* Header */}
                    <div>
                        <p style={{
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase',
                            opacity: plan.highlighted ? 0.85 : 0.6,
                            margin: '0 0 0.75rem',
                        }}>
                            {plan.name || 'Forfait'}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                            <span style={{
                                fontFamily: 'var(--font-heading, inherit)',
                                fontSize: '3rem',
                                fontWeight: 800,
                                letterSpacing: '-0.03em',
                                lineHeight: 1,
                            }}>
                                {plan.price}
                            </span>
                            {plan.period && (
                                <span style={{ fontSize: '0.9rem', opacity: 0.6 }}>/{plan.period}</span>
                            )}
                        </div>
                    </div>

                    {/* Divider */}
                    <div style={{
                        height: '1px',
                        backgroundColor: plan.highlighted ? 'rgba(255,255,255,0.2)' : 'var(--color-border, rgba(255,255,255,0.07))',
                    }} />

                    {/* Features */}
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.625rem', flex: 1 }}>
                        {(plan.features || []).map((feature, fi) => (
                            <li key={fi} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', fontSize: '0.9rem', lineHeight: 1.5 }}>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: '2px' }}>
                                    <circle cx="8" cy="8" r="7" fill={plan.highlighted ? 'rgba(255,255,255,0.2)' : 'var(--color-primary, #6366f1)20'} />
                                    <path d="M5 8l2 2 4-4" stroke={plan.highlighted ? '#ffffff' : 'var(--color-primary, #6366f1)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                <span style={{ opacity: 0.85 }}>{feature}</span>
                            </li>
                        ))}
                    </ul>

                    {/* CTA */}
                    {plan.ctaText && (
                        <a
                            href={plan.ctaUrl || '#'}
                            style={{
                                display: 'block',
                                textAlign: 'center',
                                padding: '0.75rem 1.25rem',
                                borderRadius: 'var(--border-radius, 0.5rem)',
                                fontWeight: 600,
                                fontSize: '0.9rem',
                                textDecoration: 'none',
                                transition: 'opacity 0.15s ease, transform 0.15s ease',
                                backgroundColor: plan.highlighted
                                    ? '#ffffff'
                                    : 'var(--color-primary, #6366f1)18',
                                color: plan.highlighted
                                    ? 'var(--color-primary, #6366f1)'
                                    : 'var(--color-primary, #6366f1)',
                                border: plan.highlighted
                                    ? 'none'
                                    : '1px solid var(--color-primary, #6366f1)40',
                            }}
                            onMouseEnter={(e) => {
                                (e.currentTarget as HTMLElement).style.opacity = '0.85';
                                (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.opacity = '1';
                                (e.currentTarget as HTMLElement).style.transform = '';
                            }}
                        >
                            {plan.ctaText}
                        </a>
                    )}
                </div>
            ))}
        </div>
    );
}
