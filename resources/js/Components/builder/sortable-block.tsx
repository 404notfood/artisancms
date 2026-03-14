import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useBuilderStore } from '@/stores/builder-store';
import { getBlock } from './blocks/block-registry';
import type { BlockNode } from '@/types/cms';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { GripVertical, Copy, Trash2 } from 'lucide-react';

interface SortableBlockProps {
    block: BlockNode;
}

export default function SortableBlock({ block }: SortableBlockProps) {
    const { selectedBlockId, hoveredBlockId, selectBlock, setHoveredBlock, duplicateBlock, removeBlock } = useBuilderStore();
    const isSelected = selectedBlockId === block.id;
    const isHovered = hoveredBlockId === block.id;

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: block.id,
        data: { type: 'block', block },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };

    const entry = getBlock(block.type);
    const Renderer = entry?.renderer;
    const hasChildren = block.type === 'section' || block.type === 'grid';

    const childContent = hasChildren && block.children?.length ? (
        <SortableContext items={block.children.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-1">
                {block.children.map((child) => (
                    <SortableBlock key={child.id} block={child} />
                ))}
            </div>
        </SortableContext>
    ) : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`relative group rounded transition-all ${isSelected ? 'ring-2 ring-blue-500' : isHovered ? 'ring-1 ring-blue-300' : 'ring-1 ring-transparent hover:ring-gray-200'}`}
            onClick={(e) => { e.stopPropagation(); selectBlock(block.id); }}
            onMouseEnter={() => setHoveredBlock(block.id)}
            onMouseLeave={() => setHoveredBlock(null)}
        >
            {/* Actions toolbar */}
            {(isSelected || isHovered) && (
                <div className="absolute -top-3 right-2 z-20 flex items-center gap-0.5 bg-white shadow-sm border rounded-md px-1 py-0.5">
                    <button {...attributes} {...listeners} className="p-1 text-gray-400 hover:text-gray-600 cursor-grab" title="Deplacer">
                        <GripVertical className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); duplicateBlock(block.id); }} className="p-1 text-gray-400 hover:text-blue-600" title="Dupliquer">
                        <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }} className="p-1 text-gray-400 hover:text-red-600" title="Supprimer">
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}

            {/* Block type label */}
            {(isSelected || isHovered) && (
                <div className="absolute -top-3 left-2 z-20 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                    {entry?.label || block.type}
                </div>
            )}

            {/* Renderer */}
            <div className="pointer-events-none">
                {Renderer ? <Renderer block={block} isSelected={isSelected} isEditing={false}>{childContent}</Renderer> : (
                    <div className="bg-gray-50 border border-dashed p-4 text-center text-gray-400 text-sm">Bloc inconnu: {block.type}</div>
                )}
            </div>
        </div>
    );
}
