import type { BlockRendererProps } from '../block-registry';

interface Testimonial {
    name: string;
    role: string;
    company: string;
    content: string;
    avatar: string;
    rating: number;
}

export default function TestimonialsRenderer({ block }: BlockRendererProps) {
    const items = (block.props.items as Testimonial[]) || [];
    const layout = (block.props.layout as string) || 'grid';
    const columns = (block.props.columns as number) || 2;

    if (items.length === 0) {
        return (
            <div className="w-full py-8 text-center text-gray-400 border-2 border-dashed rounded">
                Aucun témoignage ajouté
            </div>
        );
    }

    const renderStars = (rating: number) => {
        const stars = Math.min(Math.max(Math.round(rating || 0), 0), 5);
        return (
            <div className="flex gap-0.5 text-yellow-400">
                {Array.from({ length: 5 }, (_, i) => (
                    <span key={i}>{i < stars ? '\u2605' : '\u2606'}</span>
                ))}
            </div>
        );
    };

    const renderCard = (item: Testimonial, index: number) => (
        <div key={index} className="bg-white border rounded-lg p-6 shadow-sm">
            <div className="text-3xl text-gray-200 mb-3">&ldquo;</div>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">{item.content}</p>
            {item.rating > 0 && <div className="mb-3">{renderStars(item.rating)}</div>}
            <div className="flex items-center gap-3">
                {item.avatar ? (
                    <img src={item.avatar} alt={item.name} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-medium">
                        {(item.name || '?').charAt(0).toUpperCase()}
                    </div>
                )}
                <div>
                    <div className="font-medium text-gray-800 text-sm">{item.name}</div>
                    {(item.role || item.company) && (
                        <div className="text-xs text-gray-500">
                            {item.role}{item.role && item.company ? ', ' : ''}{item.company}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    if (layout === 'list') {
        return <div className="space-y-4">{items.map(renderCard)}</div>;
    }

    if (layout === 'carousel') {
        return (
            <div className="flex overflow-x-auto gap-4 pb-2">
                {items.map((item, index) => (
                    <div key={index} className="flex-shrink-0 w-80">
                        {renderCard(item, index)}
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className={`grid grid-cols-${columns} gap-4`}>
            {items.map(renderCard)}
        </div>
    );
}
