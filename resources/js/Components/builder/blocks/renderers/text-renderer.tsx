import type { BlockRendererProps } from '../block-registry';

export default function TextRenderer({ block }: BlockRendererProps) {
    const content = (block.props.content as string) || '<p>Votre texte ici...</p>';
    const alignment = (block.props.alignment as string) || 'left';
    const color = (block.props.color as string) || undefined;

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
