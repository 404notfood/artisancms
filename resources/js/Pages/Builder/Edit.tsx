import { useCallback, useEffect, useState } from 'react';
import { Head, router } from '@inertiajs/react';
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

    useEffect(() => {
        // Register all core block types
        registerCoreBlocks();

        // Load page content into the builder store
        setBlocks(page.content ?? []);
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

    // Warn before navigating away with unsaved changes
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            const isDirty = useBuilderStore.getState().isDirty;
            if (isDirty) {
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
