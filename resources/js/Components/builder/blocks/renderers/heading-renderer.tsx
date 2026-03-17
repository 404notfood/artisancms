import type { BlockRendererProps } from '../block-registry';

export default function HeadingRenderer({ block, isSelected, isEditing, onUpdate }: BlockRendererProps) {
    const level = Number(block.props.level) || 2;
    const text = (block.props.text as string) || (block.props.content as string) || 'Titre';
    const alignment = (block.props.alignment as string) || 'left';
    const color = (block.props.color as string) || undefined;
    const Tag = `h${level}` as keyof React.JSX.IntrinsicElements;

    const sizePx: Record<number, string> = {
        1: 'clamp(2rem, 5vw, 3.5rem)',
        2: 'clamp(1.5rem, 3.5vw, 2.5rem)',
        3: 'clamp(1.25rem, 2.5vw, 1.75rem)',
        4: '1.25rem',
        5: '1.0625rem',
        6: '0.9375rem',
    };

    const fontWeights: Record<number, number> = {
        1: 800,
        2: 700,
        3: 700,
        4: 600,
        5: 600,
        6: 500,
    };

    const style: React.CSSProperties = {
        fontFamily: 'var(--font-heading, inherit)',
        fontSize: sizePx[level] || sizePx[2],
        fontWeight: fontWeights[level] || 700,
        letterSpacing: level <= 2 ? '-0.02em' : level <= 4 ? '-0.01em' : '0',
        lineHeight: level === 1 ? 1.05 : 1.2,
        textAlign: alignment as React.CSSProperties['textAlign'],
        color: color || 'inherit',
        margin: 0,
    };

    if (isEditing && isSelected && onUpdate) {
        return (
            <Tag
                contentEditable
                suppressContentEditableWarning
                style={{ ...style, outline: 'none' }}
                onBlur={(e) => onUpdate({ text: (e.currentTarget as HTMLElement).textContent || '' })}
            >
                {text}
            </Tag>
        );
    }

    return <Tag style={style}>{text}</Tag>;
}
