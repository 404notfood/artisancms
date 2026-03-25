interface HeroRendererProps {
    block: {
        id: string;
        type: string;
        props: Record<string, unknown>;
        children?: Array<{ id: string; type: string; props: Record<string, unknown> }>;
    };
}

export default function HeroRenderer({ block }: HeroRendererProps) {
    const {
        title = 'ArtisanCMS',
        subtitle = '',
        primaryButtonText = '',
        primaryButtonUrl = '',
        secondaryButtonText = '',
        secondaryButtonUrl = '',
        alignment = 'center',
        minHeight = '90vh',
        showGradient = true,
    } = block.props as Record<string, string | boolean>;

    return (
        <section
            className="artisancms-hero relative flex items-center justify-center overflow-hidden"
            style={{ minHeight: minHeight as string }}
        >
            {showGradient && (
                <div
                    className="absolute inset-0 artisancms-hero-gradient"
                    style={{
                        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 30%, #1e293b 60%, #0f172a 100%)',
                    }}
                >
                    <div className="absolute inset-0 artisancms-hero-orb artisancms-hero-orb-1" />
                    <div className="absolute inset-0 artisancms-hero-orb artisancms-hero-orb-2" />
                    <div className="absolute inset-0 artisancms-hero-orb artisancms-hero-orb-3" />
                    <div className="absolute inset-0 artisancms-hero-grid" />
                </div>
            )}

            <div
                className="relative z-10 mx-auto px-6"
                style={{
                    maxWidth: '900px',
                    textAlign: alignment as 'left' | 'center' | 'right',
                }}
            >
                <h1
                    className="artisancms-hero-title mb-6 text-5xl font-extrabold leading-tight tracking-tight text-white md:text-6xl lg:text-7xl"
                    style={{ fontFamily: 'var(--font-heading)' }}
                >
                    {title as string}
                </h1>

                {subtitle && (
                    <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-slate-300 md:text-xl">
                        {subtitle as string}
                    </p>
                )}

                {(primaryButtonText || secondaryButtonText) && (
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        {primaryButtonText && (
                            <a
                                href={primaryButtonUrl as string}
                                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5"
                            >
                                {primaryButtonText as string}
                            </a>
                        )}
                        {secondaryButtonText && (
                            <a
                                href={secondaryButtonUrl as string}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-600 px-8 py-3.5 text-base font-semibold text-slate-300 transition-all duration-200 hover:border-slate-400 hover:text-white hover:-translate-y-0.5"
                            >
                                {secondaryButtonText as string}
                            </a>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}
