import { useEffect, useRef, useState } from 'react';
import { useBuilderStore } from '@/stores/builder-store';
import { getAllBlocks, getBlock, getBlocksByCategory } from './blocks/block-registry';
import DraggableBlockItem from './draggable-block-item';
import BlockBreadcrumb from './block-breadcrumb';
import BlockTree from './block-tree';
import PatternLibrary from './pattern-library';

type TabId = 'blocks' | 'structure' | 'settings' | 'patterns';

const CATEGORIES = [
    { key: 'layout', label: 'Mise en page' },
    { key: 'content', label: 'Contenu' },
    { key: 'media', label: 'Média' },
    { key: 'interactive', label: 'Interactif' },
    { key: 'marketing', label: 'Marketing' },
    { key: 'data', label: 'Données' },
] as const;

const TABS: { id: TabId; label: string }[] = [
    { id: 'blocks', label: 'Blocs' },
    { id: 'structure', label: 'Structure' },
    { id: 'settings', label: 'Propriétés' },
    { id: 'patterns', label: 'Patterns' },
];

export default function BuilderSidebar() {
    const [activeTab, setActiveTab] = useState<TabId>('blocks');
    const [blockSearch, setBlockSearch] = useState('');
    const { selectedBlockId, findBlock, updateBlock } = useBuilderStore();
    const prevSelectedRef = useRef(selectedBlockId);

    const selectedBlock = selectedBlockId ? findBlock(selectedBlockId) : null;
    const registryEntry = selectedBlock ? getBlock(selectedBlock.type) : null;
    const SettingsComponent = registryEntry?.settings;

    useEffect(() => {
        if (selectedBlockId && !prevSelectedRef.current && activeTab === 'blocks') {
            setActiveTab('settings');
        }
        prevSelectedRef.current = selectedBlockId;
    }, [selectedBlockId, activeTab]);

    return (
        <div className="w-72 bg-white border-r flex flex-col shrink-0 h-full">
            <div className="flex border-b shrink-0">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 py-2.5 text-sm font-medium text-center transition-colors ${activeTab === tab.id ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                {activeTab === 'blocks' && (
                    <div className="space-y-4">
                        <input
                            type="text"
                            value={blockSearch}
                            onChange={(e) => setBlockSearch(e.target.value)}
                            placeholder="Rechercher un bloc..."
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />

                        {blockSearch.trim() ? (
                            <div className="space-y-1.5">
                                {getAllBlocks()
                                    .filter(([slug, b]) => {
                                        const q = blockSearch.toLowerCase();
                                        return slug.includes(q) || b.label.toLowerCase().includes(q);
                                    })
                                    .map(([slug, b]) => (
                                        <DraggableBlockItem key={slug} slug={slug} label={b.label} icon={b.icon} />
                                    ))}
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {CATEGORIES.map(({ key, label }) => {
                                    const blocks = getBlocksByCategory(key);
                                    if (!blocks.length) return null;
                                    return (
                                        <div key={key}>
                                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{label}</h3>
                                            <div className="space-y-1.5">
                                                {blocks.map(([slug, b]) => (
                                                    <DraggableBlockItem key={slug} slug={slug} label={b.label} icon={b.icon} />
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'structure' && <BlockTree />}

                {activeTab === 'patterns' && <PatternLibrary />}

                {activeTab === 'settings' && (
                    <>
                        {selectedBlock && SettingsComponent ? (
                            <div>
                                <BlockBreadcrumb />
                                <h3 className="text-sm font-semibold text-gray-800 mb-3">{registryEntry?.label || selectedBlock.type}</h3>
                                <SettingsComponent block={selectedBlock} onUpdate={(props) => updateBlock(selectedBlock.id, props)} />
                            </div>
                        ) : (
                            <div className="text-center text-gray-400 text-sm mt-12">
                                <p>Sélectionnez un bloc pour modifier ses propriétés</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
