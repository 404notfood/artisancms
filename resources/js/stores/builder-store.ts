import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { current } from 'immer';
import { nanoid } from 'nanoid';
import type { BlockNode } from '@/types/cms';

// ────────────────────────────────────────────
// Tree helpers (pure functions, work on both plain objects and Immer drafts)
// ────────────────────────────────────────────

const MAX_HISTORY = 50;
const HISTORY_DEBOUNCE_MS = 500;

/**
 * Known style prop keys used by copyStyles/pasteStyles.
 * Kept as a Set for O(1) lookup when filtering.
 */
const STYLE_PROP_KEYS = new Set([
    'backgroundColor', 'color', 'fontSize', 'fontWeight', 'fontFamily',
    'textAlign', 'lineHeight', 'letterSpacing',
    'padding', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight',
    'margin', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight',
    'borderRadius', 'border', 'borderColor', 'borderWidth',
    'shadow', 'boxShadow',
    'animation',
    'width', 'height', 'minWidth', 'minHeight', 'maxWidth', 'maxHeight',
    'opacity', 'overflow',
    'gap', 'display', 'flexDirection', 'alignItems', 'justifyContent',
]);

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
        blocks.splice(clamp(index, 0, blocks.length), 0, block);
        return true;
    }

    for (const node of blocks) {
        if (node.id === parentId) {
            if (!node.children) node.children = [];
            node.children.splice(clamp(index, 0, node.children.length), 0, block);
            return true;
        }
        if (node.children?.length) {
            if (insertBlockInTree(node.children, parentId, index, block)) return true;
        }
    }
    return false;
}

export function cloneBlockDeep(block: BlockNode): BlockNode {
    return {
        id: nanoid(),
        type: block.type,
        props: structuredClone(block.props),
        children: block.children?.length
            ? block.children.map(cloneBlockDeep)
            : [],
    };
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
 * Locate a block's parent and its index among siblings.
 * Returns { parentId: null, index } for root-level blocks.
 */
export function findParentInfo(
    blocks: BlockNode[],
    id: string,
    parentId: string | null = null,
): { parentId: string | null; index: number } | null {
    for (let i = 0; i < blocks.length; i++) {
        if (blocks[i].id === id) {
            return { parentId, index: i };
        }
        if (blocks[i].children?.length) {
            const found = findParentInfo(blocks[i].children!, id, blocks[i].id);
            if (found) return found;
        }
    }
    return null;
}

/** Get the siblings array for a given parentId (or root). */
function getSiblings(blocks: BlockNode[], parentId: string | null): BlockNode[] | null {
    if (parentId === null) return blocks;
    const parent = findBlockInTree(blocks, parentId);
    return parent?.children ?? null;
}

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(value, max));
}

// ────────────────────────────────────────────
// History helper (operates on Immer drafts)
// ────────────────────────────────────────────

/**
 * Snapshot the current blocks into the undo history.
 *
 * @param debounce - When true, skips the push if the last one was less than
 *                   HISTORY_DEBOUNCE_MS ago. Useful for rapid edits (typing).
 */
function pushSnapshot(
    state: {
        blocks: BlockNode[];
        history: BlockNode[][];
        historyIndex: number;
        _lastSnapshotAt: number;
    },
    { debounce = false } = {},
) {
    const now = Date.now();
    if (debounce && now - state._lastSnapshotAt < HISTORY_DEBOUNCE_MS) {
        return;
    }
    state._lastSnapshotAt = now;

    // Truncate any "future" entries after the current index (they're invalidated)
    const history = state.history.slice(0, state.historyIndex + 1);

    // current() unwraps the Immer proxy; structuredClone ensures a fully independent copy
    history.push(structuredClone(current(state.blocks)));

    // Cap the history length
    if (history.length > MAX_HISTORY) {
        history.shift();
    }

    state.history = history;
    state.historyIndex = history.length - 1;
}

// ────────────────────────────────────────────
// Store types
// ────────────────────────────────────────────

type Viewport = 'desktop' | 'tablet' | 'mobile';

interface BuilderState {
    // -- State --
    blocks: BlockNode[];
    selectedBlockId: string | null;
    hoveredBlockId: string | null;
    isDragging: boolean;
    viewport: Viewport;
    history: BlockNode[][];
    historyIndex: number;
    isDirty: boolean;
    clipboard: BlockNode | null;
    styleClipboard: Record<string, unknown> | null;
    pendingDeleteId: string | null;
    /** @internal timestamp of the last history snapshot */
    _lastSnapshotAt: number;

    // -- Block operations --
    setBlocks: (blocks: BlockNode[]) => void;
    addBlock: (type: string, parentId?: string, index?: number, defaultProps?: Record<string, unknown>) => string;
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

    // -- Selection --
    selectBlock: (id: string | null) => void;
    setHoveredBlock: (id: string | null) => void;

    // -- Drag --
    setIsDragging: (dragging: boolean) => void;

    // -- Viewport --
    setViewport: (viewport: Viewport) => void;

    // -- History --
    undo: () => void;
    redo: () => void;
    canUndo: () => boolean;
    canRedo: () => boolean;
    pushHistory: () => void;

    // -- Read helpers (outside of drafts) --
    findBlock: (id: string) => BlockNode | null;
    getBlockPath: (id: string) => string[];
    flattenBlocks: () => BlockNode[];
}

// ────────────────────────────────────────────
// Store implementation
// ────────────────────────────────────────────

export const useBuilderStore = create<BuilderState>()(
    immer((set, get) => ({
        blocks: [],
        selectedBlockId: null,
        hoveredBlockId: null,
        isDragging: false,
        viewport: 'desktop' as Viewport,
        history: [[]] as BlockNode[][],
        historyIndex: 0,
        isDirty: false,
        clipboard: null,
        styleClipboard: null,
        pendingDeleteId: null,
        _lastSnapshotAt: 0,

        // ── Block operations ──────────────────────

        setBlocks: (blocks) => {
            set((state) => {
                state.blocks = blocks;
                state.selectedBlockId = null;
                state.hoveredBlockId = null;
                state.isDirty = false;
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
                pushSnapshot(state);

                // Default: append at the end of the target container
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
                if (!block) return;

                pushSnapshot(state, { debounce: true });
                Object.assign(block.props, props);
                state.isDirty = true;
            });
        },

        removeBlock: (id) => {
            set((state) => {
                pushSnapshot(state);
                removeBlockFromTree(state.blocks, id);

                if (state.selectedBlockId === id) state.selectedBlockId = null;
                if (state.hoveredBlockId === id) state.hoveredBlockId = null;
                state.isDirty = true;
            });
        },

        moveBlock: (id, newParentId, newIndex) => {
            set((state) => {
                const block = findBlockInTree(state.blocks, id);
                if (!block) return;

                // Figure out where the block currently lives (before any mutation)
                const origin = findParentInfo(state.blocks, id);

                // Unwrap the Immer proxy into a plain object before removing
                const blockData = structuredClone(current(block));

                pushSnapshot(state);
                removeBlockFromTree(state.blocks, id);

                // If we're moving within the same parent and the original index was
                // before the target, the target needs to shift down by one because
                // the removal shortened the array.
                let adjustedIndex = newIndex;
                if (origin && origin.parentId === newParentId && origin.index < newIndex) {
                    adjustedIndex--;
                }

                insertBlockInTree(state.blocks, newParentId, adjustedIndex, blockData);
                state.isDirty = true;
            });
        },

        duplicateBlock: (id) => {
            const { blocks } = get();
            const block = findBlockInTree(blocks, id);
            if (!block) return null;

            const cloned = cloneBlockDeep(block);
            const info = findParentInfo(blocks, id);

            set((draft) => {
                pushSnapshot(draft);
                const insertIndex = info ? info.index + 1 : draft.blocks.length;
                insertBlockInTree(draft.blocks, info?.parentId ?? null, insertIndex, cloned);
                draft.selectedBlockId = cloned.id;
                draft.isDirty = true;
            });

            return cloned.id;
        },

        copyBlock: (id) => {
            const block = findBlockInTree(get().blocks, id);
            if (!block) return;
            set((state) => {
                state.clipboard = structuredClone(block);
            });
        },

        pasteBlock: (parentId, index) => {
            const { clipboard } = get();
            if (!clipboard) return null;

            const cloned = cloneBlockDeep(clipboard);

            set((state) => {
                pushSnapshot(state);
                insertBlockInTree(state.blocks, parentId, index, cloned);
                state.selectedBlockId = cloned.id;
                state.isDirty = true;
            });

            return cloned.id;
        },

        copyStyles: (id) => {
            const block = findBlockInTree(get().blocks, id);
            if (!block) return;

            const styles: Record<string, unknown> = {};
            for (const [key, value] of Object.entries(block.props)) {
                if (STYLE_PROP_KEYS.has(key)) {
                    styles[key] = structuredClone(value);
                }
            }

            set((state) => {
                state.styleClipboard = styles;
            });
        },

        pasteStyles: (id) => {
            const { styleClipboard } = get();
            if (!styleClipboard || Object.keys(styleClipboard).length === 0) return;

            set((state) => {
                const block = findBlockInTree(state.blocks, id);
                if (!block) return;

                pushSnapshot(state);
                Object.assign(block.props, styleClipboard);
                state.isDirty = true;
            });
        },

        moveBlockUp: (id) => {
            set((draft) => {
                const info = findParentInfo(draft.blocks, id);
                if (!info || info.index === 0) return;

                const siblings = getSiblings(draft.blocks, info.parentId);
                if (!siblings) return;

                pushSnapshot(draft);
                // Swap with the previous sibling
                const i = info.index;
                [siblings[i - 1], siblings[i]] = [siblings[i], siblings[i - 1]];
                draft.isDirty = true;
            });
        },

        moveBlockDown: (id) => {
            set((draft) => {
                const info = findParentInfo(draft.blocks, id);
                if (!info) return;

                const siblings = getSiblings(draft.blocks, info.parentId);
                if (!siblings || info.index >= siblings.length - 1) return;

                pushSnapshot(draft);
                const i = info.index;
                [siblings[i], siblings[i + 1]] = [siblings[i + 1], siblings[i]];
                draft.isDirty = true;
            });
        },

        setPendingDeleteId: (id) => {
            set((state) => {
                state.pendingDeleteId = id;
            });
        },

        confirmDelete: () => {
            const { pendingDeleteId, removeBlock } = get();
            if (!pendingDeleteId) return;

            removeBlock(pendingDeleteId);
            set((state) => {
                state.pendingDeleteId = null;
            });
        },

        // ── Selection ─────────────────────────────

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

        // ── Drag ──────────────────────────────────

        setIsDragging: (dragging) => {
            set((state) => {
                state.isDragging = dragging;
            });
        },

        // ── Viewport ──────────────────────────────

        setViewport: (viewport) => {
            set((state) => {
                state.viewport = viewport;
            });
        },

        // ── History ───────────────────────────────

        pushHistory: () => {
            set((state) => {
                pushSnapshot(state);
            });
        },

        undo: () => {
            set((state) => {
                if (state.historyIndex <= 0) return;

                state.historyIndex--;
                const snapshot = current(state.history)[state.historyIndex];
                state.blocks = structuredClone(snapshot);
                state.selectedBlockId = null;
                // Index 0 is the initial state set by setBlocks, so we're back to "clean"
                state.isDirty = state.historyIndex > 0;
            });
        },

        redo: () => {
            set((state) => {
                if (state.historyIndex >= state.history.length - 1) return;

                state.historyIndex++;
                const snapshot = current(state.history)[state.historyIndex];
                state.blocks = structuredClone(snapshot);
                state.selectedBlockId = null;
                state.isDirty = true;
            });
        },

        canUndo: () => get().historyIndex > 0,

        canRedo: () => {
            const { historyIndex, history } = get();
            return historyIndex < history.length - 1;
        },

        // ── Read helpers ──────────────────────────

        findBlock: (id) => findBlockInTree(get().blocks, id),

        getBlockPath: (id) => getBlockPathInTree(get().blocks, id) ?? [],

        flattenBlocks: () => flattenTree(get().blocks),
    })),
);
