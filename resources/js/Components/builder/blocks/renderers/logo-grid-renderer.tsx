import type { BlockRendererProps } from '../block-registry';

interface Logo {
    src: string;
    alt: string;
    url?: string;
}

export default function LogoGridRenderer({ block }: BlockRendererProps) {
    const logos = (block.props.logos as Logo[]) || [];
    const columns = (block.props.columns as number) || 4;
    const grayscale = block.props.grayscale !== false;
    const gap = parseInt((block.props.gap as string) || '6', 10);
    const logoHeight = (block.props.logoHeight as string) || '2.5rem';

    if (logos.length === 0) {
        return (
            <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                <p className="text-sm">Aucun logo ajouté</p>
            </div>
        );
    }

    const renderLogo = (logo: Logo, index: number) => {
        const img = (
            <img
                src={logo.src}
                alt={logo.alt}
                style={{
                    maxHeight: logoHeight,
                    width: 'auto',
                    objectFit: 'contain',
                    filter: grayscale ? 'grayscale(1) brightness(0.7)' : undefined,
                    opacity: grayscale ? 0.5 : 1,
                    transition: 'filter 0.3s ease, opacity 0.3s ease',
                }}
                onMouseEnter={(e) => {
                    if (grayscale) {
                        e.currentTarget.style.filter = 'grayscale(0)';
                        e.currentTarget.style.opacity = '1';
                    }
                }}
                onMouseLeave={(e) => {
                    if (grayscale) {
                        e.currentTarget.style.filter = 'grayscale(1) brightness(0.7)';
                        e.currentTarget.style.opacity = '0.5';
                    }
                }}
            />
        );

        const wrapperStyle: React.CSSProperties = {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.75rem',
        };

        if (logo.url) {
            return (
                <a key={index} href={logo.url} target="_blank" rel="noopener noreferrer" style={wrapperStyle}>
                    {img}
                </a>
            );
        }

        return (
            <div key={index} style={wrapperStyle}>
                {img}
            </div>
        );
    };

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: `${gap * 4}px`,
            alignItems: 'center',
        }}>
            {logos.map((logo, i) => renderLogo(logo, i))}
        </div>
    );
}
