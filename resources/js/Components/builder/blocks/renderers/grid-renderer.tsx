import type { BlockRendererProps } from '../block-registry';

export default function GridRenderer({ block, isEditing, children }: BlockRendererProps) {
    const columns = Number(block.props.columns) || 2;
    const gap = Number(block.props.gap) || 16;

    return (
        <div
            className="w-full min-h-[60px]"
            style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: `${gap}px` }}
        >
            {children || (
                isEditing ? (
                    Array.from({ length: columns }, (_, i) => (
                        <div
                            key={i}
                            className="border-2 border-dashed border-gray-300 rounded p-4 text-center text-gray-400 text-sm min-h-[80px] flex items-center justify-center"
                        >
                            Col {i + 1}
                        </div>
                    ))
                ) : (
                    <div className="col-span-full border-2 border-dashed border-gray-300 rounded p-4 text-center text-gray-400 text-sm">
                        Grille vide
                    </div>
                )
            )}
        </div>
    );
}
