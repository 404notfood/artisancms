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

export default function RowRenderer({ block, children, isEditing }: BlockRendererProps) {
    const viewport = useBuilderStore((state) => state.viewport);
    const props = responsiveProps(block.props ?? {}, viewport);
    const gap = Number(props.gap) || 20;
    const verticalAlign = (props.verticalAlign as string) || 'stretch';
    const backgroundColor = props.backgroundColor as string | undefined;
    const borderColor = props.borderColor as string | undefined;
    const borderRadius = Number(props.borderRadius) || undefined;
    const borderWidth = Number(props.borderWidth) || undefined;
    const boxShadow = props.boxShadow as string | undefined;
    const color = props.color as string | undefined;
    const textAlign = props.textAlign as 'left' | 'center' | 'right' | undefined;
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
            className={`relative grid w-full grid-cols-12 rounded-xl transition-all ${isEditing ? 'min-h-[96px]' : ''} ${isOver ? 'bg-indigo-50/70 ring-4 ring-indigo-100' : ''}`}
            style={{
                gap: `${gap}px`,
                alignItems: verticalAlign,
                backgroundColor,
                borderColor,
                borderRadius: borderRadius ? `${borderRadius}px` : undefined,
                borderStyle: borderWidth ? 'solid' : undefined,
                borderWidth: borderWidth ? `${borderWidth}px` : undefined,
                boxShadow,
                color,
                textAlign,
            }}
        >
            {hasChildren ? (
                <>
                    {children}
                    {isEditing && (
                        <div
                            className={`flex min-h-10 items-center justify-center rounded-lg border border-dashed px-3 py-2 text-xs font-semibold transition ${isOver ? 'border-indigo-400 bg-white text-indigo-700' : 'border-slate-200 bg-slate-50/80 text-slate-400 opacity-0 group-hover/block:opacity-100'}`}
                            style={{ gridColumn: '1 / -1' }}
                        >
                            <Plus className="mr-1.5 h-3.5 w-3.5" />
                            Deposer une colonne ou un bloc
                        </div>
                    )}
                </>
            ) : (
                isEditing && (
                    <div
                        className={`flex min-h-[96px] flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition ${isOver ? 'border-indigo-400 bg-white text-indigo-700 shadow-sm' : 'border-slate-300 bg-slate-50/80 text-slate-500'}`}
                        style={{ gridColumn: '1 / -1' }}
                    >
                        <span className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm ring-1 ring-slate-200">
                            <Plus className="h-4 w-4" />
                        </span>
                        <span className="text-sm font-semibold">Ligne vide</span>
                        <span className="mt-1 text-xs text-slate-400">Ajoutez des colonnes, puis glissez vos blocs dedans</span>
                    </div>
                )
            )}
        </div>
    );
}
