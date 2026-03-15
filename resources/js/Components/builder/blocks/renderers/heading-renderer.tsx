import type { BlockRendererProps } from '../block-registry';

export default function HeadingRenderer({ block }: BlockRendererProps) {
    const level = Number(block.props.level) || 2;
    const text = (block.props.text as string) || 'Titre';
    const alignment = (block.props.alignment as string) || 'left';
    const color = (block.props.color as string) || undefined;
    const Tag = `h${level}` as keyof React.JSX.IntrinsicElements;

    const sizeClasses: Record<number, string> = {
        1: 'text-4xl font-bold',
        2: 'text-3xl font-bold',
        3: 'text-2xl font-semibold',
        4: 'text-xl font-semibold',
        5: 'text-lg font-medium',
        6: 'text-base font-medium',
    };

    return (
        <Tag
            className={sizeClasses[level] || sizeClasses[2]}
            style={{
                textAlign: alignment as React.CSSProperties['textAlign'],
                color,
            }}
        >
            {text}
        </Tag>
    );
}
