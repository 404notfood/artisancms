/** Theme CSS variable tokens used for inline styles */
export const T = {
    primary:    'var(--color-primary, #1a3d1a)',
    gold:       'var(--color-gold, #c9a84c)',
    bg:         'var(--color-background, #fafaf5)',
    surface:    'var(--color-surface, #f0f5ec)',
    text:       'var(--color-text, #1a2e1a)',
    heading:    "var(--font-heading, 'Cormorant Garamond', Georgia, serif)",
    body:       "var(--font-body, 'DM Sans', system-ui, sans-serif)",
};

export function formatPrice(price: number, symbol: string): string {
    return `${Number(price).toFixed(2)} ${symbol}`;
}
