/**
 * Copy/Paste Styles for the Page Builder
 *
 * Allows copying ONLY visual style properties from one block and pasting
 * them onto another. Content (text, images, links, etc.) is never copied.
 *
 * Keyboard shortcuts:
 *   Ctrl+Alt+C  — Copy styles from the currently selected block
 *   Ctrl+Alt+V  — Paste styles onto the currently selected block
 */

import type { BlockNode } from '@/types/cms';

// ────────────────────────────────────────────
// Style Clipboard interface
// ────────────────────────────────────────────

export interface StyleClipboard {
    // Spacing
    margin?: unknown;
    marginTop?: unknown;
    marginBottom?: unknown;
    marginLeft?: unknown;
    marginRight?: unknown;
    padding?: unknown;
    paddingTop?: unknown;
    paddingBottom?: unknown;
    paddingLeft?: unknown;
    paddingRight?: unknown;

    // Colors
    backgroundColor?: unknown;
    color?: unknown;
    borderColor?: unknown;

    // Typography
    fontSize?: unknown;
    fontWeight?: unknown;
    fontFamily?: unknown;
    textAlign?: unknown;
    lineHeight?: unknown;
    letterSpacing?: unknown;

    // Border
    borderWidth?: unknown;
    borderRadius?: unknown;
    border?: unknown;

    // Animation
    animation?: unknown;

    // Effects
    shadow?: unknown;
    boxShadow?: unknown;
    opacity?: unknown;

    // Layout (non-content)
    width?: unknown;
    height?: unknown;
    minWidth?: unknown;
    minHeight?: unknown;
    maxWidth?: unknown;
    maxHeight?: unknown;
    overflow?: unknown;
    gap?: unknown;
    display?: unknown;
    flexDirection?: unknown;
    alignItems?: unknown;
    justifyContent?: unknown;
}

/**
 * All prop keys that are considered visual styles.
 * Must stay in sync with STYLE_PROP_KEYS in builder-store.ts.
 */
const STYLE_KEYS: ReadonlySet<string> = new Set<string>([
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

// ────────────────────────────────────────────
// Extraction & application helpers
// ────────────────────────────────────────────

/**
 * Extract visual style properties from a block's props.
 * Returns a StyleClipboard containing only the style keys that are present.
 */
export function copyBlockStyles(block: BlockNode): StyleClipboard {
    const styles: StyleClipboard = {};

    for (const [key, value] of Object.entries(block.props)) {
        if (STYLE_KEYS.has(key) && value !== undefined) {
            (styles as Record<string, unknown>)[key] = structuredClone(value);
        }
    }

    return styles;
}

/**
 * Apply copied styles onto a block (immutable — returns a new BlockNode).
 * Merges the style properties into the block's existing props.
 * Content props are left untouched.
 */
export function pasteBlockStyles(block: BlockNode, styles: StyleClipboard): BlockNode {
    const mergedProps: Record<string, unknown> = { ...block.props };

    for (const [key, value] of Object.entries(styles)) {
        if (STYLE_KEYS.has(key) && value !== undefined) {
            mergedProps[key] = structuredClone(value);
        }
    }

    return {
        ...block,
        props: mergedProps,
        children: block.children ? [...block.children] : undefined,
    };
}

// ────────────────────────────────────────────
// Keyboard shortcut registration
// ────────────────────────────────────────────

interface BuilderStoreApi {
    getState: () => {
        selectedBlockId: string | null;
    };
    copyStyles: (id: string) => void;
    pasteStyles: (id: string) => void;
}

/**
 * Register Ctrl+Alt+C / Ctrl+Alt+V keyboard shortcuts for copy/paste styles.
 *
 * Returns an unsubscribe function that removes the event listener.
 *
 * @example
 * ```ts
 * useEffect(() => {
 *     const store = useBuilderStore.getState();
 *     const cleanup = registerCopyPasteShortcuts({
 *         getState: () => useBuilderStore.getState(),
 *         copyStyles: store.copyStyles,
 *         pasteStyles: store.pasteStyles,
 *     });
 *     return cleanup;
 * }, []);
 * ```
 */
export function registerCopyPasteShortcuts(store: BuilderStoreApi): () => void {
    function handleKeyDown(e: KeyboardEvent): void {
        // Only respond to Ctrl+Alt+C or Ctrl+Alt+V
        if (!e.ctrlKey || !e.altKey) return;

        const key = e.key.toLowerCase();

        if (key === 'c') {
            const selectedId = store.getState().selectedBlockId;
            if (!selectedId) return;

            e.preventDefault();
            store.copyStyles(selectedId);
        } else if (key === 'v') {
            const selectedId = store.getState().selectedBlockId;
            if (!selectedId) return;

            e.preventDefault();
            store.pasteStyles(selectedId);
        }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
        document.removeEventListener('keydown', handleKeyDown);
    };
}
