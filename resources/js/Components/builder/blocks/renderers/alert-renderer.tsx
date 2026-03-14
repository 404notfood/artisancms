import { useState } from 'react';
import type { BlockRendererProps } from '../block-registry';

export default function AlertRenderer({ block }: BlockRendererProps) {
    const type = (block.props.type as string) || 'info';
    const title = (block.props.title as string) || '';
    const content = (block.props.content as string) || '';
    const dismissible = (block.props.dismissible as boolean) || false;
    const showIcon = block.props.icon !== false;

    const [dismissed, setDismissed] = useState(false);

    if (dismissed) return null;

    const typeConfig: Record<string, { bg: string; border: string; text: string; icon: string }> = {
        info: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', icon: '\u2139\uFE0F' },
        success: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', icon: '\u2705' },
        warning: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', icon: '\u26A0\uFE0F' },
        error: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: '\u274C' },
    };

    const config = typeConfig[type] || typeConfig.info;

    return (
        <div className={`w-full rounded-lg border p-4 ${config.bg} ${config.border} ${config.text}`}>
            <div className="flex items-start gap-3">
                {showIcon && (
                    <span className="text-xl flex-shrink-0 mt-0.5">{config.icon}</span>
                )}
                <div className="flex-1 min-w-0">
                    {title && (
                        <div className="font-semibold mb-1">{title}</div>
                    )}
                    {content && (
                        <div className="text-sm opacity-90 leading-relaxed">{content}</div>
                    )}
                </div>
                {dismissible && (
                    <button
                        type="button"
                        className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity text-lg"
                        onClick={() => setDismissed(true)}
                    >
                        &times;
                    </button>
                )}
            </div>
        </div>
    );
}
