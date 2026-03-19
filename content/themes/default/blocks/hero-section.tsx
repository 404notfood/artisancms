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

    const hasImage = !!backgroundImage;

    return (
        <section
            className="relative min-h-[65vh] flex items-center justify-center px-4 py-24 overflow-hidden"
            style={{
                backgroundImage: hasImage ? `url(${backgroundImage})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundColor: hasImage ? undefined : 'var(--color-primary, #4f46e5)',
            }}
        >
            {/* Gradient overlay for images */}
            {overlay && hasImage && (
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />
            )}

            {/* Subtle gradient overlay for solid color background */}
            {!hasImage && (
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-black/10" />
            )}

            <div
                className={`relative z-10 flex flex-col gap-5 ${alignClass}`}
                style={{ maxWidth: 'var(--container-width, 1280px)', width: '100%' }}
            >
                <h1
                    className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight"
                    style={{ fontFamily: 'var(--font-heading, Inter, sans-serif)' }}
                >
                    {title}
                </h1>

                {subtitle && (
                    <p className="text-lg md:text-xl text-white/85 max-w-2xl leading-relaxed">
                        {subtitle}
                    </p>
                )}

                {buttonText && (
                    <a
                        href={buttonUrl}
                        className="inline-block mt-2 px-8 py-3.5 text-base font-semibold text-white transition-all hover:shadow-lg hover:-translate-y-0.5"
                        style={{
                            backgroundColor: 'var(--color-accent, #f97316)',
                            borderRadius: 'var(--border-radius, 0.625rem)',
                        }}
                    >
                        {buttonText}
                    </a>
                )}
            </div>
        </section>
    );
}
