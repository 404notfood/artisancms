import type { BlockRendererProps } from '../block-registry';

interface Testimonial {
    name: string;
    role: string;
    company: string;
    content: string;
    avatar: string;
    rating: number;
}

export default function TestimonialsRenderer({ block }: BlockRendererProps) {
    const items = (block.props.items as Testimonial[]) || [];
    const layout = (block.props.layout as string) || 'grid';
    const columns = (block.props.columns as number) || 2;
    // colorScheme: "dark" forces white text for use on dark backgrounds
    const colorScheme = (block.props.colorScheme as string) || 'auto';
    const isDark = colorScheme === 'dark';
    const textColor = isDark ? 'rgba(255,255,255,0.9)' : 'var(--color-text, #0f172a)';
    const textMuted = isDark ? 'rgba(255,255,255,0.55)' : 'var(--color-text-muted, #64748b)';
    const surfaceColor = isDark ? 'rgba(255,255,255,0.06)' : 'var(--color-surface, rgba(0,0,0,0.03))';
    const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'var(--color-border, rgba(0,0,0,0.07))';

    if (items.length === 0) {
        return (
            <div style={{
                width: '100%',
                padding: '2rem',
                textAlign: 'center',
                color: 'var(--color-text-muted, #94a3b8)',
                border: '2px dashed var(--color-border, rgba(100,116,139,0.2))',
                borderRadius: 'var(--border-radius, 0.5rem)',
            }}>
                Aucun témoignage ajouté
            </div>
        );
    }

    const renderStars = (rating: number) => {
        const stars = Math.min(Math.max(Math.round(rating || 0), 0), 5);
        return (
            <div style={{ display: 'flex', gap: '2px', color: 'var(--color-accent, #f59e0b)', fontSize: '0.875rem' }}>
                {Array.from({ length: 5 }, (_, i) => (
                    <span key={i} style={{ opacity: i < stars ? 1 : 0.25 }}>★</span>
                ))}
            </div>
        );
    };

    const renderCard = (item: Testimonial, index: number) => (
        <div
            key={index}
            style={{
                backgroundColor: surfaceColor,
                border: `1px solid ${borderColor}`,
                borderRadius: 'var(--border-radius, 0.75rem)',
                padding: '1.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
            onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 40px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = '';
                (e.currentTarget as HTMLElement).style.boxShadow = '';
            }}
        >
            {/* Quote mark */}
            <div style={{
                fontFamily: 'Georgia, serif',
                fontSize: '3.5rem',
                lineHeight: 0.8,
                color: 'var(--color-primary, #6366f1)',
                opacity: 0.35,
                marginBottom: '-0.5rem',
            }}>
                "
            </div>

            <p style={{
                fontSize: '0.9375rem',
                lineHeight: 1.7,
                color: textColor,
                opacity: 0.85,
                margin: 0,
                flex: 1,
            }}>
                {item.content}
            </p>

            {item.rating > 0 && renderStars(item.rating)}

            {/* Author */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', paddingTop: '0.75rem', borderTop: `1px solid ${borderColor}` }}>
                {item.avatar ? (
                    <img
                        src={item.avatar}
                        alt={item.name}
                        style={{ width: '2.75rem', height: '2.75rem', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                    />
                ) : (
                    <div style={{
                        width: '2.75rem',
                        height: '2.75rem',
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-primary, #6366f1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '1rem',
                        flexShrink: 0,
                    }}>
                        {(item.name || '?').charAt(0).toUpperCase()}
                    </div>
                )}
                <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: textColor }}>
                        {item.name}
                    </div>
                    {(item.role || item.company) && (
                        <div style={{ fontSize: '0.8rem', color: textMuted }}>
                            {item.role}{item.role && item.company ? ' · ' : ''}{item.company}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    const gridCols: Record<number, string> = {
        1: 'repeat(1, 1fr)',
        2: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
        3: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
    };

    if (layout === 'list') {
        return <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>{items.map(renderCard)}</div>;
    }

    if (layout === 'carousel') {
        return (
            <div style={{ display: 'flex', overflowX: 'auto', gap: '1.25rem', paddingBottom: '0.5rem', scrollSnapType: 'x mandatory' }}>
                {items.map((item, index) => (
                    <div key={index} style={{ flexShrink: 0, width: '340px', scrollSnapAlign: 'start' }}>
                        {renderCard(item, index)}
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div style={{ display: 'grid', gridTemplateColumns: gridCols[columns] || gridCols[2], gap: '1.25rem' }}>
            {items.map(renderCard)}
        </div>
    );
}
