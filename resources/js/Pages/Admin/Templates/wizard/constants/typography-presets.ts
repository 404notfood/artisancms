export interface TypographyScaleEntry {
    fontSize: string;
    fontWeight: number;
    lineHeight: string;
    letterSpacing: string;
}

export interface TypographyScale {
    h1: TypographyScaleEntry;
    h2: TypographyScaleEntry;
    h3: TypographyScaleEntry;
    h4: TypographyScaleEntry;
    h5: TypographyScaleEntry;
    h6: TypographyScaleEntry;
    body: TypographyScaleEntry;
    small: TypographyScaleEntry;
}

export interface TypographyPreset {
    id: string;
    name: string;
    description: string;
    headingFont: string;
    bodyFont: string;
    scale: TypographyScale;
}

export interface TypographyConfig {
    presetId: string;
    headingFont: string;
    bodyFont: string;
    scale: TypographyScale;
}

export const TYPOGRAPHY_PRESETS: TypographyPreset[] = [
    {
        id: 'moderne',
        name: 'Moderne',
        description: 'SaaS, tech, startups',
        headingFont: 'Inter',
        bodyFont: 'Inter',
        scale: {
            h1: { fontSize: '3rem', fontWeight: 800, lineHeight: '1.1', letterSpacing: '-0.025em' },
            h2: { fontSize: '2.25rem', fontWeight: 700, lineHeight: '1.2', letterSpacing: '-0.02em' },
            h3: { fontSize: '1.5rem', fontWeight: 600, lineHeight: '1.3', letterSpacing: '-0.01em' },
            h4: { fontSize: '1.25rem', fontWeight: 600, lineHeight: '1.4', letterSpacing: '0' },
            h5: { fontSize: '1.125rem', fontWeight: 600, lineHeight: '1.4', letterSpacing: '0' },
            h6: { fontSize: '1rem', fontWeight: 600, lineHeight: '1.5', letterSpacing: '0.01em' },
            body: { fontSize: '1rem', fontWeight: 400, lineHeight: '1.7', letterSpacing: '0' },
            small: { fontSize: '0.875rem', fontWeight: 400, lineHeight: '1.5', letterSpacing: '0' },
        },
    },
    {
        id: 'classique',
        name: 'Classique',
        description: 'Luxe, cabinets, notaires',
        headingFont: 'Playfair Display',
        bodyFont: 'Lora',
        scale: {
            h1: { fontSize: '3.25rem', fontWeight: 700, lineHeight: '1.15', letterSpacing: '-0.01em' },
            h2: { fontSize: '2.5rem', fontWeight: 600, lineHeight: '1.2', letterSpacing: '-0.005em' },
            h3: { fontSize: '1.75rem', fontWeight: 600, lineHeight: '1.3', letterSpacing: '0' },
            h4: { fontSize: '1.375rem', fontWeight: 500, lineHeight: '1.35', letterSpacing: '0' },
            h5: { fontSize: '1.125rem', fontWeight: 500, lineHeight: '1.4', letterSpacing: '0.01em' },
            h6: { fontSize: '1rem', fontWeight: 500, lineHeight: '1.5', letterSpacing: '0.01em' },
            body: { fontSize: '1.0625rem', fontWeight: 400, lineHeight: '1.8', letterSpacing: '0.01em' },
            small: { fontSize: '0.875rem', fontWeight: 400, lineHeight: '1.6', letterSpacing: '0.01em' },
        },
    },
    {
        id: 'elegant',
        name: 'Elegant',
        description: 'Mode, lifestyle, beaute',
        headingFont: 'Cormorant Garamond',
        bodyFont: 'Raleway',
        scale: {
            h1: { fontSize: '3.5rem', fontWeight: 600, lineHeight: '1.1', letterSpacing: '0.02em' },
            h2: { fontSize: '2.5rem', fontWeight: 500, lineHeight: '1.2', letterSpacing: '0.015em' },
            h3: { fontSize: '1.75rem', fontWeight: 500, lineHeight: '1.3', letterSpacing: '0.01em' },
            h4: { fontSize: '1.375rem', fontWeight: 500, lineHeight: '1.35', letterSpacing: '0.01em' },
            h5: { fontSize: '1.125rem', fontWeight: 500, lineHeight: '1.4', letterSpacing: '0.01em' },
            h6: { fontSize: '1rem', fontWeight: 500, lineHeight: '1.5', letterSpacing: '0.01em' },
            body: { fontSize: '0.9375rem', fontWeight: 400, lineHeight: '1.75', letterSpacing: '0.02em' },
            small: { fontSize: '0.8125rem', fontWeight: 400, lineHeight: '1.6', letterSpacing: '0.02em' },
        },
    },
    {
        id: 'minimaliste',
        name: 'Minimaliste',
        description: 'Portfolios, artistes',
        headingFont: 'DM Sans',
        bodyFont: 'DM Sans',
        scale: {
            h1: { fontSize: '2.75rem', fontWeight: 700, lineHeight: '1.15', letterSpacing: '-0.02em' },
            h2: { fontSize: '2rem', fontWeight: 600, lineHeight: '1.25', letterSpacing: '-0.015em' },
            h3: { fontSize: '1.5rem', fontWeight: 500, lineHeight: '1.35', letterSpacing: '-0.01em' },
            h4: { fontSize: '1.25rem', fontWeight: 500, lineHeight: '1.4', letterSpacing: '0' },
            h5: { fontSize: '1.0625rem', fontWeight: 500, lineHeight: '1.4', letterSpacing: '0' },
            h6: { fontSize: '0.9375rem', fontWeight: 500, lineHeight: '1.5', letterSpacing: '0.01em' },
            body: { fontSize: '1rem', fontWeight: 400, lineHeight: '1.65', letterSpacing: '0' },
            small: { fontSize: '0.875rem', fontWeight: 400, lineHeight: '1.5', letterSpacing: '0' },
        },
    },
    {
        id: 'bold',
        name: 'Bold',
        description: 'Agences, marketing',
        headingFont: 'Montserrat',
        bodyFont: 'Open Sans',
        scale: {
            h1: { fontSize: '3.5rem', fontWeight: 800, lineHeight: '1.05', letterSpacing: '-0.03em' },
            h2: { fontSize: '2.5rem', fontWeight: 700, lineHeight: '1.15', letterSpacing: '-0.02em' },
            h3: { fontSize: '1.75rem', fontWeight: 700, lineHeight: '1.25', letterSpacing: '-0.01em' },
            h4: { fontSize: '1.375rem', fontWeight: 600, lineHeight: '1.3', letterSpacing: '0' },
            h5: { fontSize: '1.125rem', fontWeight: 600, lineHeight: '1.4', letterSpacing: '0' },
            h6: { fontSize: '1rem', fontWeight: 600, lineHeight: '1.5', letterSpacing: '0' },
            body: { fontSize: '1rem', fontWeight: 400, lineHeight: '1.7', letterSpacing: '0' },
            small: { fontSize: '0.875rem', fontWeight: 400, lineHeight: '1.5', letterSpacing: '0' },
        },
    },
    {
        id: 'editorial',
        name: 'Editorial',
        description: 'Blogs, magazines, medias',
        headingFont: 'Libre Baskerville',
        bodyFont: 'Source Sans 3',
        scale: {
            h1: { fontSize: '2.75rem', fontWeight: 700, lineHeight: '1.2', letterSpacing: '-0.01em' },
            h2: { fontSize: '2rem', fontWeight: 700, lineHeight: '1.25', letterSpacing: '-0.005em' },
            h3: { fontSize: '1.5rem', fontWeight: 700, lineHeight: '1.35', letterSpacing: '0' },
            h4: { fontSize: '1.25rem', fontWeight: 700, lineHeight: '1.4', letterSpacing: '0' },
            h5: { fontSize: '1.125rem', fontWeight: 700, lineHeight: '1.4', letterSpacing: '0' },
            h6: { fontSize: '1rem', fontWeight: 700, lineHeight: '1.5', letterSpacing: '0' },
            body: { fontSize: '1.0625rem', fontWeight: 400, lineHeight: '1.8', letterSpacing: '0.005em' },
            small: { fontSize: '0.875rem', fontWeight: 400, lineHeight: '1.6', letterSpacing: '0.005em' },
        },
    },
    {
        id: 'tech',
        name: 'Tech',
        description: 'Startups, produits tech',
        headingFont: 'Space Grotesk',
        bodyFont: 'Manrope',
        scale: {
            h1: { fontSize: '3rem', fontWeight: 700, lineHeight: '1.1', letterSpacing: '-0.03em' },
            h2: { fontSize: '2.25rem', fontWeight: 600, lineHeight: '1.2', letterSpacing: '-0.02em' },
            h3: { fontSize: '1.5rem', fontWeight: 600, lineHeight: '1.3', letterSpacing: '-0.01em' },
            h4: { fontSize: '1.25rem', fontWeight: 500, lineHeight: '1.35', letterSpacing: '0' },
            h5: { fontSize: '1.0625rem', fontWeight: 500, lineHeight: '1.4', letterSpacing: '0' },
            h6: { fontSize: '0.9375rem', fontWeight: 500, lineHeight: '1.5', letterSpacing: '0.01em' },
            body: { fontSize: '1rem', fontWeight: 400, lineHeight: '1.7', letterSpacing: '0' },
            small: { fontSize: '0.875rem', fontWeight: 400, lineHeight: '1.5', letterSpacing: '0' },
        },
    },
    {
        id: 'ludique',
        name: 'Ludique',
        description: 'Associations, education',
        headingFont: 'Nunito',
        bodyFont: 'Nunito',
        scale: {
            h1: { fontSize: '2.75rem', fontWeight: 800, lineHeight: '1.15', letterSpacing: '-0.01em' },
            h2: { fontSize: '2rem', fontWeight: 700, lineHeight: '1.25', letterSpacing: '0' },
            h3: { fontSize: '1.5rem', fontWeight: 700, lineHeight: '1.35', letterSpacing: '0' },
            h4: { fontSize: '1.25rem', fontWeight: 600, lineHeight: '1.4', letterSpacing: '0' },
            h5: { fontSize: '1.125rem', fontWeight: 600, lineHeight: '1.4', letterSpacing: '0' },
            h6: { fontSize: '1rem', fontWeight: 600, lineHeight: '1.5', letterSpacing: '0' },
            body: { fontSize: '1rem', fontWeight: 400, lineHeight: '1.75', letterSpacing: '0.01em' },
            small: { fontSize: '0.875rem', fontWeight: 400, lineHeight: '1.6', letterSpacing: '0.01em' },
        },
    },
];

export function getPresetById(id: string): TypographyPreset | undefined {
    return TYPOGRAPHY_PRESETS.find(p => p.id === id);
}

export function makeCustomConfig(headingFont: string, bodyFont: string, scale: TypographyScale): TypographyConfig {
    return { presetId: 'custom', headingFont, bodyFont, scale };
}

export function presetToConfig(preset: TypographyPreset): TypographyConfig {
    return {
        presetId: preset.id,
        headingFont: preset.headingFont,
        bodyFont: preset.bodyFont,
        scale: { ...preset.scale },
    };
}

export const DEFAULT_TYPOGRAPHY_CONFIG: TypographyConfig = presetToConfig(TYPOGRAPHY_PRESETS[0]);
