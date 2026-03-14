import type { BlockRendererProps } from '../block-registry';

export default function DividerRenderer({ block }: BlockRendererProps) {
    const borderStyle = (block.props.style as string) || 'solid';
    const color = (block.props.color as string) || '#d1d5db';
    const thickness = Number(block.props.thickness) || 1;

    return (
        <hr
            className="w-full my-2"
            style={{ borderStyle, borderColor: color, borderWidth: `${thickness}px 0 0 0` }}
        />
    );
}
