import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useBuilderStore } from '@/stores/builder-store';
import { getBlock } from './blocks/block-registry';
import { getBlockColorScheme } from './block-colors';
import type { BlockNode } from '@/types/cms';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { GripVertical, ChevronUp, ChevronDown, Copy, CopyPlus, Trash2 } from 'lucide-react';
import BlockContextMenu from './block-context-menu';
import { getSpacingStyle } from './blocks/shared/spacing-utils';

interface SortableBlockProps {
    block: BlockNode;
}

export default function SortableBlock({ block }: SortableBlockProps) {
    const { selectedBlockId, hoveredBlockId, selectBlock, setHoveredBlock, duplicateBlock, copyBlock, moveBlockUp, moveBlockDown, setPendingDeleteId, isDragging: storeDragging, updateBlock } = useBuilderStore();
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
    const isSelected = selectedBlockId === block.id;
    const isHovered = hoveredBlockId === block.id;

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: block.id,
        data: { type: 'block', block },
    });

    const spacingStyle = getSpacingStyle(block.props, { skipPadding: block.type === 'section' });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        ...spacingStyle,
    };

    const entry = getBlock(block.type);
    const Renderer = entry?.renderer;
    const hasChildren = block.type === 'section' || block.type === 'grid';
    const colors = getBlockColorScheme(entry?.category ?? 'content');

    const childContent = hasChildren && block.children?.length ? (
        <SortableContext items={block.children.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-1">
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
        <div
            ref={setNodeRef}
            style={style}
            data-block-id={block.id}
            className={`relative group/block rounded transition-all ${isSelected ? `ring-2 ${colors.ring}` : isHovered ? `ring-1 ${colors.ringHover}` : 'ring-1 ring-transparent hover:ring-gray-200'}`}
            onClick={handleClick}
            onContextMenu={handleContextMenu}
            onMouseEnter={(e) => { e.stopPropagation(); setHoveredBlock(block.id); }}
            onMouseLeave={(e) => { e.stopPropagation(); setHoveredBlock(null); }}
        >
            {/* Actions toolbar */}
            {(isSelected || isHovered) && (
                <div className="absolute -top-3 right-2 z-20 flex items-center gap-0.5 bg-white shadow-sm border rounded-md px-1 py-0.5">
                    <button {...attributes} {...listeners} className="p-1 text-gray-400 hover:text-gray-600 cursor-grab" title="Deplacer">
                        <GripVertical className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); moveBlockUp(block.id); }} className="p-1 text-gray-400 hover:text-gray-600" title="Monter">
                        <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); moveBlockDown(block.id); }} className="p-1 text-gray-400 hover:text-gray-600" title="Descendre">
                        <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-px h-3.5 bg-gray-200 mx-0.5" />
                    <button onClick={(e) => { e.stopPropagation(); copyBlock(block.id); }} className="p-1 text-gray-400 hover:text-blue-600" title="Copier">
                        <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); duplicateBlock(block.id); }} className="p-1 text-gray-400 hover:text-blue-600" title="Dupliquer">
                        <CopyPlus className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setPendingDeleteId(block.id); }} className="p-1 text-gray-400 hover:text-red-600" title="Supprimer">
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}

            {/* Block type label */}
            {(isSelected || isHovered) && (
                <div className={`absolute -top-3 left-2 z-20 ${colors.label} text-white text-[10px] px-1.5 py-0.5 rounded font-medium`}>
                    {entry?.label || block.type}
                </div>
            )}

            {/* Renderer */}
            <div>
                {Renderer ? <Renderer block={block} isSelected={isSelected} isEditing={true} onUpdate={(props) => updateBlock(block.id, props)}>{childContent}</Renderer> : (
                    <div className="bg-gray-50 border border-dashed p-4 text-center text-gray-400 text-sm">Bloc inconnu: {block.type}</div>
                )}
            </div>

            {/* Context menu */}
            {contextMenu && (
                <BlockContextMenu
                    blockId={block.id}
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onClose={() => setContextMenu(null)}
                />
            )}
        </div>
    );
}
