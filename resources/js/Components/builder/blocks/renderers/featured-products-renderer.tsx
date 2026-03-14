import type { BlockRendererProps } from '../block-registry';

export default function FeaturedProductsRenderer({ block, isEditing }: BlockRendererProps) {
    const title = (block.props.title as string) || 'Produits en vedette';
    const limit = (block.props.limit as number) || 4;
    const layout = (block.props.layout as string) || 'scroll';
    const showArrows = block.props.showArrows !== false;

    const placeholders = Array.from({ length: limit }, (_, i) => i);

    const PlaceholderCard = ({ index }: { index: number }) => (
        <div className="min-w-[220px] flex-shrink-0 bg-white rounded-lg shadow-md overflow-hidden snap-start">
            <div className="w-full h-40 bg-gray-100 flex items-center justify-center">
                <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
            </div>
            <div className="p-3">
                <h4 className="font-medium text-gray-900 text-sm mb-1">Produit {index + 1}</h4>
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-blue-600 font-bold text-sm">{(19.99 + index * 10).toFixed(2)} EUR</span>
                </div>
                <button type="button" className="w-full bg-blue-600 text-white py-1.5 rounded text-xs font-medium hover:bg-blue-700 transition-colors">
                    Ajouter au panier
                </button>
            </div>
        </div>
    );

    const ArrowButton = ({ direction }: { direction: 'left' | 'right' }) => (
        <button
            type="button"
            className="absolute top-1/2 -translate-y-1/2 z-10 bg-white/90 shadow-md rounded-full w-10 h-10 flex items-center justify-center hover:bg-white transition-colors"
            style={{ [direction === 'left' ? 'left' : 'right']: '-0.5rem' }}
        >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={direction === 'left' ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'} />
            </svg>
        </button>
    );

    if (!isEditing) {
        return (
            <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">{title}</h2>
                <div className="text-center py-12 text-gray-400">
                    Produits en vedette (chargement dynamique)
                </div>
            </div>
        );
    }

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{title}</h2>

            {layout === 'scroll' ? (
                <div className="relative">
                    {showArrows && <ArrowButton direction="left" />}
                    <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-gray-300">
                        {placeholders.map((i) => (
                            <PlaceholderCard key={i} index={i} />
                        ))}
                    </div>
                    {showArrows && <ArrowButton direction="right" />}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {placeholders.map((i) => (
                        <PlaceholderCard key={i} index={i} />
                    ))}
                </div>
            )}
        </div>
    );
}
