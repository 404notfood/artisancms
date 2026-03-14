import type { BlockRendererProps } from '../block-registry';

export default function HeroRenderer({ block }: BlockRendererProps) {
    const title = (block.props.title as string) || 'Titre principal';
    const subtitle = (block.props.subtitle as string) || '';
    const backgroundImage = block.props.backgroundImage as string;
    const overlay = block.props.overlay !== false;
    const ctaText = (block.props.ctaText as string) || '';

    return (
        <div
            className="relative w-full min-h-[300px] flex items-center justify-center text-center"
            style={{
                backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundColor: backgroundImage ? undefined : '#1f2937',
            }}
        >
            {overlay && <div className="absolute inset-0 bg-black/50" />}
            <div className="relative z-10 px-6 py-12 text-white max-w-2xl">
                <h1 className="text-4xl font-bold mb-4">{title}</h1>
                {subtitle && <p className="text-xl mb-6 opacity-90">{subtitle}</p>}
                {ctaText && (
                    <button type="button" className="bg-blue-600 text-white px-6 py-3 rounded font-medium hover:bg-blue-700 transition-colors">
                        {ctaText}
                    </button>
                )}
            </div>
        </div>
    );
}
