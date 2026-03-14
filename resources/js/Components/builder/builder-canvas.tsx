import { useCallback } from 'react';
import { DndContext, DragOverlay, pointerWithin, DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useBuilderStore } from '@/stores/builder-store';
import { getBlock } from './blocks/block-registry';
import SortableBlock from './sortable-block';

export default function BuilderCanvas() {
    const { blocks, viewport, addBlock, moveBlock, selectBlock, setIsDragging, isDragging, findBlock } = useBuilderStore();

    const viewportWidths = { desktop: '100%', tablet: '768px', mobile: '375px' };

    const handleDragStart = useCallback((_event: DragStartEvent) => {
        setIsDragging(true);
    }, [setIsDragging]);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        setIsDragging(false);
        const { active, over } = event;
        if (!over) return;

        const activeData = active.data.current;

        if (activeData?.type === 'new-block') {
            // Adding new block from sidebar
            const blockType = activeData.blockType as string;
            const overData = over.data.current;
            const parentId = overData?.block?.type === 'section' || overData?.block?.type === 'grid'
                ? (overData.block.id as string) : undefined;
            addBlock(blockType, parentId, undefined);
        } else if (activeData?.type === 'block') {
            // Reordering existing block
            if (active.id === over.id) return;
            const overIndex = blocks.findIndex((b) => b.id === over.id);
            if (overIndex !== -1) {
                moveBlock(active.id as string, null, overIndex);
            }
        }
    }, [addBlock, moveBlock, blocks]);

    const handleDragCancel = useCallback(() => {
        setIsDragging(false);
    }, [setIsDragging]);

    const activeDragBlock = isDragging ? null : null; // DragOverlay simplified

    return (
        <DndContext
            collisionDetection={pointerWithin}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
        >
            <div
                className="flex-1 bg-gray-100 overflow-auto p-6"
                onClick={() => selectBlock(null)}
            >
                <div
                    className="mx-auto bg-white min-h-[calc(100vh-100px)] shadow-sm rounded-lg transition-all"
                    style={{ maxWidth: viewportWidths[viewport] }}
                >
                    {blocks.length > 0 ? (
                        <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                            <div className="space-y-1 p-4">
                                {blocks.map((block) => (
                                    <SortableBlock key={block.id} block={block} />
                                ))}
                            </div>
                        </SortableContext>
                    ) : (
                        <div className="flex items-center justify-center h-[400px]">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.5v15m7.5-7.5h-15" />
                                    </svg>
                                </div>
                                <p className="text-gray-500 text-sm font-medium">Glissez un bloc ici pour commencer</p>
                                <p className="text-gray-400 text-xs mt-1">ou cliquez sur un bloc dans la barre laterale</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <DragOverlay dropAnimation={null}>
                {isDragging ? (
                    <div className="bg-blue-50 border-2 border-blue-300 rounded-md px-4 py-2 text-sm text-blue-700 font-medium shadow-lg opacity-80">
                        Bloc en cours de deplacement...
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
