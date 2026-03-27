/**
 * Block Transforms — pure functions that convert one block type to another.
 *
 * Each transform maps (BlockNode) => BlockNode, converting props as needed.
 * The original block id is preserved so the tree position stays intact.
 */

import type { BlockNode } from '@/types/cms';

// ─── Types ───────────────────────────────────────────────────────────

/** A transform function receives a block and returns a new block with converted type/props. */
type TransformFn = (block: BlockNode) => BlockNode;

interface TransformEntry {
    /** Human-readable label shown in the UI. */
    label: string;
    /** Target block type slug. */
    to: string;
    /** Pure transform function. */
    transform: TransformFn;
}

// ─── Helpers ─────────────────────────────────────────────────────────

function textFromProps(props: Record<string, unknown>): string {
    return (
        (props.text as string | undefined) ??
        (props.content as string | undefined) ??
        ''
    );
}

function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').trim();
}

function wrapInP(text: string): string {
    if (text.startsWith('<p')) return text;
    return `<p>${text}</p>`;
}

function generateId(): string {
    return `blk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Transform definitions ──────────────────────────────────────────

const BLOCK_TRANSFORMS: Record<string, TransformEntry[]> = {
    heading: [
        {
            label: 'Paragraphe',
            to: 'text',
            transform: (block) => ({
                id: block.id,
                type: 'text',
                props: {
                    content: wrapInP(textFromProps(block.props)),
                    alignment: (block.props.alignment as string) ?? 'left',
                },
            }),
        },
        {
            label: 'Citation',
            to: 'blockquote',
            transform: (block) => ({
                id: block.id,
                type: 'blockquote',
                props: {
                    text: stripHtml(textFromProps(block.props)),
                    author: '',
                    source: '',
                    style: 'bordered',
                },
            }),
        },
    ],

    text: [
        {
            label: 'Titre (H2)',
            to: 'heading',
            transform: (block) => ({
                id: block.id,
                type: 'heading',
                props: {
                    text: stripHtml(textFromProps(block.props)),
                    level: 2,
                    alignment: (block.props.alignment as string) ?? 'left',
                },
            }),
        },
        {
            label: 'Citation',
            to: 'blockquote',
            transform: (block) => ({
                id: block.id,
                type: 'blockquote',
                props: {
                    text: stripHtml(textFromProps(block.props)),
                    author: '',
                    source: '',
                    style: 'bordered',
                },
            }),
        },
        {
            label: 'Liste',
            to: 'list',
            transform: (block) => {
                const raw = textFromProps(block.props);
                // Split on <br>, <p>, or newlines to produce list items
                const items = raw
                    .split(/<br\s*\/?>|<\/p>\s*<p[^>]*>|\n/)
                    .map(stripHtml)
                    .filter((s) => s.length > 0);

                return {
                    id: block.id,
                    type: 'list',
                    props: {
                        items: items.length > 0 ? items : ['Element 1'],
                        style: 'bullet',
                        spacing: 'normal',
                    },
                };
            },
        },
    ],

    blockquote: [
        {
            label: 'Paragraphe',
            to: 'text',
            transform: (block) => ({
                id: block.id,
                type: 'text',
                props: {
                    content: wrapInP(textFromProps(block.props)),
                    alignment: 'left',
                },
            }),
        },
    ],

    list: [
        {
            label: 'Paragraphes',
            to: 'text',
            transform: (block) => {
                const items = (block.props.items as string[]) ?? [];
                const html = items.map((item) => `<p>${item}</p>`).join('');

                return {
                    id: block.id,
                    type: 'text',
                    props: {
                        content: html || '<p></p>',
                        alignment: 'left',
                    },
                };
            },
        },
    ],

    image: [
        {
            label: 'Galerie',
            to: 'gallery',
            transform: (block) => {
                const src = (block.props.src as string) ?? '';
                const alt = (block.props.alt as string) ?? '';
                const images = src
                    ? [{ src, alt, caption: '' }]
                    : [];

                return {
                    id: block.id,
                    type: 'gallery',
                    props: {
                        images,
                        columns: 3,
                        gap: '8px',
                        lightbox: true,
                        style: 'grid',
                    },
                };
            },
        },
    ],
};

// ─── Public API ──────────────────────────────────────────────────────

/**
 * Get the list of block types a given source type can be transformed into.
 */
function getAvailableTransforms(blockType: string): string[] {
    const entries = BLOCK_TRANSFORMS[blockType];
    if (!entries) return [];
    return entries.map((e) => e.to);
}

/**
 * Get transform entries (label + to + fn) for a given source type.
 */
function getTransformEntries(blockType: string): TransformEntry[] {
    return BLOCK_TRANSFORMS[blockType] ?? [];
}

/**
 * Execute a transform: convert a block from its current type to the target type.
 * Returns null if the transform is not defined.
 */
function applyTransform(block: BlockNode, targetType: string): BlockNode | null {
    const entries = BLOCK_TRANSFORMS[block.type];
    if (!entries) return null;

    const entry = entries.find((e) => e.to === targetType);
    if (!entry) return null;

    return entry.transform(block);
}

export {
    BLOCK_TRANSFORMS,
    getAvailableTransforms,
    getTransformEntries,
    applyTransform,
    generateId,
};

export type { TransformEntry, TransformFn };
