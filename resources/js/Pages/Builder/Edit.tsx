import { useCallback, useEffect, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { DndContext, DragOverlay, pointerWithin, DragStartEvent, DragEndEvent, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { useBuilderStore, findParentInfo } from '@/stores/builder-store';
import { registerCoreBlocks } from '@/Components/builder/blocks/register-core-blocks';
import BuilderToolbar from '@/Components/builder/builder-toolbar';
import BuilderCanvas from '@/Components/builder/builder-canvas';
import BuilderSidebar from '@/Components/builder/builder-sidebar';
import DeleteConfirmDialog from '@/Components/builder/delete-confirm-dialog';
import type { BlockNode, PageData } from '@/types/cms';

const CONTAINER_TYPES = new Set(['section', 'grid', 'column']);

interface BuilderEditProps {
    page: PageData;
}

export default function BuilderEdit({ page }: BuilderEditProps) {
    const setBlocks = useBuilderStore((s) => s.setBlocks);
    const blocks = useBuilderStore((s) => s.blocks);
    const addBlock = useBuilderStore((s) => s.addBlock);
    const moveBlock = useBuilderStore((s) => s.moveBlock);
    const setIsDragging = useBuilderStore((s) => s.setIsDragging);
    const isDragging = useBuilderStore((s) => s.isDragging);

    useEffect(() => {
        registerCoreBlocks();

        const raw = page.content;
        const initialBlocks: BlockNode[] = Array.isArray(raw)
            ? raw
            : (raw as Record<string, unknown> | null)?.blocks as BlockNode[] ?? [];
        setBlocks(initialBlocks);
    }, [page.id, setBlocks]);

    const [isSaving, setIsSaving] = useState(false);
    const [activeDragData, setActiveDragData] = useState<Record<string, unknown> | null>(null);

    const handleSave = useCallback(() => {
        setIsSaving(true);
        const currentBlocks = useBuilderStore.getState().blocks;
        router.put(
            `/admin/pages/${page.id}/builder`,
            // Inertia's RequestPayload type doesn't support deeply nested objects like BlockNode[],
            // but the data is correctly serialized at runtime.
            { content: currentBlocks } as any,
            { preserveState: true, preserveScroll: true, onFinish: () => setIsSaving(false) },
        );
    }, [page.id]);

    const handlePublish = useCallback(() => {
        router.post(`/admin/pages/${page.id}/publish`, {}, { preserveState: true });
    }, [page.id]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    );

    const handleDragStart = useCallback((event: DragStartEvent) => {
        setIsDragging(true);
        setActiveDragData(event.active.data.current ?? null);
    }, [setIsDragging]);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        setIsDragging(false);
        setActiveDragData(null);
        const { active, over } = event;
        if (!over) return;

        const activeData = active.data.current;
        const overData = over.data.current;

        if (activeData?.type === 'new-block') {
            const blockType = activeData.blockType as string;
            let parentId: string | undefined;
            let index: number | undefined;

            if (overData?.block) {
                const overBlock = overData.block as { id: string; type: string; children?: unknown[] };

                if (CONTAINER_TYPES.has(overBlock.type)) {
                    parentId = overBlock.id;
                    index = overBlock.children?.length ?? 0;
                } else {
                    const info = findParentInfo(blocks, overBlock.id);
                    if (info) {
                        parentId = info.parentId ?? undefined;
                        index = info.index + 1;
                    }
                }
            }

            addBlock(blockType, parentId, index);
        } else if (activeData?.type === 'block') {
            if (active.id === over.id) return;

            if (over.id === 'canvas-drop-zone') {
                moveBlock(active.id as string, null, blocks.length);
            } else if (overData?.block) {
                const overBlock = overData.block as { id: string; type: string; children?: unknown[] };

                if (CONTAINER_TYPES.has(overBlock.type) && active.id !== over.id) {
                    moveBlock(active.id as string, overBlock.id, overBlock.children?.length ?? 0);
                } else {
                    const info = findParentInfo(blocks, overBlock.id);
                    if (info) {
                        moveBlock(active.id as string, info.parentId, info.index);
                    }
                }
            }
        }
    }, [addBlock, moveBlock, blocks]);

    const handleDragCancel = useCallback(() => {
        setIsDragging(false);
    }, [setIsDragging]);

    useEffect(() => {
        const onBeforeUnload = (e: BeforeUnloadEvent) => {
            if (useBuilderStore.getState().isDirty) {
                e.preventDefault();
            }
        };
        window.addEventListener('beforeunload', onBeforeUnload);
        return () => window.removeEventListener('beforeunload', onBeforeUnload);
    }, []);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            const mod = e.ctrlKey || e.metaKey;

            if (mod && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                useBuilderStore.getState().undo();
                return;
            }

            if (mod && ((e.key === 'z' && e.shiftKey) || e.key === 'y')) {
                e.preventDefault();
                useBuilderStore.getState().redo();
                return;
            }

            if (mod && e.key === 's') {
                e.preventDefault();
                handleSave();
                return;
            }

            if (mod && e.key === 'c' && !isEditableTarget(e.target)) {
                const { selectedBlockId, copyBlock } = useBuilderStore.getState();
                if (selectedBlockId) {
                    e.preventDefault();
                    copyBlock(selectedBlockId);
                }
                return;
            }

            if (mod && e.key === 'v' && !isEditableTarget(e.target)) {
                const state = useBuilderStore.getState();
                if (state.clipboard && state.selectedBlockId) {
                    e.preventDefault();
                    const info = findParentInfo(state.blocks, state.selectedBlockId);
                    if (info) {
                        state.pasteBlock(info.parentId, info.index + 1);
                    }
                }
                return;
            }

            if (mod && e.key === 'd' && !isEditableTarget(e.target)) {
                const { selectedBlockId, duplicateBlock } = useBuilderStore.getState();
                if (selectedBlockId) {
                    e.preventDefault();
                    duplicateBlock(selectedBlockId);
                }
                return;
            }

            if ((e.key === 'Delete' || e.key === 'Backspace') && !isEditableTarget(e.target)) {
                const { selectedBlockId, setPendingDeleteId, removeBlock } = useBuilderStore.getState();
                if (selectedBlockId) {
                    e.preventDefault();
                    if (e.key === 'Delete' && e.shiftKey) {
                        removeBlock(selectedBlockId);
                    } else {
                        setPendingDeleteId(selectedBlockId);
                    }
                }
                return;
            }

            if (e.key === 'Escape') {
                useBuilderStore.getState().selectBlock(null);
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [handleSave]);

    return (
        <>
            <Head title={`Builder - ${page.title}`} />

            <DndContext
                sensors={sensors}
                collisionDetection={pointerWithin}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragCancel={handleDragCancel}
            >
                <div className="h-screen flex flex-col overflow-hidden">
                    <BuilderToolbar
                        title={page.title}
                        onSave={handleSave}
                        onPublish={handlePublish}
                        isSaving={isSaving}
                    />

                    <div className="flex flex-1 overflow-hidden">
                        <BuilderSidebar />
                        <BuilderCanvas />
                    </div>
                </div>

                <DragOverlay dropAnimation={null}>
                    {isDragging && activeDragData ? (
                        <div className="rounded-lg border-2 border-blue-400 bg-white px-4 py-3 shadow-lg">
                            <span className="text-sm font-medium text-blue-600">
                                {(activeDragData.blockType as string) || (activeDragData.block as { type?: string })?.type || 'Bloc'}
                            </span>
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>

            <DeleteConfirmDialog />
        </>
    );
}

function isEditableTarget(target: EventTarget | null): boolean {
    if (!target || !(target instanceof HTMLElement)) return false;
    const tag = target.tagName.toLowerCase();
    return tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable;
}
