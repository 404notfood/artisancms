import type { BlockRendererProps } from '../block-registry';

export default function CustomHtmlRenderer({ block }: BlockRendererProps) {
    const props = (block.props ?? block.settings ?? {}) as Record<string, unknown>;
    const html = (props.html as string) ?? '';

    if (!html) return null;

    return (
        <div
            className="custom-html-block"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: intentional raw HTML block
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}
