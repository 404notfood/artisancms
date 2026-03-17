import type { BlockRendererProps } from '../block-registry';

interface IconBoxItem {
    icon: string;
    title: string;
    description: string;
    link: string;
}

export default function IconBoxRenderer({ block }: BlockRendererProps) {
    const items = (block.props.items as IconBoxItem[]) || [];
    const columns = (block.props.columns as number) || 3;
    const align = (block.props.align as string) || 'center';
    const style = (block.props.style as string) || 'card';

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
                Aucune carte configurée
            </div>
        );
    }

    const gridCols: Record<number, string> = {
        1: 'repeat(1, 1fr)',
        2: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
        3: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
        4: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
    };

    const renderItem = (item: IconBoxItem, index: number) => {
        const isLine = style === 'line';
        const isMinimal = style === 'minimal';

        const cardContent = (
            <div
                key={index}
                style={{
                    padding: isMinimal ? '1.25rem 0' : '1.75rem',
                    borderRadius: isLine ? '0' : `var(--border-radius, 0.75rem)`,
                    border: isLine ? 'none' : isMinimal ? 'none' : '1px solid var(--color-border, rgba(255,255,255,0.07))',
                    borderLeft: isLine ? `3px solid var(--color-primary, #6366f1)` : undefined,
                    backgroundColor: isLine || isMinimal ? 'transparent' : 'var(--color-surface, rgba(255,255,255,0.03))',
                    textAlign: align as React.CSSProperties['textAlign'],
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    paddingLeft: isLine ? '1.25rem' : undefined,
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease',
                    cursor: item.link ? 'pointer' : 'default',
                }}
                onMouseEnter={(e) => {
                    if (!isLine && !isMinimal) {
                        (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
                        (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 32px rgba(0,0,0,0.12)';
                        (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-primary, #6366f1)40';
                    }
                }}
                onMouseLeave={(e) => {
                    if (!isLine && !isMinimal) {
                        (e.currentTarget as HTMLElement).style.transform = '';
                        (e.currentTarget as HTMLElement).style.boxShadow = '';
                        (e.currentTarget as HTMLElement).style.borderColor = '';
                    }
                }}
            >
                {item.icon && (
                    <div style={{
                        display: 'flex',
                        justifyContent: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start',
                    }}>
                        <div style={{
                            width: '3rem',
                            height: '3rem',
                            borderRadius: isLine ? '0.375rem' : `var(--border-radius, 0.5rem)`,
                            backgroundColor: 'var(--color-primary, #6366f1)15',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.5rem',
                            color: 'var(--color-primary, #6366f1)',
                        }}>
                            {item.icon}
                        </div>
                    </div>
                )}
                {item.title && (
                    <h3 style={{
                        fontFamily: 'var(--font-heading, inherit)',
                        fontSize: '1.0625rem',
                        fontWeight: 600,
                        color: 'var(--color-text, inherit)',
                        margin: 0,
                        lineHeight: 1.3,
                    }}>
                        {item.title}
                    </h3>
                )}
                {item.description && (
                    <p style={{
                        fontSize: '0.9rem',
                        lineHeight: 1.65,
                        color: 'var(--color-text, inherit)',
                        opacity: 0.65,
                        margin: 0,
                    }}>
                        {item.description}
                    </p>
                )}
                {item.link && (
                    <span style={{
                        fontSize: '0.85rem',
                        fontWeight: 500,
                        color: 'var(--color-primary, #6366f1)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                    }}>
                        En savoir plus
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M2.5 7h9M8 3.5L11.5 7 8 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </span>
                )}
            </div>
        );

        if (item.link) {
            return (
                <a key={index} href={item.link} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                    {cardContent}
                </a>
            );
        }

        return cardContent;
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: gridCols[columns] || gridCols[3], gap: '1.25rem' }}>
            {items.map(renderItem)}
        </div>
    );
}
