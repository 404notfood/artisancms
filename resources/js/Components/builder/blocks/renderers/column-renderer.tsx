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

export default function ColumnRenderer({ block, children, isEditing }: BlockRendererProps) {
    const viewport = useBuilderStore((state) => state.viewport);
    const props = responsiveProps(block.props ?? {}, viewport);
    const backgroundColor = props.backgroundColor as string | undefined;
    const borderColor = props.borderColor as string | undefined;
    const borderRadius = Number(props.borderRadius) || undefined;
    const borderWidth = Number(props.borderWidth) || undefined;
    const boxShadow = props.boxShadow as string | undefined;
    const color = props.color as string | undefined;
    const textAlign = props.textAlign as 'left' | 'center' | 'right' | undefined;
    const padding = Number(props.padding) || 16;
    const minHeight = Number(props.minHeight) || 120;
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
            className={`relative h-full rounded-xl transition-all ${isEditing ? 'border border-dashed border-slate-200' : ''} ${isOver ? 'border-blue-400 bg-blue-50/80 ring-4 ring-blue-100' : ''}`}
            style={{
                backgroundColor,
                borderColor,
                borderRadius: borderRadius ? `${borderRadius}px` : undefined,
                borderStyle: borderWidth ? 'solid' : undefined,
                borderWidth: borderWidth ? `${borderWidth}px` : undefined,
                boxShadow,
                color,
                textAlign,
                minHeight: `${minHeight}px`,
                padding: `${padding}px`,
            }}
        >
            {hasChildren ? (
                <>
                    {children}
                    {isEditing && (
                        <div className={`mt-3 flex min-h-9 items-center justify-center rounded-lg border border-dashed px-3 py-2 text-xs font-semibold transition ${isOver ? 'border-blue-400 bg-white text-blue-700' : 'border-slate-200 bg-slate-50/80 text-slate-400 opacity-0 group-hover/block:opacity-100'}`}>
                            <Plus className="mr-1.5 h-3.5 w-3.5" />
                            Ajouter dans cette colonne
                        </div>
                    )}
                </>
            ) : (
                isEditing && (
                    <div className={`flex min-h-full flex-col items-center justify-center rounded-lg border-2 border-dashed px-3 py-5 text-center transition ${isOver ? 'border-blue-400 bg-white text-blue-700 shadow-sm' : 'border-slate-300 bg-slate-50/80 text-slate-500'}`}>
                        <span className={`mb-2 flex h-8 w-8 items-center justify-center rounded-full ${isOver ? 'bg-blue-100 text-blue-700' : 'bg-white text-slate-400 shadow-sm ring-1 ring-slate-200'}`}>
                            <Plus className="h-4 w-4" />
                        </span>
                        <span className="text-sm font-semibold">Deposez ici</span>
                        <span className="mt-1 text-xs text-slate-400">Contenu de la colonne</span>
                    </div>
                )
            )}
        </div>
    );
}
