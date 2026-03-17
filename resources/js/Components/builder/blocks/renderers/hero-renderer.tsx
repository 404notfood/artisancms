import type { BlockRendererProps } from '../block-registry';

export default function HeroRenderer({ block }: BlockRendererProps) {
    const title = (block.props.title as string) || 'Titre principal';
    const subtitle = (block.props.subtitle as string) || '';
    const backgroundImage = block.props.backgroundImage as string;
    const overlay = block.props.overlay !== false;
    const ctaText = (block.props.ctaText as string) || '';
    const ctaUrl = (block.props.ctaUrl as string) || '#';
    const ctaSecondaryText = (block.props.ctaSecondaryText as string) || '';
    const ctaSecondaryUrl = (block.props.ctaSecondaryUrl as string) || '#';
    const alignment = (block.props.alignment as string) || 'center';
    const minHeight = (block.props.minHeight as string) || '520px';
    const eyebrow = (block.props.eyebrow as string) || '';

    const alignClass = alignment === 'left'
        ? 'items-start text-left'
        : alignment === 'right'
            ? 'items-end text-right'
            : 'items-center text-center';

    return (
        <div
            className="relative w-full flex items-center justify-center overflow-hidden"
            style={{
                minHeight,
                backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundColor: backgroundImage ? undefined : 'var(--color-background, #0a0a0a)',
            }}
        >
            {/* Overlay */}
            {overlay && (
                <div
                    className="absolute inset-0"
                    style={{
                        background: backgroundImage
                            ? 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.6) 100%)'
                            : 'transparent',
                    }}
                />
            )}

            {/* Decorative background pattern (no background image) */}
            {!backgroundImage && (
                <>
                    {/* Radial glow */}
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            background: 'radial-gradient(ellipse 80% 60% at 50% 0%, var(--color-primary, #6366f1)18 0%, transparent 70%)',
                            opacity: 0.5,
                        }}
                    />
                    {/* Grid lines */}
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            backgroundImage: `linear-gradient(var(--color-primary, #6366f1)08 1px, transparent 1px),
                                              linear-gradient(90deg, var(--color-primary, #6366f1)08 1px, transparent 1px)`,
                            backgroundSize: '60px 60px',
                        }}
                    />
                </>
            )}

            {/* Content */}
            <div
                className={`relative z-10 flex flex-col px-6 py-20 max-w-4xl w-full mx-auto ${alignClass}`}
                style={{ gap: '1.25rem' }}
            >
                {eyebrow && (
                    <p style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                        color: 'var(--color-primary, #6366f1)',
                        opacity: 0.9,
                    }}>
                        {eyebrow}
                    </p>
                )}

                <h1
                    style={{
                        fontFamily: 'var(--font-heading, inherit)',
                        fontSize: 'clamp(2.25rem, 6vw, 4.5rem)',
                        fontWeight: 800,
                        lineHeight: 1.05,
                        letterSpacing: '-0.03em',
                        color: 'var(--color-hero-text, #ffffff)',
                        margin: 0,
                    }}
                >
                    {title}
                </h1>

                {subtitle && (
                    <p
                        style={{
                            fontSize: 'clamp(1rem, 2vw, 1.25rem)',
                            lineHeight: 1.6,
                            color: 'var(--color-hero-text, #ffffff)',
                            opacity: 0.7,
                            maxWidth: '38rem',
                            margin: alignment === 'center' ? '0 auto' : 0,
                        }}
                    >
                        {subtitle}
                    </p>
                )}

                {(ctaText || ctaSecondaryText) && (
                    <div
                        className={`flex flex-wrap gap-3 mt-2 ${alignment === 'center' ? 'justify-center' : ''}`}
                    >
                        {ctaText && (
                            <a
                                href={ctaUrl}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.75rem 1.75rem',
                                    backgroundColor: 'var(--color-primary, #6366f1)',
                                    color: '#ffffff',
                                    fontWeight: 600,
                                    fontSize: '0.9375rem',
                                    borderRadius: 'var(--border-radius, 0.5rem)',
                                    textDecoration: 'none',
                                    boxShadow: '0 0 30px var(--color-primary, #6366f1)50',
                                    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                                }}
                                onMouseEnter={(e) => {
                                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                                    (e.currentTarget as HTMLElement).style.boxShadow = '0 0 40px var(--color-primary, #6366f1)70';
                                }}
                                onMouseLeave={(e) => {
                                    (e.currentTarget as HTMLElement).style.transform = '';
                                    (e.currentTarget as HTMLElement).style.boxShadow = '0 0 30px var(--color-primary, #6366f1)50';
                                }}
                            >
                                {ctaText}
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </a>
                        )}
                        {ctaSecondaryText && (
                            <a
                                href={ctaSecondaryUrl}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    padding: '0.75rem 1.75rem',
                                    backgroundColor: 'transparent',
                                    color: 'var(--color-hero-text, #ffffff)',
                                    fontWeight: 500,
                                    fontSize: '0.9375rem',
                                    borderRadius: 'var(--border-radius, 0.5rem)',
                                    textDecoration: 'none',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    transition: 'border-color 0.15s ease, background 0.15s ease',
                                }}
                                onMouseEnter={(e) => {
                                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.4)';
                                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)';
                                }}
                                onMouseLeave={(e) => {
                                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.2)';
                                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                                }}
                            >
                                {ctaSecondaryText}
                            </a>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
