export interface FontOption {
    value: string;
    label: string;
    category: 'sans-serif' | 'serif' | 'display' | 'mono';
    weights: number[];
    isSystem?: boolean;
}

export const GOOGLE_FONTS: FontOption[] = [
    // Sans-serif
    { value: 'Inter', label: 'Inter', category: 'sans-serif', weights: [300, 400, 500, 600, 700, 800] },
    { value: 'Roboto', label: 'Roboto', category: 'sans-serif', weights: [300, 400, 500, 700] },
    { value: 'Open Sans', label: 'Open Sans', category: 'sans-serif', weights: [300, 400, 500, 600, 700] },
    { value: 'Lato', label: 'Lato', category: 'sans-serif', weights: [300, 400, 700] },
    { value: 'Montserrat', label: 'Montserrat', category: 'sans-serif', weights: [300, 400, 500, 600, 700, 800] },
    { value: 'Poppins', label: 'Poppins', category: 'sans-serif', weights: [300, 400, 500, 600, 700] },
    { value: 'Nunito', label: 'Nunito', category: 'sans-serif', weights: [300, 400, 500, 600, 700, 800] },
    { value: 'Raleway', label: 'Raleway', category: 'sans-serif', weights: [300, 400, 500, 600, 700] },
    { value: 'Source Sans 3', label: 'Source Sans 3', category: 'sans-serif', weights: [300, 400, 500, 600, 700] },
    { value: 'DM Sans', label: 'DM Sans', category: 'sans-serif', weights: [400, 500, 600, 700] },
    { value: 'Manrope', label: 'Manrope', category: 'sans-serif', weights: [300, 400, 500, 600, 700, 800] },
    { value: 'Work Sans', label: 'Work Sans', category: 'sans-serif', weights: [300, 400, 500, 600, 700] },

    // Serif
    { value: 'Playfair Display', label: 'Playfair Display', category: 'serif', weights: [400, 500, 600, 700, 800] },
    { value: 'Merriweather', label: 'Merriweather', category: 'serif', weights: [300, 400, 700] },
    { value: 'Lora', label: 'Lora', category: 'serif', weights: [400, 500, 600, 700] },
    { value: 'PT Serif', label: 'PT Serif', category: 'serif', weights: [400, 700] },
    { value: 'Libre Baskerville', label: 'Libre Baskerville', category: 'serif', weights: [400, 700] },
    { value: 'Cormorant Garamond', label: 'Cormorant Garamond', category: 'serif', weights: [300, 400, 500, 600, 700] },
    { value: 'Bitter', label: 'Bitter', category: 'serif', weights: [300, 400, 500, 600, 700] },
    { value: 'Georgia', label: 'Georgia', category: 'serif', weights: [400, 700], isSystem: true },

    // Display
    { value: 'Oswald', label: 'Oswald', category: 'display', weights: [300, 400, 500, 600, 700] },
    { value: 'Bebas Neue', label: 'Bebas Neue', category: 'display', weights: [400] },
    { value: 'Archivo Black', label: 'Archivo Black', category: 'display', weights: [400] },
    { value: 'Sora', label: 'Sora', category: 'display', weights: [300, 400, 500, 600, 700, 800] },
    { value: 'Space Grotesk', label: 'Space Grotesk', category: 'display', weights: [300, 400, 500, 600, 700] },
    { value: 'Outfit', label: 'Outfit', category: 'display', weights: [300, 400, 500, 600, 700, 800] },

    // Mono
    { value: 'JetBrains Mono', label: 'JetBrains Mono', category: 'mono', weights: [400, 500, 600, 700] },
    { value: 'Fira Code', label: 'Fira Code', category: 'mono', weights: [300, 400, 500, 600, 700] },

    // System
    { value: 'system-ui', label: 'System UI', category: 'sans-serif', weights: [300, 400, 500, 600, 700], isSystem: true },
];

export const FONT_CATEGORIES = [
    { value: 'sans-serif', label: 'Sans-serif' },
    { value: 'serif', label: 'Serif' },
    { value: 'display', label: 'Display' },
    { value: 'mono', label: 'Monospace' },
] as const;

export function getFontsByCategory(category: string): FontOption[] {
    return GOOGLE_FONTS.filter(f => f.category === category);
}

const loadedFonts = new Set<string>();

export function loadGoogleFont(fontFamily: string, weights: number[] = [400, 600, 700]) {
    if (!fontFamily || fontFamily === 'system-ui' || fontFamily === 'Georgia' || loadedFonts.has(fontFamily)) return;
    loadedFonts.add(fontFamily);
    const weightsStr = weights.join(';');
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@${weightsStr}&display=swap`;
    document.head.appendChild(link);
}
