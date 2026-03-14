interface HeroSectionProps {
    title?: string;
    subtitle?: string;
    buttonText?: string;
    buttonUrl?: string;
    backgroundImage?: string;
    alignment?: 'left' | 'center' | 'right';
    overlay?: boolean;
}

export default function HeroSection({
    title = 'Bienvenue',
    subtitle = '',
    buttonText = '',
    buttonUrl = '#',
    backgroundImage = '',
    alignment = 'center',
    overlay = true,
}: HeroSectionProps) {
    const alignClass = {
        left: 'text-left items-start',
        center: 'text-center items-center',
        right: 'text-right items-end',
    }[alignment];

    return (
        <section
            className="relative min-h-[60vh] flex items-center justify-center px-4 py-20"
            style={{
                backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundColor: backgroundImage ? undefined : 'var(--color-primary, #3b82f6)',
            }}
        >
            {overlay && backgroundImage && (
                <div className="absolute inset-0 bg-black/40" />
            )}

            <div
                className={`relative z-10 flex flex-col gap-4 ${alignClass}`}
                style={{ maxWidth: 'var(--container-width, 1280px)', width: '100%' }}
            >
                <h1
                    className="text-4xl md:text-5xl lg:text-6xl font-bold text-white"
                    style={{ fontFamily: 'var(--font-heading, Inter, sans-serif)' }}
                >
                    {title}
                </h1>

                {subtitle && (
                    <p className="text-lg md:text-xl text-white/90 max-w-2xl">
                        {subtitle}
                    </p>
                )}

                {buttonText && (
                    <a
                        href={buttonUrl}
                        className="inline-block mt-4 px-8 py-3 text-lg font-semibold text-white transition-colors"
                        style={{
                            backgroundColor: 'var(--color-accent, #f59e0b)',
                            borderRadius: 'var(--border-radius, 0.5rem)',
                        }}
                    >
                        {buttonText}
                    </a>
                )}
            </div>
        </section>
    );
}
