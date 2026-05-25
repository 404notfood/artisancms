import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Blocks, ChevronDown, CopyPlus, Eye, EyeOff, LayoutTemplate, Layers3, Lock, Monitor, Save, Search, Settings2, Smartphone, Tablet, Trash2, Unlock } from 'lucide-react';
import { nanoid } from 'nanoid';
import { useBuilderStore } from '@/stores/builder-store';
import type { BlockNode } from '@/types/cms';
import { getAllBlocks, getBlock, getBlocksByCategory } from './blocks/block-registry';
import DraggableBlockItem from './draggable-block-item';
import BlockBreadcrumb from './block-breadcrumb';
import BlockTree from './block-tree';
import PatternLibrary from './pattern-library';
import SpacingSection from './blocks/shared/spacing-control';
import SavePatternDialog from './save-pattern-dialog';

type TabId = 'blocks' | 'structure' | 'settings' | 'patterns';
type InspectorTabId = 'content' | 'style' | 'advanced';

const CATEGORIES = [
    { key: 'layout', label: 'Mise en page' },
    { key: 'content', label: 'Contenu' },
    { key: 'media', label: 'Média' },
    { key: 'interactive', label: 'Interactif' },
    { key: 'marketing', label: 'Marketing' },
    { key: 'data', label: 'Données' },
] as const;

type CategoryKey = (typeof CATEGORIES)[number]['key'];

interface LayoutPreset {
    label: string;
    spans: number[];
}

const LAYOUT_PRESETS: LayoutPreset[] = [
    { label: '1 colonne', spans: [12] },
    { label: '2 colonnes', spans: [6, 6] },
    { label: '3 colonnes', spans: [4, 4, 4] },
    { label: '30 / 70', spans: [4, 8] },
    { label: '70 / 30', spans: [8, 4] },
    { label: '25 / 50 / 25', spans: [3, 6, 3] },
];

const RESPONSIVE_VIEWPORTS = [
    { id: 'desktop' as const, label: 'Desktop', Icon: Monitor, width: 'Fluide' },
    { id: 'tablet' as const, label: 'Tablette', Icon: Tablet, width: '768px' },
    { id: 'mobile' as const, label: 'Mobile', Icon: Smartphone, width: '390px' },
];

const TABS = [
    { id: 'blocks', label: 'Blocs', Icon: Blocks },
    { id: 'structure', label: 'Structure', Icon: Layers3 },
    { id: 'settings', label: 'Styles', Icon: Settings2 },
    { id: 'patterns', label: 'Patterns', Icon: LayoutTemplate },
] satisfies { id: TabId; label: string; Icon: typeof Blocks }[];

const CATEGORY_ACCENTS: Record<(typeof CATEGORIES)[number]['key'], string> = {
    layout: 'bg-slate-900',
    content: 'bg-blue-600',
    media: 'bg-emerald-600',
    interactive: 'bg-amber-500',
    marketing: 'bg-rose-500',
    data: 'bg-cyan-600',
};

const sidebarSectionClass = 'rounded-xl border border-slate-200 bg-white p-3 shadow-sm';

const searchInputClass = [
    'w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 shadow-sm',
    'placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200',
].join(' ');

function EmptyState({ children }: { children: ReactNode }) {
    return (
        <div className="mt-12 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            {children}
        </div>
    );
}

function createBlock(type: string, props: Record<string, unknown> = {}, children: BlockNode[] = []): BlockNode {
    return { id: nanoid(), type, props, children };
}

function createLayoutPresetBlock(preset: LayoutPreset): BlockNode {
    return createBlock('section', {
        paddingTop: 56,
        paddingBottom: 56,
        paddingLeft: 24,
        paddingRight: 24,
        centered: true,
        responsive: {
            tablet: { paddingTop: 44, paddingBottom: 44, paddingLeft: 20, paddingRight: 20 },
            mobile: { paddingTop: 32, paddingBottom: 32, paddingLeft: 16, paddingRight: 16 },
        },
    }, [
        createBlock('row', {
            gap: 24,
            verticalAlign: 'stretch',
            responsive: {
                tablet: { gap: 18 },
                mobile: { gap: 14 },
            },
        }, preset.spans.map((span) => (
            createBlock('column', {
                span,
                padding: 16,
                minHeight: 140,
                responsive: {
                    tablet: { span: span <= 3 ? 6 : span >= 5 ? 12 : 6, padding: 14 },
                    mobile: { span: 12, padding: 12, minHeight: 120 },
                },
            }, [])
        ))),
    ]);
}

function getResponsiveProps(block: BlockNode, viewport: string) {
    return (block.props.responsive as Record<string, Record<string, unknown>> | undefined)?.[viewport] ?? {};
}

function StyleInspector({ block, onUpdate }: { block: BlockNode; onUpdate: (props: Record<string, unknown>) => void }) {
    const viewport = useBuilderStore((state) => state.viewport);
    const setViewport = useBuilderStore((state) => state.setViewport);
    const responsive = getResponsiveProps(block, viewport);
    const effectiveProps = { ...block.props, ...responsive } as Record<string, unknown>;
    const updateBase = (key: string, value: unknown) => onUpdate({ [key]: value });
    const updateResponsive = (key: string, value: unknown) => {
        onUpdate({
            responsive: {
                ...((block.props.responsive as Record<string, Record<string, unknown>> | undefined) ?? {}),
                [viewport]: {
                    ...responsive,
                    [key]: value,
                },
            },
        });
    };
    const updateViewportValue = viewport === 'desktop' ? updateBase : updateResponsive;
    const inputClass = 'w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100';
    const labelClass = 'text-[11px] font-semibold uppercase text-slate-400';
    const shadowValue = (effectiveProps.boxShadow as string | undefined) || '';
    const currentHidden = Boolean(effectiveProps.hidden);
    const applyColumnPreset = (spans: Record<'desktop' | 'tablet' | 'mobile', number>) => {
        onUpdate({
            span: spans.desktop,
            responsive: {
                ...((block.props.responsive as Record<string, Record<string, unknown>> | undefined) ?? {}),
                tablet: { ...getResponsiveProps(block, 'tablet'), span: spans.tablet },
                mobile: { ...getResponsiveProps(block, 'mobile'), span: spans.mobile },
            },
        });
    };

    return (
        <div className="space-y-4">
            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3">
                <div className="mb-3 flex items-center justify-between gap-2">
                    <div>
                        <p className="text-xs font-bold uppercase text-blue-700">Responsive</p>
                        <p className="mt-0.5 text-[11px] text-blue-600/80">Chaque device garde ses propres valeurs.</p>
                    </div>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-blue-700 ring-1 ring-blue-100">
                        {RESPONSIVE_VIEWPORTS.find((item) => item.id === viewport)?.width}
                    </span>
                </div>
                <div className="grid grid-cols-3 gap-1 rounded-xl bg-white/70 p-1 ring-1 ring-blue-100">
                    {RESPONSIVE_VIEWPORTS.map(({ id, label, Icon }) => (
                        <button
                            key={id}
                            type="button"
                            onClick={() => setViewport(id)}
                            className={`flex flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-[11px] font-semibold transition ${viewport === id ? 'bg-blue-600 text-white shadow-sm' : 'text-blue-700 hover:bg-white'}`}
                        >
                            <Icon className="h-4 w-4" />
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {block.type === 'column' && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="mb-2 text-[11px] font-semibold uppercase text-slate-400">Presets colonne</p>
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { label: 'Pleine', spans: { desktop: 12, tablet: 12, mobile: 12 } },
                            { label: '1/2 > full', spans: { desktop: 6, tablet: 12, mobile: 12 } },
                            { label: '1/3 > full', spans: { desktop: 4, tablet: 6, mobile: 12 } },
                        ].map((preset) => (
                            <button
                                key={preset.label}
                                type="button"
                                onClick={() => applyColumnPreset(preset.spans)}
                                className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-[11px] font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1.5">
                    <span className={labelClass}>Fond</span>
                    <input type="color" value={(effectiveProps.backgroundColor as string) || '#ffffff'} onChange={(event) => updateViewportValue('backgroundColor', event.target.value)} className="h-9 w-full rounded-lg border border-slate-200 bg-white p-1" />
                </label>
                <label className="space-y-1.5">
                    <span className={labelClass}>Texte</span>
                    <input type="color" value={(effectiveProps.color as string) || '#0f172a'} onChange={(event) => updateViewportValue('color', event.target.value)} className="h-9 w-full rounded-lg border border-slate-200 bg-white p-1" />
                </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1.5">
                    <span className={labelClass}>Bordure</span>
                    <input type="number" min={0} max={16} value={Number(effectiveProps.borderWidth) || 0} onChange={(event) => updateViewportValue('borderWidth', Number(event.target.value))} className={inputClass} />
                </label>
                <label className="space-y-1.5">
                    <span className={labelClass}>Couleur</span>
                    <input type="color" value={(effectiveProps.borderColor as string) || '#e2e8f0'} onChange={(event) => updateViewportValue('borderColor', event.target.value)} className="h-9 w-full rounded-lg border border-slate-200 bg-white p-1" />
                </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1.5">
                    <span className={labelClass}>Radius</span>
                    <input type="number" min={0} max={48} value={Number(effectiveProps.borderRadius) || 0} onChange={(event) => updateViewportValue('borderRadius', Number(event.target.value))} className={inputClass} />
                </label>
                <label className="space-y-1.5">
                    <span className={labelClass}>Ombre</span>
                    <select value={shadowValue} onChange={(event) => updateViewportValue('boxShadow', event.target.value)} className={inputClass}>
                        <option value="">Aucune</option>
                        <option value="0 8px 24px rgba(15,23,42,0.08)">Douce</option>
                        <option value="0 16px 40px rgba(15,23,42,0.14)">Profonde</option>
                    </select>
                </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {block.type === 'section' && (
                    <>
                        <label className="space-y-1.5">
                            <span className={labelClass}>Padding haut</span>
                            <input type="number" min={0} max={160} value={Number(effectiveProps.paddingTop) || 0} onChange={(event) => updateViewportValue('paddingTop', Number(event.target.value))} className={inputClass} />
                        </label>
                        <label className="space-y-1.5">
                            <span className={labelClass}>Padding bas</span>
                            <input type="number" min={0} max={160} value={Number(effectiveProps.paddingBottom) || 0} onChange={(event) => updateViewportValue('paddingBottom', Number(event.target.value))} className={inputClass} />
                        </label>
                        <label className="space-y-1.5">
                            <span className={labelClass}>Padding gauche</span>
                            <input type="number" min={0} max={96} value={Number(effectiveProps.paddingLeft) || 0} onChange={(event) => updateViewportValue('paddingLeft', Number(event.target.value))} className={inputClass} />
                        </label>
                        <label className="space-y-1.5">
                            <span className={labelClass}>Padding droite</span>
                            <input type="number" min={0} max={96} value={Number(effectiveProps.paddingRight) || 0} onChange={(event) => updateViewportValue('paddingRight', Number(event.target.value))} className={inputClass} />
                        </label>
                    </>
                )}
                {(block.type === 'column' || block.type === 'row') && (
                    <label className="space-y-1.5">
                        <span className={labelClass}>{block.type === 'column' ? 'Span' : 'Gap'}</span>
                        <input
                            type="number"
                            min={block.type === 'column' ? 1 : 0}
                            max={block.type === 'column' ? 12 : 96}
                            value={Number(effectiveProps[block.type === 'column' ? 'span' : 'gap']) || (block.type === 'column' ? 6 : 20)}
                            onChange={(event) => updateViewportValue(block.type === 'column' ? 'span' : 'gap', Number(event.target.value))}
                            className={inputClass}
                        />
                    </label>
                )}
                {block.type === 'column' && (
                    <label className="space-y-1.5">
                        <span className={labelClass}>Padding</span>
                        <input type="number" min={0} max={96} value={Number(effectiveProps.padding) || 0} onChange={(event) => updateViewportValue('padding', Number(event.target.value))} className={inputClass} />
                    </label>
                )}
            </div>

            <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1.5">
                    <span className={labelClass}>Alignement</span>
                    <select value={(effectiveProps.textAlign as string) || (effectiveProps.alignment as string) || 'left'} onChange={(event) => updateViewportValue('textAlign', event.target.value)} className={inputClass}>
                        <option value="left">Gauche</option>
                        <option value="center">Centre</option>
                        <option value="right">Droite</option>
                    </select>
                </label>
                <label className="flex items-end">
                    <button
                        type="button"
                        onClick={() => updateViewportValue('hidden', !currentHidden)}
                        className={`flex h-9 w-full items-center justify-center gap-2 rounded-lg border px-2 text-xs font-semibold transition ${currentHidden ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                    >
                        {currentHidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        {currentHidden ? 'Masque' : 'Visible'}
                    </button>
                </label>
            </div>

            <SpacingSection
                block={block}
                onUpdate={(props) => onUpdate(props)}
                hidePadding={block.type === 'section'}
            />
        </div>
    );
}

export default function BuilderSidebar() {
    const [activeTab, setActiveTab] = useState<TabId>('blocks');
    const [inspectorTab, setInspectorTab] = useState<InspectorTabId>('content');
    const [blockSearch, setBlockSearch] = useState('');
    const [patternBlockIds, setPatternBlockIds] = useState<string[] | null>(null);
    const [expandedCategories, setExpandedCategories] = useState<Record<CategoryKey, boolean>>({
        layout: true,
        content: true,
        media: false,
        interactive: false,
        marketing: false,
        data: false,
    });
    const { selectedBlockId, findBlock, updateBlock, duplicateBlock, setPendingDeleteId } = useBuilderStore();
    const prevSelectedRef = useRef(selectedBlockId);

    const selectedBlock = selectedBlockId ? findBlock(selectedBlockId) : null;
    const registryEntry = selectedBlock ? getBlock(selectedBlock.type) : null;
    const SettingsComponent = registryEntry?.settings;
    const searchQuery = blockSearch.trim().toLowerCase();
    const searchResults = searchQuery
        ? getAllBlocks().filter(([slug, block]) => slug.includes(searchQuery) || block.label.toLowerCase().includes(searchQuery))
        : [];

    useEffect(() => {
        if (selectedBlockId && !prevSelectedRef.current && activeTab === 'blocks') {
            setActiveTab('settings');
        }
        prevSelectedRef.current = selectedBlockId;
    }, [selectedBlockId, activeTab]);

    const toggleCategory = (key: CategoryKey) => {
        setExpandedCategories((current) => ({
            ...current,
            [key]: !current[key],
        }));
    };

    const insertLayoutPreset = (preset: LayoutPreset) => {
        const section = createLayoutPresetBlock(preset);
        const store = useBuilderStore.getState();

        store.pushHistory();
        useBuilderStore.setState((state) => {
            state.blocks.push(section);
            state.selectedBlockId = section.id;
            state.isDirty = true;
        });
    };

    return (
        <div className="flex h-full w-80 shrink-0 flex-col border-r border-slate-200 bg-slate-50/95">
            <div className="shrink-0 border-b border-slate-200 bg-white px-3 py-3">
                <div className="grid grid-cols-4 gap-1 rounded-xl bg-slate-100 p-1">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-[11px] font-semibold transition ${
                                activeTab === tab.id
                                    ? 'bg-white text-slate-950 shadow-sm ring-1 ring-slate-200'
                                    : 'text-slate-500 hover:bg-white/60 hover:text-slate-800'
                            }`}
                        >
                            <tab.Icon className="h-4 w-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                {activeTab === 'blocks' && (
                    <div className="space-y-4">
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={blockSearch}
                                onChange={(event) => setBlockSearch(event.target.value)}
                                placeholder="Rechercher un bloc..."
                                className={searchInputClass}
                            />
                        </div>

                        {searchQuery ? (
                            <div className={sidebarSectionClass}>
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="text-xs font-semibold uppercase text-slate-500">Résultats</h3>
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                                        {searchResults.length}
                                    </span>
                                </div>
                                {searchResults.length ? (
                                    <div className="space-y-2">
                                        {searchResults.map(([slug, block]) => (
                                            <DraggableBlockItem key={slug} slug={slug} label={block.label} icon={block.icon} />
                                        ))}
                                    </div>
                                ) : (
                                    <p className="rounded-lg bg-slate-50 px-3 py-4 text-center text-sm text-slate-500">
                                        Aucun bloc trouvé.
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className={sidebarSectionClass}>
                                    <div className="mb-3 flex items-center gap-2">
                                        <span className="grid h-7 w-7 place-items-center rounded-lg bg-slate-900 text-white">
                                            <LayoutTemplate className="h-3.5 w-3.5" />
                                        </span>
                                        <div>
                                            <h3 className="text-xs font-semibold uppercase text-slate-600">Presets rapides</h3>
                                            <p className="text-[11px] text-slate-400">Section + ligne + colonnes</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {LAYOUT_PRESETS.map((preset) => (
                                            <button
                                                key={preset.label}
                                                type="button"
                                                onClick={() => insertLayoutPreset(preset)}
                                                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-left text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white hover:shadow-sm"
                                            >
                                                {preset.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {CATEGORIES.map(({ key, label }) => {
                                    const blocks = getBlocksByCategory(key);
                                    if (!blocks.length) return null;

                                    return (
                                        <div key={key} className={sidebarSectionClass}>
                                            <button
                                                type="button"
                                                onClick={() => toggleCategory(key)}
                                                className="flex w-full items-center justify-between gap-3 text-left"
                                                aria-expanded={expandedCategories[key]}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className={`h-2 w-2 rounded-full ${CATEGORY_ACCENTS[key]}`} />
                                                    <h3 className="text-xs font-semibold uppercase text-slate-600">{label}</h3>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                                                        {blocks.length}
                                                    </span>
                                                    <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${expandedCategories[key] ? 'rotate-180' : ''}`} />
                                                </div>
                                            </button>
                                            {expandedCategories[key] && (
                                                <div className="mt-3 space-y-2">
                                                    {blocks.map(([slug, block]) => (
                                                        <DraggableBlockItem key={slug} slug={slug} label={block.label} icon={block.icon} />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'structure' && <BlockTree onSavePattern={(blockId) => setPatternBlockIds([blockId])} />}

                {activeTab === 'patterns' && <PatternLibrary />}

                {activeTab === 'settings' && (
                    <>
                        {selectedBlock && SettingsComponent ? (
                            <div className="space-y-4">
                                <BlockBreadcrumb />
                                <div className={sidebarSectionClass}>
                                    <p className="text-[11px] font-semibold uppercase text-slate-400">Bloc sélectionné</p>
                                    <h3 className="mt-1 text-sm font-semibold text-slate-950">
                                        {registryEntry?.label || selectedBlock.type}
                                    </h3>
                                </div>
                                <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
                                    {([
                                        { id: 'content' as const, label: 'Contenu' },
                                        { id: 'style' as const, label: 'Style' },
                                        { id: 'advanced' as const, label: 'Avance' },
                                    ]).map((tab) => (
                                        <button
                                            key={tab.id}
                                            type="button"
                                            onClick={() => setInspectorTab(tab.id)}
                                            className={`rounded-lg px-2 py-2 text-xs font-semibold transition ${inspectorTab === tab.id ? 'bg-white text-slate-950 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:bg-white/60 hover:text-slate-800'}`}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>

                                {inspectorTab === 'content' && (
                                    <div className={sidebarSectionClass}>
                                        <SettingsComponent block={selectedBlock} onUpdate={(props) => updateBlock(selectedBlock.id, props)} />
                                    </div>
                                )}

                                {inspectorTab === 'style' && (
                                    <div className={sidebarSectionClass}>
                                        <StyleInspector
                                            block={selectedBlock}
                                            onUpdate={(props) => updateBlock(selectedBlock.id, props)}
                                        />
                                    </div>
                                )}

                                {inspectorTab === 'advanced' && (
                                    <div className={sidebarSectionClass}>
                                        <div className="space-y-3">
                                            <label className="block">
                                                <span className="text-[11px] font-semibold uppercase text-slate-400">Nom dans la structure</span>
                                                <input
                                                    value={(selectedBlock.props.label as string) || ''}
                                                    onChange={(event) => updateBlock(selectedBlock.id, { label: event.target.value })}
                                                    placeholder={registryEntry?.label || selectedBlock.type}
                                                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                                                />
                                            </label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => updateBlock(selectedBlock.id, { hidden: !selectedBlock.props.hidden })}
                                                    className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition ${selectedBlock.props.hidden ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                                                >
                                                    {selectedBlock.props.hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                                    {selectedBlock.props.hidden ? 'Masque' : 'Visible'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => updateBlock(selectedBlock.id, { locked: !selectedBlock.props.locked })}
                                                    className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition ${selectedBlock.props.locked ? 'border-slate-300 bg-slate-100 text-slate-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                                                >
                                                    {selectedBlock.props.locked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                                                    {selectedBlock.props.locked ? 'Verrouille' : 'Libre'}
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => duplicateBlock(selectedBlock.id)}
                                                    className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                                                >
                                                    <CopyPlus className="h-3.5 w-3.5" />
                                                    Dupliquer
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setPatternBlockIds([selectedBlock.id])}
                                                    className="flex items-center justify-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
                                                >
                                                    <Save className="h-3.5 w-3.5" />
                                                    Pattern
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={Boolean(selectedBlock.props.locked)}
                                                    onClick={() => setPendingDeleteId(selectedBlock.id)}
                                                    className="flex items-center justify-center gap-1.5 rounded-lg border border-red-100 bg-white px-2 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                    Supprimer
                                                </button>
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-semibold uppercase text-slate-400">Identifiant</p>
                                                <p className="mt-1 truncate rounded-lg bg-slate-50 px-3 py-2 text-xs font-mono text-slate-600">{selectedBlock.id}</p>
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-semibold uppercase text-slate-400">Type</p>
                                                <p className="mt-1 rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">{selectedBlock.type}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <EmptyState>
                                <p>Sélectionnez un bloc pour modifier ses styles.</p>
                            </EmptyState>
                        )}
                    </>
                )}
            </div>
            <SavePatternDialog
                open={Boolean(patternBlockIds)}
                onClose={() => setPatternBlockIds(null)}
                blockIds={patternBlockIds ?? undefined}
            />
        </div>
    );
}
