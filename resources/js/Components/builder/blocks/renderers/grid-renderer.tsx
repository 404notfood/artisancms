import { useDroppable } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import type { BlockRendererProps } from '../block-registry';
import { useBuilderStore } from '@/stores/builder-store';

function responsiveProps(props: Record<string, unknown>, viewport: string) {
    return {
        ...props,
        ...((props.responsive as Record<string, Record<string, unknown>> | undefined)?.[viewport] ?? {}),
    };
}

export default function GridRenderer({ block, isEditing, children }: BlockRendererProps) {
    const viewport = useBuilderStore((state) => state.viewport);
    const props = responsiveProps(block.props ?? {}, viewport);
    const baseColumns = Number(block.props?.columns) || 2;
    const columns = Number(props.columns) || (viewport === 'mobile' ? 1 : viewport === 'tablet' ? Math.min(baseColumns, 2) : baseColumns);
    const gap = Number(props.gap) || (viewport === 'mobile' ? 12 : 16);
    const hasChildren = Boolean(children);

    const { isOver, setNodeRef } = useDroppable({
        id: `container:${block.id}`,
        data: {
            type: 'container-drop-zone',
            parentId: block.id,
            blockType: block.type,
        },
        disabled: !isEditing,
    });

    return (
        <div
            ref={setNodeRef}
            className={`w-full rounded-xl transition-all ${isEditing ? 'min-h-[80px]' : ''} ${isOver ? 'bg-blue-50/70 ring-4 ring-blue-100' : ''}`}
            style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gap: `${gap}px` }}
        >
            {hasChildren ? (
                <>
                    {children}
                    {isEditing && (
                        <div
                            className={`flex items-center justify-center rounded-lg border border-dashed px-3 py-2 text-xs font-semibold transition ${isOver ? 'border-blue-400 bg-white text-blue-700' : 'border-slate-200 bg-slate-50/80 text-slate-400 opacity-0 group-hover/block:opacity-100'}`}
                            style={{ gridColumn: '1 / -1' }}
                        >
                            <Plus className="mr-1.5 h-3.5 w-3.5" />
                            Deposer ici pour ajouter a la grille
                        </div>
                    )}
                </>
            ) : (
                isEditing ? (
                    <div
                        className={`rounded-xl border-2 border-dashed px-4 py-6 text-center transition ${isOver ? 'border-blue-400 bg-white text-blue-700 shadow-sm' : 'border-slate-300 bg-slate-50/80 text-slate-500'}`}
                        style={{ gridColumn: '1 / -1' }}
                    >
                        <div className="mb-4 grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
                            {Array.from({ length: columns }, (_, index) => (
                                <div key={index} className="flex min-h-[58px] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white/80 text-xs font-semibold text-slate-400">
                                    Col {index + 1}
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center justify-center text-sm font-semibold">
                            <Plus className="mr-1.5 h-4 w-4" />
                            Deposez des blocs dans cette grille
                        </div>
                    </div>
                ) : (
                    <div
                        className="rounded-lg border-2 border-dashed border-slate-300 p-4 text-center text-sm text-slate-400"
                        style={{ gridColumn: '1 / -1' }}
                    >
                        Grille vide
                    </div>
                )
            )}
        </div>
    );
}
