import { useEffect, useRef, useState } from 'react';
import { useBuilderStore } from '@/stores/builder-store';
import { getBlock, getBlocksByCategory } from './blocks/block-registry';
import DraggableBlockItem from './draggable-block-item';
import BlockBreadcrumb from './block-breadcrumb';
import BlockTree from './block-tree';

type TabId = 'blocks' | 'structure' | 'settings';

export default function BuilderSidebar() {
    const [activeTab, setActiveTab] = useState<TabId>('blocks');
    const { selectedBlockId, findBlock, updateBlock } = useBuilderStore();
    const prevSelectedRef = useRef(selectedBlockId);

    const selectedBlock = selectedBlockId ? findBlock(selectedBlockId) : null;
    const entry = selectedBlock ? getBlock(selectedBlock.type) : null;
    const SettingsComponent = entry?.settings;

    // Auto-switch to settings when a block is selected from the Blocks tab
    useEffect(() => {
        if (selectedBlockId && !prevSelectedRef.current && activeTab === 'blocks') {
            setActiveTab('settings');
        }
        prevSelectedRef.current = selectedBlockId;
    }, [selectedBlockId, activeTab]);

    const categories = [
        { key: 'layout', label: 'Mise en page' },
        { key: 'content', label: 'Contenu' },
        { key: 'media', label: 'Media' },
    ];

    const tabs: { id: TabId; label: string }[] = [
        { id: 'blocks', label: 'Blocs' },
        { id: 'structure', label: 'Structure' },
        { id: 'settings', label: 'Proprietes' },
    ];

    return (
        <div className="w-72 bg-white border-r flex flex-col shrink-0 h-full">
            {/* Tabs */}
            <div className="flex border-b shrink-0">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 py-2.5 text-sm font-medium text-center transition-colors ${activeTab === tab.id ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                {activeTab === 'blocks' && (
                    <div className="space-y-6">
                        {categories.map(({ key, label }) => {
                            const blocks = getBlocksByCategory(key);
                            if (!blocks.length) return null;
                            return (
                                <div key={key}>
                                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{label}</h3>
                                    <div className="space-y-1.5">
                                        {blocks.map(([slug, blockEntry]) => (
                                            <DraggableBlockItem key={slug} slug={slug} label={blockEntry.label} icon={blockEntry.icon} />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {activeTab === 'structure' && <BlockTree />}

                {activeTab === 'settings' && (
                    <>
                        {selectedBlock && SettingsComponent ? (
                            <div>
                                <BlockBreadcrumb />
                                <h3 className="text-sm font-semibold text-gray-800 mb-3">{entry?.label || selectedBlock.type}</h3>
                                <SettingsComponent block={selectedBlock} onUpdate={(props) => updateBlock(selectedBlock.id, props)} />
                            </div>
                        ) : (
                            <div className="text-center text-gray-400 text-sm mt-12">
                                <p>Selectionnez un bloc pour modifier ses proprietes</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
