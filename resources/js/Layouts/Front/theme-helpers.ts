import type { MenuItemData } from '@/types/cms';

// ─── Simple accessors ────────────────────────────────────────────────────────

/** Get a string customization value with fallback. */
export function c(customizations: Record<string, string | boolean>, key: string, fallback = ''): string {
    const val = customizations[key];
    if (val === undefined || val === null || val === '') return fallback;
    return String(val);
}

/** Get a boolean customization value with fallback. */
export function b(customizations: Record<string, string | boolean>, key: string, fallback = false): boolean {
    const val = customizations[key];
    if (val === undefined || val === null) return fallback;
    return Boolean(val);
}

// ─── Menu helpers ────────────────────────────────────────────────────────────

export function getMenuItemUrl(item: MenuItemData): string {
    if (item.url) return item.url;
    if (item.type === 'page') return `/${item.label.toLowerCase()}`;
    return '#';
}

export type MenuItemWithChildren = MenuItemData & { children: MenuItemData[] };

export function buildMenuTree(items: MenuItemData[]): MenuItemWithChildren[] {
    const roots = items.filter((i) => !i.parent_id).sort((a, b) => a.order - b.order);
    return roots.map((root) => ({
        ...root,
        children: items.filter((i) => i.parent_id === root.id).sort((a, b) => a.order - b.order),
    }));
}

// ─── Theme style detection ───────────────────────────────────────────────────

export type ThemeStyle = 'default' | 'dark' | 'luxury' | 'nature' | 'creative';

/** Detect if a hex color is dark (lightness < 40%). */
export function isHexDark(hex: string): boolean {
    const clean = hex.replace('#', '');
    if (clean.length < 6) return false;
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const bl = parseInt(clean.substring(4, 6), 16);
    const lum = (0.299 * r + 0.587 * g + 0.114 * bl) / 255;
    return lum < 0.4;
}

/**
 * Resolve the theme style. Uses the explicit `themeStyle` if provided,
 * otherwise falls back to heuristic detection from customizations.
 */
export function resolveThemeStyle(
    customizations: Record<string, string | boolean>,
    themeStyle?: ThemeStyle,
): ThemeStyle {
    if (themeStyle) return themeStyle;

    const bgColor = c(customizations, 'colors.background', '#ffffff');
    const borderRadius = c(customizations, 'layout.border_radius', '0.375rem');

    if (isHexDark(bgColor)) return 'dark';
    if (borderRadius === '0' || borderRadius === '0.125rem' || borderRadius === '0.25rem') return 'luxury';
    return 'default';
}

// ─── CSS Variables ───────────────────────────────────────────────────────────

const SECTION_PREFIXES: Record<string, string> = {
    colors: '--color-',
    fonts: '--font-',
    layout: '--',
    header: '--header-',
    footer: '--footer-',
    ecommerce: '--ecommerce-',
    global_styles: '--global-',
    spacing: '--spacing-',
};

const SEMANTIC_MAPPINGS: Record<string, Record<string, string>> = {
    shadow_intensity: {
        none: 'none',
        light: '0 1px 3px 0 rgb(0 0 0 / 0.05)',
        medium: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        strong: '0 10px 15px -3px rgb(0 0 0 / 0.15)',
    },
    button_style: {
        square: '0',
        rounded: '0.375rem',
        pill: '9999px',
    },
};

export function buildCssVariables(customizations: Record<string, string | boolean>): Record<string, string> {
    const vars: Record<string, string> = {};

    for (const [dotKey, value] of Object.entries(customizations)) {
        if (value === '' || value === null || value === undefined) continue;
        if (typeof value === 'boolean') continue;

        const dotIdx = dotKey.indexOf('.');
        if (dotIdx === -1) continue;

        const section = dotKey.substring(0, dotIdx);
        const key = dotKey.substring(dotIdx + 1);

        if (section === 'animations' || section === 'typography') continue;

        const prefix = SECTION_PREFIXES[section];
        if (!prefix) continue;

        if (String(value).startsWith('/') || String(value).startsWith('http')) continue;
        if (String(value).includes('{year}') || String(value).includes('{site_name}')) continue;

        let cssValue = String(value);
        if (SEMANTIC_MAPPINGS[key]?.[cssValue]) {
            cssValue = SEMANTIC_MAPPINGS[key][cssValue];
        }

        const cssKey = prefix + key.replace(/_/g, '-');
        vars[cssKey] = cssValue;
    }

    // ── Derive semantic variables for block renderers ──────────────────────
    const bg = String(customizations['colors.background'] || '#ffffff');
    const isDark = isHexDark(bg);

    if (!vars['--color-surface']) {
        vars['--color-surface'] = isDark
            ? 'rgba(255,255,255,0.04)'
            : 'rgba(0,0,0,0.025)';
    }

    if (!vars['--color-border']) {
        vars['--color-border'] = isDark
            ? 'rgba(255,255,255,0.08)'
            : 'rgba(0,0,0,0.07)';
    }

    if (!vars['--color-hero-text']) {
        vars['--color-hero-text'] = '#ffffff';
    }

    if (vars['--border-radius'] === undefined) {
        const br = String(customizations['layout.border_radius'] || '0.5rem');
        const BUTTON_RADIUS_MAP: Record<string, string> = {
            square: '0',
            rounded: '0.375rem',
            pill: '9999px',
        };
        vars['--border-radius'] = BUTTON_RADIUS_MAP[br] ?? br;
    }

    return vars;
}

// ─── Google Fonts ────────────────────────────────────────────────────────────

export function getGoogleFontsUrl(customizations: Record<string, string | boolean>): string | null {
    const heading = c(customizations, 'fonts.heading', 'Inter');
    const body = c(customizations, 'fonts.body', 'Inter');
    const families = new Set<string>();

    const systemFonts = ['Georgia', 'system-ui', 'Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Impact'];
    for (const font of [heading, body]) {
        if (font && !systemFonts.includes(font)) {
            families.add(font.replace(/ /g, '+'));
        }
    }

    if (families.size === 0) return null;
    const params = Array.from(families).map((f) => `family=${f}:wght@300;400;500;600;700;800`).join('&');
    return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}
