import type { BlockRendererProps } from '../block-registry';
import TipTapInline from '../../tiptap-inline';

export default function TextRenderer({ block, isSelected, isEditing, onUpdate }: BlockRendererProps) {
    const content = (block.props.content as string) || '<p>Votre texte ici...</p>';
    const alignment = (block.props.alignment as string) || 'left';
    const color = (block.props.color as string) || undefined;

    if (isEditing && isSelected && onUpdate) {
        return (
            <TipTapInline
                content={content}
                onUpdate={(html) => onUpdate({ content: html })}
                className="prose max-w-none"
                style={{
                    textAlign: alignment as React.CSSProperties['textAlign'],
                    color,
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
            }}
            dangerouslySetInnerHTML={{ __html: content }}
        />
    );
}
