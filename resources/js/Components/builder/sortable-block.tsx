import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { findParentInfo, useBuilderStore } from '@/stores/builder-store';
import { getBlock } from './blocks/block-registry';
import { getBlockColorScheme } from './block-colors';
import type { BlockNode } from '@/types/cms';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { GripVertical, ChevronUp, ChevronDown, Copy, CopyPlus, Trash2 } from 'lucide-react';
import BlockContextMenu from './block-context-menu';
import { getSpacingStyle } from './blocks/shared/spacing-utils';

type Viewport = 'desktop' | 'tablet' | 'mobile';

interface SortableBlockProps {
    block: BlockNode;
}

interface InsertZoneProps {
    blockId: string;
    position: 'before' | 'after';
}

function InsertZone({ blockId, position }: InsertZoneProps) {
    const { blocks, isDragging, isPreviewMode } = useBuilderStore();
    const info = findParentInfo(blocks, blockId);
    const { isOver, setNodeRef } = useDroppable({
        id: `insert-${position}:${blockId}`,
        data: {
            type: 'insert-zone',
            parentId: info?.parentId ?? null,
            index: position === 'before' ? info?.index ?? 0 : (info?.index ?? 0) + 1,
        },
        disabled: isPreviewMode || !isDragging || !info,
    });

    if (isPreviewMode || !isDragging) return null;

    return (
        <div ref={setNodeRef} className="relative h-3" style={{ gridColumn: '1 / -1' }}>
            <div className={`absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full transition ${isOver ? 'bg-blue-500 shadow-[0_0_0_4px_rgba(59,130,246,0.16)]' : 'bg-transparent'}`} />
            {isOver && (
                <div className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500 ring-4 ring-blue-100" />
            )}
        </div>
    );
}

function getResponsiveValue<T>(block: BlockNode, viewport: Viewport, key: string, fallback: T): T {
    const responsive = block.props.responsive as Record<string, Record<string, unknown>> | undefined;
    const value = responsive?.[viewport]?.[key];
    return value === undefined || value === null || value === '' ? fallback : value as T;
}

export default function SortableBlock({ block }: SortableBlockProps) {
    const { selectedBlockId, hoveredBlockId, selectBlock, setHoveredBlock, duplicateBlock, copyBlock, moveBlockUp, moveBlockDown, setPendingDeleteId, isDragging: storeDragging, updateBlock, isPreviewMode, viewport } = useBuilderStore();
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
    const isSelected = selectedBlockId === block.id;
    const isHovered = hoveredBlockId === block.id;
    const isLocked = Boolean(block.props.locked);
    const isHiddenForViewport = Boolean(getResponsiveValue(block, viewport, 'hidden', block.props.hidden));

    if (isPreviewMode && isHiddenForViewport) {
        return null;
    }

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: block.id,
        data: { type: 'block', block },
        disabled: isPreviewMode || isLocked,
    });

    const spacingStyle = getSpacingStyle(block.props, { skipPadding: block.type === 'section' });

    const columnSpan = block.type === 'column' ? Math.max(1, Math.min(12, Number(getResponsiveValue(block, viewport, 'span', block.props.span)) || 6)) : null;
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : (!isPreviewMode && isHiddenForViewport ? 0.45 : 1),
        ...(columnSpan ? { gridColumn: `span ${columnSpan} / span ${columnSpan}` } : {}),
        ...spacingStyle,
    };

    const entry = getBlock(block.type);
    const Renderer = entry?.renderer;
    const hasChildren = block.type === 'section' || block.type === 'grid' || block.type === 'row' || block.type === 'column';
    const colors = getBlockColorScheme(entry?.category ?? 'content');

    const childContent = hasChildren && block.children?.length ? (
        <SortableContext items={block.children.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            <div className={block.type === 'grid' || block.type === 'row' ? 'contents' : 'space-y-2'}>
                {block.children.map((child) => (
                    <SortableBlock key={child.id} block={child} />
                ))}
            </div>
        </SortableContext>
    ) : undefined;

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;
        const thisNode = e.currentTarget as HTMLElement;
        const closestBlock = target.closest('[data-block-id]');
        if (closestBlock === thisNode) {
            e.stopPropagation();
            selectBlock(block.id);
        }
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        if (storeDragging) return;
        const target = e.target as HTMLElement;
        const thisNode = e.currentTarget as HTMLElement;
        const closestBlock = target.closest('[data-block-id]');
        if (closestBlock !== thisNode) return;

        e.preventDefault();
        e.stopPropagation();
        selectBlock(block.id);
        setContextMenu({ x: e.clientX, y: e.clientY });
    };

    return (
        <>
            <InsertZone blockId={block.id} position="before" />
            <div
                ref={setNodeRef}
                style={style}
                data-block-id={block.id}
                className={`relative group/block rounded-lg transition-all ${isPreviewMode ? '' : isSelected ? `ring-2 ${colors.ring} shadow-[0_0_0_4px_rgba(255,255,255,0.95),0_12px_30px_rgba(15,23,42,0.12)]` : isHovered ? `ring-1 ${colors.ringHover} shadow-sm` : 'ring-1 ring-transparent hover:ring-slate-200 hover:shadow-sm'}`}
                onClick={handleClick}
                onContextMenu={handleContextMenu}
                onMouseEnter={(e) => { e.stopPropagation(); setHoveredBlock(block.id); }}
                onMouseLeave={(e) => { e.stopPropagation(); setHoveredBlock(null); }}
            >
                {/* Actions toolbar */}
                {!isPreviewMode && (isSelected || isHovered) && (
                    <div className="absolute -top-4 right-2 z-20 flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white/95 px-1 py-0.5 shadow-lg backdrop-blur">
                        <button {...attributes} {...listeners} disabled={isLocked} className={`rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 ${isLocked ? 'cursor-not-allowed opacity-40' : 'cursor-grab'}`} title={isLocked ? 'Bloc verrouille' : 'Deplacer'}>
                            <GripVertical className="w-3.5 h-3.5" />
                        </button>
                        <button disabled={isLocked} onClick={(e) => { e.stopPropagation(); moveBlockUp(block.id); }} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40" title="Monter">
                            <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button disabled={isLocked} onClick={(e) => { e.stopPropagation(); moveBlockDown(block.id); }} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40" title="Descendre">
                            <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <div className="w-px h-3.5 bg-slate-200 mx-0.5" />
                        <button onClick={(e) => { e.stopPropagation(); copyBlock(block.id); }} className="rounded-md p-1 text-slate-400 hover:bg-blue-50 hover:text-blue-600" title="Copier">
                            <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); duplicateBlock(block.id); }} className="rounded-md p-1 text-slate-400 hover:bg-blue-50 hover:text-blue-600" title="Dupliquer">
                            <CopyPlus className="w-3.5 h-3.5" />
                        </button>
                        <button disabled={isLocked} onClick={(e) => { e.stopPropagation(); setPendingDeleteId(block.id); }} className="rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40" title="Supprimer">
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}

                {/* Block type label */}
                {!isPreviewMode && (isSelected || isHovered) && (
                    <div className={`absolute -top-4 left-2 z-20 ${colors.label} rounded-md px-2 py-1 text-[10px] font-semibold text-white shadow-sm`}>
                        {isLocked ? 'Verrouille - ' : ''}{isHiddenForViewport ? 'Masque - ' : ''}{entry?.label || block.type}
                    </div>
                )}

                {/* Renderer */}
                <div>
                    {Renderer ? <Renderer block={block} isSelected={isSelected} isEditing={!isPreviewMode} onUpdate={(props) => updateBlock(block.id, props)}>{childContent}</Renderer> : (
                        <div className="bg-gray-50 border border-dashed p-4 text-center text-gray-400 text-sm">Bloc inconnu: {block.type}</div>
                    )}
                </div>

                {/* Context menu */}
                {!isPreviewMode && contextMenu && (
                    <BlockContextMenu
                        blockId={block.id}
                        x={contextMenu.x}
                        y={contextMenu.y}
                        onClose={() => setContextMenu(null)}
                    />
                )}
            </div>
            <InsertZone blockId={block.id} position="after" />
        </>
    );
}
