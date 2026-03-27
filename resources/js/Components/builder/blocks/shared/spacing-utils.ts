import type { CSSProperties } from 'react';

// ─── CSS Units ──────────────────────────────────────────────────────────────

export const CSS_UNITS = ['px', '%', 'em', 'rem', 'vw', 'vh'] as const;
export type CssUnit = (typeof CSS_UNITS)[number];

/** Parse a spacing value string (e.g. "16px", "2rem", "5%") into number + unit. */
export function parseSpacingValue(raw: unknown): { value: number; unit: CssUnit } {
    if (raw === undefined || raw === null || raw === '' || raw === 0 || raw === '0') {
        return { value: 0, unit: 'px' };
    }
    if (typeof raw === 'number') {
        return { value: raw, unit: 'px' };
    }
    const str = String(raw).trim();
    const match = str.match(/^(-?\d+(?:\.\d+)?)\s*(px|%|em|rem|vw|vh)?$/);
    if (!match) return { value: 0, unit: 'px' };
    return {
        value: parseFloat(match[1]),
        unit: (match[2] as CssUnit) || 'px',
    };
}

/** Format a value + unit into a CSS string. Returns '' for zero values. */
export function formatSpacingValue(value: number, unit: CssUnit): string {
    if (value === 0) return '0';
    return `${value}${unit}`;
}

// ─── Spacing presets ────────────────────────────────────────────────────────

export interface SpacingValues {
    marginTop: string;
    marginBottom: string;
    marginLeft: string;
    marginRight: string;
    paddingTop: string;
    paddingBottom: string;
    paddingLeft: string;
    paddingRight: string;
}

const ZERO: SpacingValues = {
    marginTop: '0', marginBottom: '0', marginLeft: '0', marginRight: '0',
    paddingTop: '0', paddingBottom: '0', paddingLeft: '0', paddingRight: '0',
};

export interface SpacingPreset {
    label: string;
    values: SpacingValues;
}

export const SPACING_PRESETS: SpacingPreset[] = [
    { label: 'Aucun', values: { ...ZERO } },
    { label: 'XS', values: { ...ZERO, marginTop: '4px', marginBottom: '4px', paddingTop: '4px', paddingBottom: '4px' } },
    { label: 'S', values: { ...ZERO, marginTop: '8px', marginBottom: '8px', paddingTop: '8px', paddingBottom: '8px' } },
    { label: 'M', values: { ...ZERO, marginTop: '16px', marginBottom: '16px', paddingTop: '16px', paddingBottom: '16px' } },
    { label: 'L', values: { ...ZERO, marginTop: '24px', marginBottom: '24px', paddingTop: '24px', paddingBottom: '24px' } },
    { label: 'XL', values: { ...ZERO, marginTop: '32px', marginBottom: '32px', paddingTop: '32px', paddingBottom: '32px' } },
    { label: 'XXL', values: { ...ZERO, marginTop: '48px', marginBottom: '48px', paddingTop: '48px', paddingBottom: '48px' } },
];

/** Margin-only presets */
export const MARGIN_PRESETS: SpacingPreset[] = [
    { label: 'Aucun', values: { ...ZERO } },
    { label: 'S', values: { ...ZERO, marginTop: '8px', marginBottom: '8px' } },
    { label: 'M', values: { ...ZERO, marginTop: '16px', marginBottom: '16px' } },
    { label: 'L', values: { ...ZERO, marginTop: '24px', marginBottom: '24px' } },
    { label: 'XL', values: { ...ZERO, marginTop: '40px', marginBottom: '40px' } },
];

/** Padding-only presets */
export const PADDING_PRESETS: SpacingPreset[] = [
    { label: 'Aucun', values: { ...ZERO } },
    { label: 'S', values: { ...ZERO, paddingTop: '8px', paddingBottom: '8px', paddingLeft: '8px', paddingRight: '8px' } },
    { label: 'M', values: { ...ZERO, paddingTop: '16px', paddingBottom: '16px', paddingLeft: '16px', paddingRight: '16px' } },
    { label: 'L', values: { ...ZERO, paddingTop: '24px', paddingBottom: '24px', paddingLeft: '24px', paddingRight: '24px' } },
    { label: 'XL', values: { ...ZERO, paddingTop: '40px', paddingBottom: '40px', paddingLeft: '40px', paddingRight: '40px' } },
];

// ─── Theme spacing scale (from customizer select) ───────────────────────────

/**
 * Theme-level spacing presets. The customizer stores a single key
 * (e.g., "spacing.block_spacing": "normal") and we map it to default
 * margin-bottom values per block type group.
 */
export const THEME_SPACING_SCALES: Record<string, { content: number; layout: number; heading: number }> = {
    compact:  { content: 8,  layout: 16, heading: 12 },
    normal:   { content: 16, layout: 24, heading: 16 },
    relaxed:  { content: 24, layout: 40, heading: 24 },
    spacious: { content: 32, layout: 56, heading: 32 },
};

const LAYOUT_BLOCKS = new Set(['section', 'grid', 'hero', 'cta', 'divider', 'spacer']);
const HEADING_BLOCKS = new Set(['heading']);

/**
 * Get the default margin-bottom for a block type based on the theme spacing scale.
 */
export function getThemeSpacingDefault(blockType: string, scale: string): number {
    const s = THEME_SPACING_SCALES[scale];
    if (!s) return 0;
    if (LAYOUT_BLOCKS.has(blockType)) return s.layout;
    if (HEADING_BLOCKS.has(blockType)) return s.heading;
    return s.content;
}

// ─── Style extraction ───────────────────────────────────────────────────────

/** Convert a raw prop to a CSS string. Handles legacy numbers (→ px) and new "16px"/"2rem" strings. */
function toCss(raw: unknown): string {
    if (raw === undefined || raw === null || raw === '' || raw === 0 || raw === '0') return '';
    if (typeof raw === 'number') return raw === 0 ? '' : `${raw}px`;
    const str = String(raw).trim();
    if (str === '0') return '';
    // Already has a unit → use as-is
    if (/^-?\d+(\.\d+)?\s*(px|%|em|rem|vw|vh)$/.test(str)) return str;
    // Plain number string → append px
    const n = parseFloat(str);
    if (!isNaN(n) && n !== 0) return `${n}px`;
    return '';
}

/**
 * Extracts margin/padding values from block props and returns a CSSProperties object.
 * Returns null if all values are 0 (no wrapper needed).
 * Supports both legacy numbers (16 → "16px") and new unit strings ("2rem", "5%").
 */
export function getSpacingStyle(
    props: Record<string, unknown>,
    options?: { skipPadding?: boolean },
): CSSProperties | null {
    const mt = toCss(props.marginTop);
    const mb = toCss(props.marginBottom);
    const ml = toCss(props.marginLeft);
    const mr = toCss(props.marginRight);

    const skipPad = options?.skipPadding === true;
    const pt = skipPad ? '' : toCss(props.paddingTop);
    const pb = skipPad ? '' : toCss(props.paddingBottom);
    const pl = skipPad ? '' : toCss(props.paddingLeft);
    const pr = skipPad ? '' : toCss(props.paddingRight);

    if (!mt && !mb && !ml && !mr && !pt && !pb && !pl && !pr) return null;

    const style: CSSProperties = {};
    if (mt) style.marginTop = mt;
    if (mb) style.marginBottom = mb;
    if (ml) style.marginLeft = ml;
    if (mr) style.marginRight = mr;
    if (pt) style.paddingTop = pt;
    if (pb) style.paddingBottom = pb;
    if (pl) style.paddingLeft = pl;
    if (pr) style.paddingRight = pr;
    return style;
}
