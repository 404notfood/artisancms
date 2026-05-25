import type { BlockRendererProps } from '../block-registry';
import { useBuilderStore } from '@/stores/builder-store';

function responsiveProps(props: Record<string, unknown>, viewport: string) {
    return {
        ...props,
        ...((props.responsive as Record<string, Record<string, unknown>> | undefined)?.[viewport] ?? {}),
    };
}

export default function HeadingRenderer({ block, isSelected, isEditing, onUpdate }: BlockRendererProps) {
    const viewport = useBuilderStore((state) => state.viewport);
    const props = responsiveProps(block.props ?? {}, viewport);
    const level = Number(props.level) || 2;
    const text = (props.text as string) || (props.content as string) || 'Titre';
    const alignment = (props.alignment as string) || (props.textAlign as string) || 'left';
    const color = (props.color as string) || undefined;
    const Tag = `h${level}` as keyof React.JSX.IntrinsicElements;

    const desktopSizePx: Record<number, string> = {
        1: 'clamp(2rem, 5vw, 3.5rem)',
        2: 'clamp(1.5rem, 3.5vw, 2.5rem)',
        3: 'clamp(1.25rem, 2.5vw, 1.75rem)',
        4: '1.25rem',
        5: '1.0625rem',
        6: '0.9375rem',
    };

    const mobileSizePx: Record<number, string> = {
        1: 'clamp(2rem, 9vw, 2.65rem)',
        2: 'clamp(1.55rem, 7vw, 2.1rem)',
        3: 'clamp(1.25rem, 5.5vw, 1.55rem)',
        4: '1.125rem',
        5: '1rem',
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
        fontSize: (props.fontSize as string) || (viewport === 'mobile' ? mobileSizePx[level] || mobileSizePx[2] : desktopSizePx[level] || desktopSizePx[2]),
        fontWeight: fontWeights[level] || 700,
        letterSpacing: '0',
        lineHeight: viewport === 'mobile' ? 1.12 : level === 1 ? 1.05 : 1.2,
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
