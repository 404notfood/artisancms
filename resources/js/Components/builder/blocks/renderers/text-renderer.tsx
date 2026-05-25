import type { BlockRendererProps } from '../block-registry';
import TipTapInline from '../../tiptap-inline';
import { useBuilderStore } from '@/stores/builder-store';

function responsiveProps(props: Record<string, unknown>, viewport: string) {
    return {
        ...props,
        ...((props.responsive as Record<string, Record<string, unknown>> | undefined)?.[viewport] ?? {}),
    };
}

export default function TextRenderer({ block, isSelected, isEditing, onUpdate }: BlockRendererProps) {
    const viewport = useBuilderStore((state) => state.viewport);
    const props = responsiveProps(block.props ?? {}, viewport);
    const content = (props.content as string) || '<p>Votre texte ici...</p>';
    const alignment = (props.alignment as string) || (props.textAlign as string) || 'left';
    const color = (props.color as string) || undefined;
    const fontSize = (props.fontSize as string) || (viewport === 'mobile' ? '0.98rem' : undefined);
    const lineHeight = Number(props.lineHeight) || (viewport === 'mobile' ? 1.65 : undefined);

    if (isEditing && isSelected && onUpdate) {
        return (
            <TipTapInline
                content={content}
                onUpdate={(html) => onUpdate({ content: html })}
                className="prose max-w-none"
                style={{
                    textAlign: alignment as React.CSSProperties['textAlign'],
                    color,
                    fontSize,
                    lineHeight,
                }}
            />
        );
    }

    return (
        <div
            className="prose max-w-none"
            style={{
                textAlign: alignment as React.CSSProperties['textAlign'],
                color,
                fontSize,
                lineHeight,
            }}
            dangerouslySetInnerHTML={{ __html: content }}
        />
    );
}
