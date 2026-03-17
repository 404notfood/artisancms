import type { BlockRendererProps } from '../block-registry';

export default function ButtonRenderer({ block }: BlockRendererProps) {
    const text = (block.props.text as string) || 'Bouton';
    const variant = (block.props.variant as string) || 'primary';
    const size = (block.props.size as string) || 'md';
    const url = (block.props.url as string) || '';
    const target = (block.props.target as string) || '_self';
    const align = (block.props.align as string) || 'left';

    const sizeStyles: Record<string, React.CSSProperties> = {
        sm: { padding: '0.4375rem 1rem', fontSize: '0.8125rem' },
        md: { padding: '0.625rem 1.375rem', fontSize: '0.9375rem' },
        lg: { padding: '0.875rem 2rem', fontSize: '1.0625rem' },
    };

    const baseStyle: React.CSSProperties = {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        borderRadius: 'var(--border-radius, 0.5rem)',
        fontWeight: 600,
        letterSpacing: '0.01em',
        textDecoration: 'none',
        cursor: 'pointer',
        transition: 'opacity 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease',
        border: 'none',
        lineHeight: 1.4,
        ...(sizeStyles[size] || sizeStyles.md),
    };

    const variantStyles: Record<string, React.CSSProperties> = {
        primary: {
            backgroundColor: 'var(--color-primary, #6366f1)',
            color: '#ffffff',
            boxShadow: '0 0 20px var(--color-primary, #6366f1)40',
        },
        secondary: {
            backgroundColor: 'var(--color-secondary, rgba(255,255,255,0.08))',
            color: 'var(--color-text, inherit)',
            border: '1px solid var(--color-border, rgba(255,255,255,0.1))',
        },
        outline: {
            backgroundColor: 'transparent',
            color: 'var(--color-primary, #6366f1)',
            border: '1.5px solid var(--color-primary, #6366f1)',
        },
        ghost: {
            backgroundColor: 'transparent',
            color: 'var(--color-primary, #6366f1)',
        },
    };

    const style = {
        ...baseStyle,
        ...(variantStyles[variant] || variantStyles.primary),
    };

    const handleHover = (e: React.MouseEvent, enter: boolean) => {
        const el = e.currentTarget as HTMLElement;
        if (enter) {
            el.style.opacity = '0.88';
            el.style.transform = 'translateY(-1px)';
        } else {
            el.style.opacity = '1';
            el.style.transform = '';
        }
    };

    const wrapperStyle: React.CSSProperties = {
        display: 'flex',
        justifyContent: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start',
    };

    const content = (
        <>
            {text}
            {variant === 'primary' && (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                    <path d="M2.5 7h9M8 3.5L11.5 7 8 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            )}
        </>
    );

    return (
        <div style={wrapperStyle}>
            {url ? (
                <a
                    href={url}
                    target={target}
                    rel={target === '_blank' ? 'noopener noreferrer' : undefined}
                    style={style}
                    onMouseEnter={(e) => handleHover(e, true)}
                    onMouseLeave={(e) => handleHover(e, false)}
                >
                    {content}
                </a>
            ) : (
                <button
                    type="button"
                    style={style}
                    onMouseEnter={(e) => handleHover(e, true)}
                    onMouseLeave={(e) => handleHover(e, false)}
                >
                    {content}
                </button>
            )}
        </div>
    );
}
