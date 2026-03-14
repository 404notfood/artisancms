import { useState } from 'react';
import type { BlockRendererProps } from '../block-registry';

interface AccordionItem {
    title: string;
    content: string;
}

export default function AccordionRenderer({ block }: BlockRendererProps) {
    const items = (block.props.items as AccordionItem[]) || [];
    const allowMultiple = (block.props.allowMultiple as boolean) || false;
    const defaultOpen = (block.props.defaultOpen as number) ?? -1;

    const [openIndexes, setOpenIndexes] = useState<Set<number>>(
        defaultOpen >= 0 ? new Set([defaultOpen]) : new Set()
    );

    const toggleIndex = (index: number) => {
        setOpenIndexes((prev) => {
            const next = new Set(allowMultiple ? prev : []);
            if (prev.has(index)) {
                next.delete(index);
            } else {
                next.add(index);
            }
            return next;
        });
    };

    if (items.length === 0) {
        return (
            <div className="w-full py-8 text-center text-gray-400 border-2 border-dashed rounded">
                Aucun élément dans l&apos;accordéon
            </div>
        );
    }

    return (
        <div className="w-full border rounded divide-y">
            {items.map((item, index) => {
                const isOpen = openIndexes.has(index);
                return (
                    <div key={index}>
                        <button
                            type="button"
                            className="w-full flex items-center justify-between px-4 py-3 text-left font-medium text-gray-800 hover:bg-gray-50 transition-colors"
                            onClick={() => toggleIndex(index)}
                        >
                            <span>{item.title || 'Sans titre'}</span>
                            <svg
                                className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {isOpen && (
                            <div className="px-4 pb-4 text-gray-600 text-sm leading-relaxed">
                                {item.content}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
