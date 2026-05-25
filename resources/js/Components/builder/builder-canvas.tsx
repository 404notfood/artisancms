import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { Plus, Smartphone, Tablet, Monitor } from 'lucide-react';
import { useBuilderStore } from '@/stores/builder-store';
import SortableBlock from './sortable-block';

const viewportWidths = {
    desktop: '1180px',
    tablet: '768px',
    mobile: '375px',
};

const viewportLabels = {
    desktop: { label: 'Desktop', Icon: Monitor },
    tablet: { label: 'Tablette', Icon: Tablet },
    mobile: { label: 'Mobile', Icon: Smartphone },
};

export default function BuilderCanvas() {
    const { blocks, viewport, selectBlock, isPreviewMode } = useBuilderStore();
    const viewportMeta = viewportLabels[viewport];

    const { setNodeRef, isOver } = useDroppable({
        id: 'canvas-drop-zone',
        data: { type: 'canvas' },
        disabled: isPreviewMode,
    });

    return (
        <div
            ref={setNodeRef}
            className={`relative flex-1 overflow-auto transition ${isPreviewMode ? 'bg-slate-950 p-0' : 'bg-slate-100 p-6'} ${
                isOver && !isPreviewMode ? 'ring-2 ring-blue-400 ring-inset' : ''
            }`}
            onClick={() => selectBlock(null)}
        >
            {!isPreviewMode && (
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.055)_1px,transparent_1px)] bg-[size:28px_28px]" />
            )}

            <div className={`relative mx-auto flex w-full flex-col items-center ${isPreviewMode ? 'gap-0' : 'gap-3'}`}>
                {!isPreviewMode && (
                    <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm backdrop-blur">
                        <viewportMeta.Icon className="h-3.5 w-3.5" />
                        {viewportMeta.label}
                        <span className="h-1 w-1 rounded-full bg-slate-300" />
                        <span>{viewport === 'desktop' ? 'Largeur fluide' : viewportWidths[viewport]}</span>
                    </div>
                )}

                <div
                    className={`w-full overflow-hidden bg-white transition-all ${isPreviewMode ? 'min-h-[calc(100vh-64px)] rounded-none border-0 shadow-none' : 'min-h-[calc(100vh-150px)] rounded-xl border border-slate-200 shadow-[0_20px_60px_rgba(15,23,42,0.12)]'}`}
                    style={{ maxWidth: viewport === 'desktop' ? '100%' : viewportWidths[viewport] }}
                >
                    {blocks.length > 0 ? (
                        <SortableContext items={blocks.map((block) => block.id)} strategy={verticalListSortingStrategy}>
                            <div className={isPreviewMode ? '' : 'space-y-2 p-4'}>
                                {blocks.map((block) => (
                                    <SortableBlock key={block.id} block={block} />
                                ))}
                            </div>
                        </SortableContext>
                    ) : (
                        <div className="flex min-h-[460px] items-center justify-center p-8">
                            <div className="max-w-sm text-center">
                                <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-slate-500">
                                    <Plus className="h-7 w-7" />
                                </div>
                                <p className="text-sm font-semibold text-slate-800">Glissez un bloc ici pour commencer</p>
                                <p className="mt-1 text-xs text-slate-500">Vous pouvez aussi cliquer sur un bloc depuis la barre latérale.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
