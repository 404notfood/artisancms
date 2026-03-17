import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { current } from 'immer';
import { nanoid } from 'nanoid';
import type { BlockNode } from '@/types/cms';

// --- Tree helper functions ---

const MAX_HISTORY = 50;

export function findBlockInTree(blocks: BlockNode[], id: string): BlockNode | null {
    for (const block of blocks) {
        if (block.id === id) return block;
        if (block.children?.length) {
            const found = findBlockInTree(block.children, id);
            if (found) return found;
        }
    }
    return null;
}

export function removeBlockFromTree(blocks: BlockNode[], id: string): boolean {
    for (let i = 0; i < blocks.length; i++) {
        if (blocks[i].id === id) {
            blocks.splice(i, 1);
            return true;
        }
        if (blocks[i].children?.length) {
            if (removeBlockFromTree(blocks[i].children!, id)) return true;
        }
    }
    return false;
}

export function insertBlockInTree(
    blocks: BlockNode[],
    parentId: string | null,
    index: number,
    block: BlockNode,
): boolean {
    if (parentId === null) {
        const clampedIndex = Math.max(0, Math.min(index, blocks.length));
        blocks.splice(clampedIndex, 0, block);
        return true;
    }

    for (const node of blocks) {
        if (node.id === parentId) {
            if (!node.children) node.children = [];
            const clampedIndex = Math.max(0, Math.min(index, node.children.length));
            node.children.splice(clampedIndex, 0, block);
            return true;
        }
        if (node.children?.length) {
            if (insertBlockInTree(node.children, parentId, index, block)) return true;
        }
    }
    return false;
}

export function cloneBlockDeep(block: BlockNode): BlockNode {
    const cloned: BlockNode = {
        id: nanoid(),
        type: block.type,
        props: structuredClone(block.props),
    };
    if (block.children?.length) {
        cloned.children = block.children.map(cloneBlockDeep);
    } else {
        cloned.children = [];
    }
    return cloned;
}

export function getBlockPathInTree(
    blocks: BlockNode[],
    id: string,
    path: string[] = [],
): string[] | null {
    for (const block of blocks) {
        if (block.id === id) return [...path, block.id];
        if (block.children?.length) {
            const found = getBlockPathInTree(block.children, id, [...path, block.id]);
            if (found) return found;
        }
    }
    return null;
}

export function flattenTree(blocks: BlockNode[]): BlockNode[] {
    const result: BlockNode[] = [];
    for (const block of blocks) {
        result.push(block);
        if (block.children?.length) {
            result.push(...flattenTree(block.children));
        }
    }
    return result;
}

/**
 * Find the parent block and the index of a given block within its parent's children.
 * Returns null if the block is at root level or not found.
 */
export function findParentInfo(
    blocks: BlockNode[],
    id: string,
): { parentId: string | null; index: number } | null {
    for (let i = 0; i < blocks.length; i++) {
        if (blocks[i].id === id) {
            return { parentId: null, index: i };
        }
        if (blocks[i].children?.length) {
            for (let j = 0; j < blocks[i].children!.length; j++) {
                if (blocks[i].children![j].id === id) {
                    return { parentId: blocks[i].id, index: j };
                }
            }
            const found = findParentInfo(blocks[i].children!, id);
            if (found) return found;
        }
    }
    return null;
}

// --- Internal helper to push history on a draft ---
function _pushHistoryOnDraft(state: {
    blocks: BlockNode[];
    history: BlockNode[][];
    historyIndex: number;
}) {
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    // Use current() to get plain JS from Immer draft, then structuredClone
    const snapshot = structuredClone(current(state.blocks)) as BlockNode[];
    newHistory.push(snapshot);

    if (newHistory.length > MAX_HISTORY) {
        newHistory.shift();
    }

    state.history = newHistory;
    state.historyIndex = newHistory.length - 1;
}

// --- Store ---

interface BuilderState {
    // State
    blocks: BlockNode[];
    selectedBlockId: string | null;
    hoveredBlockId: string | null;
    isDragging: boolean;
    viewport: 'desktop' | 'tablet' | 'mobile';
    history: BlockNode[][];
    historyIndex: number;
    isDirty: boolean;
    clipboard: BlockNode | null;
    styleClipboard: Record<string, unknown> | null;
    pendingDeleteId: string | null;

    // Block operations
    setBlocks: (blocks: BlockNode[]) => void;
    addBlock: (
        type: string,
        parentId?: string,
        index?: number,
        defaultProps?: Record<string, unknown>,
    ) => string;
    updateBlock: (id: string, props: Partial<BlockNode['props']>) => void;
    removeBlock: (id: string) => void;
    moveBlock: (id: string, newParentId: string | null, newIndex: number) => void;
    duplicateBlock: (id: string) => string | null;
    copyBlock: (id: string) => void;
    pasteBlock: (parentId: string | null, index: number) => string | null;
    copyStyles: (id: string) => void;
    pasteStyles: (id: string) => void;
    moveBlockUp: (id: string) => void;
    moveBlockDown: (id: string) => void;
    setPendingDeleteId: (id: string | null) => void;
    confirmDelete: () => void;

    // Selection
    selectBlock: (id: string | null) => void;
    setHoveredBlock: (id: string | null) => void;

    // Drag
    setIsDragging: (dragging: boolean) => void;

    // Viewport
    setViewport: (viewport: 'desktop' | 'tablet' | 'mobile') => void;

    // History (undo/redo)
    undo: () => void;
    redo: () => void;
    canUndo: () => boolean;
    canRedo: () => boolean;
    pushHistory: () => void;

    // Helpers
    findBlock: (id: string) => BlockNode | null;
    getBlockPath: (id: string) => string[];
    flattenBlocks: () => BlockNode[];
}

export const useBuilderStore = create<BuilderState>()(
    immer((set, get) => ({
        // Initial state
        blocks: [],
        selectedBlockId: null,
        hoveredBlockId: null,
        isDragging: false,
        viewport: 'desktop',
        history: [[]],
        historyIndex: 0,
        isDirty: false,
        clipboard: null,
        styleClipboard: null,
        pendingDeleteId: null,

        // Block operations

        setBlocks: (blocks) => {
            set((state) => {
                state.blocks = blocks;
                state.selectedBlockId = null;
                state.hoveredBlockId = null;
                state.isDirty = false;
                // blocks here is a plain array (not a draft), safe to structuredClone
                state.history = [structuredClone(blocks)];
                state.historyIndex = 0;
            });
        },

        addBlock: (type, parentId, index, defaultProps) => {
            const id = nanoid();
            const newBlock: BlockNode = {
                id,
                type,
                props: defaultProps ?? {},
                children: [],
            };

            set((state) => {
                _pushHistoryOnDraft(state);
                const targetIndex = index ?? (parentId
                    ? (findBlockInTree(state.blocks, parentId)?.children?.length ?? 0)
                    : state.blocks.length);
                insertBlockInTree(state.blocks, parentId ?? null, targetIndex, newBlock);
                state.selectedBlockId = id;
                state.isDirty = true;
            });

            return id;
        },

        updateBlock: (id, props) => {
            set((state) => {
                const block = findBlockInTree(state.blocks, id);
                if (block) {
                    _pushHistoryOnDraft(state);
                    Object.assign(block.props, props);
                    state.isDirty = true;
                }
            });
        },

        removeBlock: (id) => {
            set((state) => {
                _pushHistoryOnDraft(state);
                removeBlockFromTree(state.blocks, id);
                if (state.selectedBlockId === id) {
                    state.selectedBlockId = null;
                }
                if (state.hoveredBlockId === id) {
                    state.hoveredBlockId = null;
                }
                state.isDirty = true;
            });
        },

        moveBlock: (id, newParentId, newIndex) => {
            set((state) => {
                const block = findBlockInTree(state.blocks, id);
                if (!block) return;

                // Use current() to get plain JS from Immer draft before cloning
                const blockClone = structuredClone(current(block)) as BlockNode;

                _pushHistoryOnDraft(state);
                removeBlockFromTree(state.blocks, id);
                insertBlockInTree(state.blocks, newParentId, newIndex, blockClone);
                state.isDirty = true;
            });
        },

        duplicateBlock: (id) => {
            const state = get();
            const block = findBlockInTree(state.blocks, id);
            if (!block) return null;

            const cloned = cloneBlockDeep(block);
            const parentInfo = findParentInfo(state.blocks, id);

            set((draft) => {
                _pushHistoryOnDraft(draft);
                const insertIndex = parentInfo ? parentInfo.index + 1 : draft.blocks.length;
                insertBlockInTree(
                    draft.blocks,
                    parentInfo?.parentId ?? null,
                    insertIndex,
                    cloned,
                );
                draft.selectedBlockId = cloned.id;
                draft.isDirty = true;
            });

            return cloned.id;
        },

        copyBlock: (id) => {
            const block = findBlockInTree(get().blocks, id);
            if (!block) return;
            // get().blocks is plain (not a draft), so structuredClone is safe here
            set((state) => {
                state.clipboard = structuredClone(block) as BlockNode;
            });
        },

        pasteBlock: (parentId, index) => {
            const { clipboard } = get();
            if (!clipboard) return null;

            const cloned = cloneBlockDeep(clipboard);

            set((state) => {
                _pushHistoryOnDraft(state);
                insertBlockInTree(state.blocks, parentId, index, cloned);
                state.selectedBlockId = cloned.id;
                state.isDirty = true;
            });

            return cloned.id;
        },

        copyStyles: (id) => {
            const block = findBlockInTree(get().blocks, id);
            if (!block) return;
            // Extract style-related props (exclude content like text, src, items, etc.)
            const styleKeys = ['backgroundColor', 'color', 'fontSize', 'fontWeight', 'textAlign', 'padding', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight', 'margin', 'borderRadius', 'border', 'shadow', 'animation', 'width', 'height', 'maxWidth', 'opacity'];
            const styles: Record<string, unknown> = {};
            for (const key of styleKeys) {
                if (block.props[key] !== undefined) {
                    styles[key] = structuredClone(block.props[key]);
                }
            }
            set((state) => { state.styleClipboard = styles; });
        },

        pasteStyles: (id) => {
            const { styleClipboard } = get();
            if (!styleClipboard || Object.keys(styleClipboard).length === 0) return;
            set((state) => {
                const block = findBlockInTree(state.blocks, id);
                if (block) {
                    _pushHistoryOnDraft(state);
                    Object.assign(block.props, styleClipboard);
                    state.isDirty = true;
                }
            });
        },

        moveBlockUp: (id) => {
            const state = get();
            const info = findParentInfo(state.blocks, id);
            if (!info || info.index === 0) return;

            set((draft) => {
                _pushHistoryOnDraft(draft);
                const siblings = info.parentId
                    ? findBlockInTree(draft.blocks, info.parentId)!.children!
                    : draft.blocks;
                const temp = siblings[info.index];
                siblings[info.index] = siblings[info.index - 1];
                siblings[info.index - 1] = temp;
                draft.isDirty = true;
            });
        },

        moveBlockDown: (id) => {
            const state = get();
            const info = findParentInfo(state.blocks, id);
            if (!info) return;

            const siblings = info.parentId
                ? findBlockInTree(state.blocks, info.parentId)?.children ?? []
                : state.blocks;
            if (info.index >= siblings.length - 1) return;

            set((draft) => {
                _pushHistoryOnDraft(draft);
                const draftSiblings = info.parentId
                    ? findBlockInTree(draft.blocks, info.parentId)!.children!
                    : draft.blocks;
                const temp = draftSiblings[info.index];
                draftSiblings[info.index] = draftSiblings[info.index + 1];
                draftSiblings[info.index + 1] = temp;
                draft.isDirty = true;
            });
        },

        setPendingDeleteId: (id) => {
            set((state) => {
                state.pendingDeleteId = id;
            });
        },

        confirmDelete: () => {
            const { pendingDeleteId } = get();
            if (!pendingDeleteId) return;

            set((state) => {
                _pushHistoryOnDraft(state);
                removeBlockFromTree(state.blocks, pendingDeleteId);
                if (state.selectedBlockId === pendingDeleteId) {
                    state.selectedBlockId = null;
                }
                if (state.hoveredBlockId === pendingDeleteId) {
                    state.hoveredBlockId = null;
                }
                state.pendingDeleteId = null;
                state.isDirty = true;
            });
        },

        // Selection

        selectBlock: (id) => {
            set((state) => {
                state.selectedBlockId = id;
            });
        },

        setHoveredBlock: (id) => {
            set((state) => {
                state.hoveredBlockId = id;
            });
        },

        // Drag

        setIsDragging: (dragging) => {
            set((state) => {
                state.isDragging = dragging;
            });
        },

        // Viewport

        setViewport: (viewport) => {
            set((state) => {
                state.viewport = viewport;
            });
        },

        // History

        pushHistory: () => {
            set((state) => {
                _pushHistoryOnDraft(state);
            });
        },

        undo: () => {
            set((state) => {
                if (state.historyIndex > 0) {
                    state.historyIndex -= 1;
                    state.blocks = structuredClone(current(state.history)[state.historyIndex]) as BlockNode[];
                    state.selectedBlockId = null;
                    state.isDirty = true;
                }
            });
        },

        redo: () => {
            set((state) => {
                if (state.historyIndex < state.history.length - 1) {
                    state.historyIndex += 1;
                    state.blocks = structuredClone(current(state.history)[state.historyIndex]) as BlockNode[];
                    state.selectedBlockId = null;
                    state.isDirty = true;
                }
            });
        },

        canUndo: () => {
            return get().historyIndex > 0;
        },

        canRedo: () => {
            const state = get();
            return state.historyIndex < state.history.length - 1;
        },

        // Helpers

        findBlock: (id) => {
            return findBlockInTree(get().blocks, id);
        },

        getBlockPath: (id) => {
            return getBlockPathInTree(get().blocks, id) ?? [];
        },

        flattenBlocks: () => {
            return flattenTree(get().blocks);
        },
    })),
);
