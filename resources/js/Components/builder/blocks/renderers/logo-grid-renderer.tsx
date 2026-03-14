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
    const gap = (block.props.gap as string) || '6';

    const gridCols: Record<number, string> = {
        3: 'grid-cols-3',
        4: 'grid-cols-4',
        5: 'grid-cols-5',
        6: 'grid-cols-6',
    };

    const renderLogo = (logo: Logo, index: number) => {
        const img = (
            <img
                src={logo.src}
                alt={logo.alt}
                className={`max-h-16 w-auto object-contain mx-auto transition-all duration-300 ${
                    grayscale ? 'grayscale hover:grayscale-0 opacity-60 hover:opacity-100' : ''
                }`}
            />
        );

        if (logo.url) {
            return (
                <a
                    key={index}
                    href={logo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center p-4"
                >
                    {img}
                </a>
            );
        }

        return (
            <div key={index} className="flex items-center justify-center p-4">
                {img}
            </div>
        );
    };

    if (logos.length === 0) {
        return (
            <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                <p className="text-sm">Aucun logo ajouté</p>
                <p className="text-xs mt-1">Ajoutez des logos dans les paramètres du bloc</p>
            </div>
        );
    }

    return (
        <div className={`grid ${gridCols[columns] || gridCols[4]} gap-${gap} items-center`}>
            {logos.map((logo, i) => renderLogo(logo, i))}
        </div>
    );
}
