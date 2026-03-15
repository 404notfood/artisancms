import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { useBuilderStore } from '@/stores/builder-store';
import SortableBlock from './sortable-block';

export default function BuilderCanvas() {
    const { blocks, viewport, selectBlock } = useBuilderStore();

    const viewportWidths = { desktop: '100%', tablet: '768px', mobile: '375px' };

    // Make the entire canvas a drop target for new blocks from sidebar
    const { setNodeRef, isOver } = useDroppable({
        id: 'canvas-drop-zone',
        data: { type: 'canvas' },
    });

    return (
        <div
            ref={setNodeRef}
            className={`flex-1 bg-gray-100 overflow-auto p-6 ${isOver ? 'ring-2 ring-blue-300 ring-inset' : ''}`}
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
                            <p className="text-gray-400 text-xs mt-1">ou cliquez sur un bloc dans la barre latérale</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
