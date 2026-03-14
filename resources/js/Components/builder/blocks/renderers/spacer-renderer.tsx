import type { BlockRendererProps } from '../block-registry';

export default function SpacerRenderer({ block }: BlockRendererProps) {
    const height = Number(block.props.height) || 40;

    return (
        <div className="w-full relative flex items-center justify-center" style={{ height: `${height}px` }}>
            <div className="border-t border-dashed border-gray-300 w-full" />
            <span className="absolute text-xs text-gray-400 bg-white px-1">{height}px</span>
        </div>
    );
}
