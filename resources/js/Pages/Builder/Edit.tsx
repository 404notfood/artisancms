import { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { DndContext, DragOverlay, pointerWithin, DragStartEvent, DragEndEvent, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { useBuilderStore } from '@/stores/builder-store';
import { registerCoreBlocks } from '@/Components/builder/blocks/register-core-blocks';
import BuilderToolbar from '@/Components/builder/builder-toolbar';
import BuilderCanvas from '@/Components/builder/builder-canvas';
import BuilderSidebar from '@/Components/builder/builder-sidebar';
import type { PageData } from '@/types/cms';

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
        // Register all core block types
        registerCoreBlocks();

        // Load page content into the builder store
        // content is stored as { blocks: [...] } in DB, extract the array
        const raw = page.content;
        const initialBlocks = Array.isArray(raw)
            ? raw
            : (raw as any)?.blocks ?? [];
        setBlocks(initialBlocks);
    }, [page.id]);

    const [isSaving, setIsSaving] = useState(false);

    const handleSave = useCallback(() => {
        setIsSaving(true);
        router.put(
            `/admin/pages/${page.id}/builder`,
            { content: blocks } as any,
            { preserveState: true, preserveScroll: true, onFinish: () => setIsSaving(false) },
        );
    }, [page.id, blocks]);

    const handlePublish = useCallback(() => {
        router.post(`/admin/pages/${page.id}/publish`, {}, { preserveState: true });
    }, [page.id]);

    // Require 8px of movement before activating drag (so clicks work)
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    );

    // DnD handlers — shared context for sidebar + canvas
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

    // Warn before navigating away with unsaved changes
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            const dirty = useBuilderStore.getState().isDirty;
            if (dirty) {
                e.preventDefault();
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, []);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const isCtrlOrCmd = e.ctrlKey || e.metaKey;

            // Ctrl+Z = Undo
            if (isCtrlOrCmd && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                useBuilderStore.getState().undo();
            }

            // Ctrl+Shift+Z or Ctrl+Y = Redo
            if (isCtrlOrCmd && ((e.key === 'z' && e.shiftKey) || e.key === 'y')) {
                e.preventDefault();
                useBuilderStore.getState().redo();
            }

            // Ctrl+S = Save
            if (isCtrlOrCmd && e.key === 's') {
                e.preventDefault();
                const state = useBuilderStore.getState();
                router.put(
                    `/admin/pages/${page.id}/builder`,
                    { content: state.blocks } as any,
                    { preserveState: true, preserveScroll: true },
                );
            }

            // Delete or Backspace = remove selected block
            if ((e.key === 'Delete' || e.key === 'Backspace') && !isEditableTarget(e.target)) {
                const { selectedBlockId, removeBlock } = useBuilderStore.getState();
                if (selectedBlockId) {
                    e.preventDefault();
                    removeBlock(selectedBlockId);
                }
            }

            // Escape = deselect
            if (e.key === 'Escape') {
                useBuilderStore.getState().selectBlock(null);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [page.id]);

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
                    {/* Top toolbar */}
                    <BuilderToolbar
                        title={page.title}
                        onSave={handleSave}
                        onPublish={handlePublish}
                        isSaving={isSaving}
                    />

                    {/* Main content area: sidebar left, canvas right */}
                    <div className="flex flex-1 overflow-hidden">
                        <BuilderSidebar />
                        <BuilderCanvas />
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
        </>
    );
}

/** Check if the event target is an editable element (input, textarea, contentEditable) */
function isEditableTarget(target: EventTarget | null): boolean {
    if (!target || !(target instanceof HTMLElement)) return false;
    const tagName = target.tagName.toLowerCase();
    if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') return true;
    if (target.isContentEditable) return true;
    return false;
}
