import { useState } from 'react';
import type { BlockRendererProps } from '../block-registry';

interface TabItem {
    label: string;
    content: string;
}

export default function TabsRenderer({ block }: BlockRendererProps) {
    const tabs = (block.props.tabs as TabItem[]) || [];
    const style = (block.props.style as string) || 'underline';
    const defaultTab = (block.props.defaultTab as number) || 0;

    const [activeTab, setActiveTab] = useState(defaultTab);

    if (tabs.length === 0) {
        return (
            <div className="w-full py-8 text-center text-gray-400 border-2 border-dashed rounded">
                Aucun onglet configuré
            </div>
        );
    }

    const tabStyles: Record<string, { container: string; active: string; inactive: string }> = {
        underline: {
            container: 'border-b',
            active: 'border-b-2 border-blue-600 text-blue-600',
            inactive: 'text-gray-500 hover:text-gray-700',
        },
        pills: {
            container: 'gap-2',
            active: 'bg-blue-600 text-white rounded-full',
            inactive: 'text-gray-600 hover:bg-gray-100 rounded-full',
        },
        boxed: {
            container: 'border rounded-t bg-gray-50',
            active: 'bg-white border-b-0 border text-blue-600 -mb-px',
            inactive: 'text-gray-500 hover:text-gray-700',
        },
    };

    const currentStyle = tabStyles[style] || tabStyles.underline;
    const safeIndex = activeTab < tabs.length ? activeTab : 0;

    return (
        <div className="w-full">
            <div className={`flex ${currentStyle.container}`}>
                {tabs.map((tab, index) => (
                    <button
                        key={index}
                        type="button"
                        className={`px-4 py-2 text-sm font-medium transition-colors ${index === safeIndex ? currentStyle.active : currentStyle.inactive}`}
                        onClick={() => setActiveTab(index)}
                    >
                        {tab.label || `Onglet ${index + 1}`}
                    </button>
                ))}
            </div>
            <div className={`p-4 text-gray-700 text-sm leading-relaxed ${style === 'boxed' ? 'border border-t-0 rounded-b' : ''}`}>
                {tabs[safeIndex]?.content || ''}
            </div>
        </div>
    );
}
