import type { BlockRendererProps } from '../block-registry';

export default function CtaRenderer({ block }: BlockRendererProps) {
    const title = (block.props.title as string) || 'Titre de l\'appel à l\'action';
    const description = (block.props.description as string) || '';
    const buttonText = (block.props.buttonText as string) || '';
    const buttonUrl = (block.props.buttonUrl as string) || '#';
    const buttonVariant = (block.props.buttonVariant as string) || 'primary';
    const backgroundColor = (block.props.backgroundColor as string) || '';
    const textColor = (block.props.textColor as string) || '';
    const align = (block.props.align as string) || 'center';
    const style = (block.props.style as string) || 'filled';

    const isGradient = style === 'gradient';
    const isBordered = style === 'bordered';

    let bgStyle: React.CSSProperties = {};
    if (isGradient) {
        bgStyle = {
            background: `linear-gradient(135deg, var(--color-primary, #6366f1) 0%, var(--color-secondary, #8b5cf6) 100%)`,
        };
    } else if (isBordered) {
        bgStyle = {
            backgroundColor: 'transparent',
            border: `1px solid var(--color-border, rgba(255,255,255,0.1))`,
        };
    } else if (backgroundColor) {
        bgStyle = { backgroundColor };
    } else {
        bgStyle = { backgroundColor: 'var(--color-primary, #6366f1)' };
    }

    const resolvedTextColor = textColor || '#ffffff';

    const buttonStyles: Record<string, React.CSSProperties> = {
        primary: {
            backgroundColor: '#ffffff',
            color: backgroundColor || 'var(--color-primary, #6366f1)',
            border: 'none',
        },
        secondary: {
            backgroundColor: 'transparent',
            color: resolvedTextColor,
            border: `1px solid rgba(255,255,255,0.35)`,
        },
        outline: {
            backgroundColor: 'transparent',
            color: resolvedTextColor,
            border: `2px solid ${resolvedTextColor}`,
        },
    };

    return (
        <div
            style={{
                ...bgStyle,
                color: resolvedTextColor,
                borderRadius: 'var(--border-radius, 0.75rem)',
                padding: '3.5rem 2.5rem',
                textAlign: align as React.CSSProperties['textAlign'],
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Subtle noise/glow overlay for filled style */}
            {!isBordered && (
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `radial-gradient(ellipse 60% 40% at 50% 0%, rgba(255,255,255,0.12) 0%, transparent 70%)`,
                    pointerEvents: 'none',
                }} />
            )}

            <div style={{ position: 'relative', maxWidth: '42rem', margin: '0 auto' }}>
                <h2
                    style={{
                        fontFamily: 'var(--font-heading, inherit)',
                        fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
                        fontWeight: 700,
                        lineHeight: 1.15,
                        letterSpacing: '-0.02em',
                        margin: '0 0 0.75rem',
                        color: resolvedTextColor,
                    }}
                >
                    {title}
                </h2>

                {description && (
                    <p style={{
                        fontSize: '1.0625rem',
                        lineHeight: 1.65,
                        opacity: 0.8,
                        margin: '0 0 2rem',
                        color: resolvedTextColor,
                    }}>
                        {description}
                    </p>
                )}

                {buttonText && (
                    <a
                        href={buttonUrl}
                        style={{
                            ...buttonStyles[buttonVariant] || buttonStyles.primary,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.8125rem 2rem',
                            borderRadius: 'var(--border-radius, 0.5rem)',
                            fontWeight: 600,
                            fontSize: '0.9375rem',
                            textDecoration: 'none',
                            transition: 'opacity 0.15s ease, transform 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.opacity = '0.88';
                            (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.opacity = '1';
                            (e.currentTarget as HTMLElement).style.transform = '';
                        }}
                    >
                        {buttonText}
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </a>
                )}
            </div>
        </div>
    );
}
