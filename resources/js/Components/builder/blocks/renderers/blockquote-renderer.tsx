import type { BlockRendererProps } from '../block-registry';

export default function BlockquoteRenderer({ block }: BlockRendererProps) {
    const text = (block.props.text as string) || 'Votre citation ici...';
    const author = (block.props.author as string) || '';
    const source = (block.props.source as string) || '';
    const style = (block.props.style as string) || 'simple';

    const styleClasses: Record<string, string> = {
        simple: 'border-l-0 pl-0',
        bordered: 'border-l-4 border-blue-500 pl-6',
        filled: 'bg-gray-50 border-l-4 border-gray-300 pl-6 pr-6 py-4 rounded-r-lg',
    };

    return (
        <blockquote className={`relative py-4 ${styleClasses[style] || styleClasses.simple}`}>
            <span className="text-5xl text-gray-200 font-serif absolute top-0 left-0 leading-none select-none">
                &ldquo;
            </span>
            <p className="text-lg italic text-gray-700 mt-6 mb-3 leading-relaxed">
                {text}
            </p>
            {(author || source) && (
                <footer className="text-sm text-gray-500">
                    {author && <span className="font-medium text-gray-600">&mdash; {author}</span>}
                    {source && <cite className="ml-1 not-italic">, {source}</cite>}
                </footer>
            )}
        </blockquote>
    );
}
