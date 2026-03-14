import { useState } from 'react';
import type { BlockRendererProps } from '../block-registry';

export default function CodeBlockRenderer({ block }: BlockRendererProps) {
    const code = (block.props.code as string) || '// Votre code ici';
    const language = (block.props.language as string) || 'javascript';
    const showLineNumbers = block.props.showLineNumbers !== false;
    const title = (block.props.title as string) || '';

    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(code).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const lines = code.split('\n');

    return (
        <div className="rounded-lg overflow-hidden border border-gray-700">
            {(title || language) && (
                <div className="bg-gray-800 px-4 py-2 flex items-center justify-between">
                    <span className="text-sm text-gray-400">
                        {title || language}
                    </span>
                    <button
                        type="button"
                        onClick={handleCopy}
                        className="text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-gray-700"
                    >
                        {copied ? 'Copié !' : 'Copier'}
                    </button>
                </div>
            )}
            <div className="bg-gray-900 p-4 overflow-x-auto">
                <pre className="text-sm font-mono text-gray-100 leading-relaxed">
                    {lines.map((line, i) => (
                        <div key={i} className="flex">
                            {showLineNumbers && (
                                <span className="select-none text-gray-600 text-right w-8 mr-4 flex-shrink-0">
                                    {i + 1}
                                </span>
                            )}
                            <code>{line}</code>
                        </div>
                    ))}
                </pre>
            </div>
        </div>
    );
}
