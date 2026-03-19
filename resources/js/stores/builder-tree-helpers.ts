import { nanoid } from 'nanoid';
import type { BlockNode } from '@/types/cms';

// ────────────────────────────────────────────
// Tree helpers (pure functions, work on both plain objects and Immer drafts)
// ────────────────────────────────────────────

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
export function getSiblings(blocks: BlockNode[], parentId: string | null): BlockNode[] | null {
    if (parentId === null) return blocks;
    const parent = findBlockInTree(blocks, parentId);
    return parent?.children ?? null;
}

export function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(value, max));
}
