import type { BlockRendererProps } from '../block-registry';

const ALIGNMENT_CLASSES: Record<string, string> = {
    left: 'items-start text-left',
    right: 'items-end text-right',
    center: 'items-center text-center',
};

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
    const bgColor = (block.props.backgroundColor as string) || '';

    const alignClass = ALIGNMENT_CLASSES[alignment] ?? ALIGNMENT_CLASSES.center;

    return (
        <div
            className="relative w-full flex items-center justify-center overflow-hidden"
            style={{
                minHeight,
                backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundColor: backgroundImage ? undefined : bgColor || '#0a0a0a',
            }}
        >
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

            {!backgroundImage && (
                <>
                    {/* Animated gradient orbs */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <div
                            className="absolute"
                            style={{
                                width: '600px',
                                height: '600px',
                                top: '-15%',
                                left: '-5%',
                                background: 'radial-gradient(circle, color-mix(in srgb, var(--color-primary, #3b82f6) 25%, transparent), transparent 70%)',
                                borderRadius: '50%',
                                filter: 'blur(80px)',
                                animation: 'acms-orb-pulse 8s ease-in-out infinite',
                            }}
                        />
                        <div
                            className="absolute"
                            style={{
                                width: '500px',
                                height: '500px',
                                top: '20%',
                                right: '-10%',
                                background: 'radial-gradient(circle, color-mix(in srgb, var(--color-accent, #8b5cf6) 20%, transparent), transparent 70%)',
                                borderRadius: '50%',
                                filter: 'blur(80px)',
                                animation: 'acms-orb-pulse 8s ease-in-out infinite 2.5s',
                            }}
                        />
                        <div
                            className="absolute"
                            style={{
                                width: '400px',
                                height: '400px',
                                bottom: '-5%',
                                left: '30%',
                                background: 'radial-gradient(circle, color-mix(in srgb, var(--color-primary, #3b82f6) 15%, transparent), transparent 70%)',
                                borderRadius: '50%',
                                filter: 'blur(80px)',
                                animation: 'acms-orb-pulse 8s ease-in-out infinite 5s',
                            }}
                        />
                    </div>
                    {/* Grid pattern */}
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            backgroundImage: `linear-gradient(color-mix(in srgb, var(--color-primary, #6366f1) 5%, transparent) 1px, transparent 1px),
                                              linear-gradient(90deg, color-mix(in srgb, var(--color-primary, #6366f1) 5%, transparent) 1px, transparent 1px)`,
                            backgroundSize: '60px 60px',
                            maskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black 20%, transparent 100%)',
                            WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black 20%, transparent 100%)',
                        }}
                    />
                </>
            )}

            <div className={`relative z-10 flex flex-col gap-5 px-6 py-24 max-w-4xl w-full mx-auto ${alignClass}`}>
                {eyebrow && (
                    <div className={`${alignment === 'center' ? 'flex justify-center' : ''}`}>
                        <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            letterSpacing: '0.15em',
                            textTransform: 'uppercase',
                            color: 'color-mix(in srgb, var(--color-primary, #6366f1) 80%, white)',
                            padding: '0.375rem 1rem',
                            borderRadius: '9999px',
                            border: '1px solid color-mix(in srgb, var(--color-primary, #6366f1) 25%, transparent)',
                            backgroundColor: 'color-mix(in srgb, var(--color-primary, #6366f1) 8%, transparent)',
                        }}>
                            {eyebrow}
                        </span>
                    </div>
                )}

                <h1
                    style={{
                        fontFamily: 'var(--font-heading, inherit)',
                        fontSize: 'clamp(2rem, 5vw, 4rem)',
                        fontWeight: 800,
                        lineHeight: 1.08,
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
                            fontSize: 'clamp(0.9375rem, 1.5vw, 1.1875rem)',
                            lineHeight: 1.7,
                            color: 'var(--color-hero-text, #ffffff)',
                            opacity: 0.6,
                            maxWidth: '38rem',
                            margin: alignment === 'center' ? '0 auto' : 0,
                        }}
                    >
                        {subtitle}
                    </p>
                )}

                {(ctaText || ctaSecondaryText) && (
                    <div className={`flex flex-col sm:flex-row flex-wrap gap-3 mt-3 ${alignment === 'center' ? 'justify-center' : ''}`}>
                        {ctaText && (
                            <a
                                href={ctaUrl}
                                className="group"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    padding: '0.875rem 2rem',
                                    background: 'linear-gradient(135deg, var(--color-primary, #3b82f6), var(--color-accent, #8b5cf6))',
                                    color: '#ffffff',
                                    fontWeight: 600,
                                    fontSize: '0.9375rem',
                                    borderRadius: 'var(--border-radius, 0.75rem)',
                                    textDecoration: 'none',
                                    boxShadow: '0 0 30px color-mix(in srgb, var(--color-primary, #3b82f6) 35%, transparent)',
                                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                                    e.currentTarget.style.boxShadow = '0 0 40px color-mix(in srgb, var(--color-primary, #3b82f6) 50%, transparent)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = '';
                                    e.currentTarget.style.boxShadow = '0 0 30px color-mix(in srgb, var(--color-primary, #3b82f6) 35%, transparent)';
                                }}
                            >
                                {ctaText}
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ transition: 'transform 0.2s ease' }} className="group-hover:translate-x-0.5">
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
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    padding: '0.875rem 2rem',
                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                    color: 'var(--color-hero-text, #ffffff)',
                                    fontWeight: 500,
                                    fontSize: '0.9375rem',
                                    borderRadius: 'var(--border-radius, 0.75rem)',
                                    textDecoration: 'none',
                                    border: '1px solid rgba(255,255,255,0.12)',
                                    backdropFilter: 'blur(8px)',
                                    transition: 'border-color 0.2s ease, background 0.2s ease',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
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
