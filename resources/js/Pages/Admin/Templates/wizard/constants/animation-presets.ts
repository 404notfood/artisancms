export type BlockTypeCategory = 'sections' | 'headings' | 'text' | 'images' | 'buttons' | 'lists' | 'cards';

export interface EntranceConfig {
    type: string;
    duration: number;
    delay: number;
    easing: string;
    stagger: number;
}

export interface HoverConfig {
    type: string;
    intensity: 'subtle' | 'medium' | 'strong';
}

export interface TextEffectConfig {
    type: string;
}

export interface ContinuousConfig {
    type: string;
    speed: 'slow' | 'medium' | 'fast';
}

export interface BlockAnimationConfig {
    entrance: EntranceConfig;
    hover: HoverConfig;
    text: TextEffectConfig;
    continuous: ContinuousConfig;
}

export interface AnimationPreset {
    id: string;
    name: string;
    description: string;
    config: Record<BlockTypeCategory, BlockAnimationConfig>;
}

export type AnimationConfig = {
    presetId: string;
    config: Record<BlockTypeCategory, BlockAnimationConfig>;
};

const NONE_ENTRANCE: EntranceConfig = { type: 'none', duration: 600, delay: 0, easing: 'ease-out', stagger: 0 };
const NONE_HOVER: HoverConfig = { type: 'none', intensity: 'subtle' };
const NONE_TEXT: TextEffectConfig = { type: 'none' };
const NONE_CONTINUOUS: ContinuousConfig = { type: 'none', speed: 'medium' };

const NONE_BLOCK: BlockAnimationConfig = {
    entrance: NONE_ENTRANCE,
    hover: NONE_HOVER,
    text: NONE_TEXT,
    continuous: NONE_CONTINUOUS,
};

function allCategories(block: BlockAnimationConfig): Record<BlockTypeCategory, BlockAnimationConfig> {
    return {
        sections: { ...block },
        headings: { ...block },
        text: { ...block },
        images: { ...block },
        buttons: { ...block },
        lists: { ...block },
        cards: { ...block },
    };
}

export const ANIMATION_PRESETS: AnimationPreset[] = [
    {
        id: 'none',
        name: 'Aucune',
        description: 'Pas d\'animation',
        config: allCategories(NONE_BLOCK),
    },
    {
        id: 'subtil',
        name: 'Subtil',
        description: 'Transitions douces et legeres',
        config: {
            sections: {
                entrance: { type: 'fade-in', duration: 800, delay: 0, easing: 'ease-out', stagger: 0 },
                hover: NONE_HOVER,
                text: NONE_TEXT,
                continuous: NONE_CONTINUOUS,
            },
            headings: {
                entrance: { type: 'fade-in', duration: 600, delay: 100, easing: 'ease-out', stagger: 0 },
                hover: NONE_HOVER,
                text: NONE_TEXT,
                continuous: NONE_CONTINUOUS,
            },
            text: {
                entrance: { type: 'fade-in', duration: 600, delay: 200, easing: 'ease-out', stagger: 0 },
                hover: NONE_HOVER,
                text: NONE_TEXT,
                continuous: NONE_CONTINUOUS,
            },
            images: {
                entrance: { type: 'fade-in', duration: 800, delay: 100, easing: 'ease-out', stagger: 0 },
                hover: { type: 'shadow-lift', intensity: 'subtle' },
                text: NONE_TEXT,
                continuous: NONE_CONTINUOUS,
            },
            buttons: {
                entrance: { type: 'fade-in', duration: 400, delay: 300, easing: 'ease-out', stagger: 0 },
                hover: { type: 'shadow-lift', intensity: 'subtle' },
                text: NONE_TEXT,
                continuous: NONE_CONTINUOUS,
            },
            lists: {
                entrance: { type: 'fade-in', duration: 600, delay: 150, easing: 'ease-out', stagger: 0 },
                hover: NONE_HOVER,
                text: NONE_TEXT,
                continuous: NONE_CONTINUOUS,
            },
            cards: {
                entrance: { type: 'fade-in', duration: 700, delay: 100, easing: 'ease-out', stagger: 0 },
                hover: { type: 'shadow-lift', intensity: 'subtle' },
                text: NONE_TEXT,
                continuous: NONE_CONTINUOUS,
            },
        },
    },
    {
        id: 'fluide',
        name: 'Fluide',
        description: 'Mouvements naturels et coulants',
        config: {
            sections: {
                entrance: { type: 'fade-in', duration: 800, delay: 0, easing: 'ease-out', stagger: 0 },
                hover: NONE_HOVER,
                text: NONE_TEXT,
                continuous: NONE_CONTINUOUS,
            },
            headings: {
                entrance: { type: 'slide-up', duration: 700, delay: 100, easing: 'ease-out', stagger: 0 },
                hover: NONE_HOVER,
                text: NONE_TEXT,
                continuous: NONE_CONTINUOUS,
            },
            text: {
                entrance: { type: 'slide-up', duration: 600, delay: 200, easing: 'ease-out', stagger: 0 },
                hover: NONE_HOVER,
                text: NONE_TEXT,
                continuous: NONE_CONTINUOUS,
            },
            images: {
                entrance: { type: 'zoom-in', duration: 800, delay: 100, easing: 'ease-out', stagger: 0 },
                hover: { type: 'scale', intensity: 'subtle' },
                text: NONE_TEXT,
                continuous: NONE_CONTINUOUS,
            },
            buttons: {
                entrance: { type: 'slide-up', duration: 500, delay: 300, easing: 'ease-out', stagger: 0 },
                hover: { type: 'shadow-lift', intensity: 'medium' },
                text: NONE_TEXT,
                continuous: NONE_CONTINUOUS,
            },
            lists: {
                entrance: { type: 'slide-up', duration: 600, delay: 150, easing: 'ease-out', stagger: 100 },
                hover: NONE_HOVER,
                text: NONE_TEXT,
                continuous: NONE_CONTINUOUS,
            },
            cards: {
                entrance: { type: 'slide-up', duration: 700, delay: 100, easing: 'ease-out', stagger: 100 },
                hover: { type: 'scale', intensity: 'subtle' },
                text: NONE_TEXT,
                continuous: NONE_CONTINUOUS,
            },
        },
    },
    {
        id: 'dynamique',
        name: 'Dynamique',
        description: 'Effets marques, impact visuel',
        config: {
            sections: {
                entrance: { type: 'fade-in', duration: 800, delay: 0, easing: 'ease-out', stagger: 0 },
                hover: NONE_HOVER,
                text: NONE_TEXT,
                continuous: NONE_CONTINUOUS,
            },
            headings: {
                entrance: { type: 'blur-in', duration: 800, delay: 100, easing: 'ease-out', stagger: 0 },
                hover: NONE_HOVER,
                text: { type: 'shimmer' },
                continuous: NONE_CONTINUOUS,
            },
            text: {
                entrance: { type: 'slide-up', duration: 600, delay: 200, easing: 'ease-out', stagger: 0 },
                hover: NONE_HOVER,
                text: NONE_TEXT,
                continuous: NONE_CONTINUOUS,
            },
            images: {
                entrance: { type: 'zoom-in', duration: 800, delay: 100, easing: 'ease-out', stagger: 0 },
                hover: { type: 'scale', intensity: 'medium' },
                text: NONE_TEXT,
                continuous: NONE_CONTINUOUS,
            },
            buttons: {
                entrance: { type: 'slide-up', duration: 500, delay: 300, easing: 'ease-out', stagger: 0 },
                hover: { type: 'glow', intensity: 'subtle' },
                text: NONE_TEXT,
                continuous: NONE_CONTINUOUS,
            },
            lists: {
                entrance: { type: 'stagger-fade', duration: 500, delay: 100, easing: 'ease-out', stagger: 80 },
                hover: NONE_HOVER,
                text: NONE_TEXT,
                continuous: NONE_CONTINUOUS,
            },
            cards: {
                entrance: { type: 'slide-up', duration: 700, delay: 100, easing: 'ease-out', stagger: 100 },
                hover: { type: 'shadow-lift', intensity: 'medium' },
                text: NONE_TEXT,
                continuous: NONE_CONTINUOUS,
            },
        },
    },
    {
        id: 'spectaculaire',
        name: 'Spectaculaire',
        description: 'Animations vibrantes et percutantes',
        config: {
            sections: {
                entrance: { type: 'fade-in', duration: 1000, delay: 0, easing: 'ease-out', stagger: 0 },
                hover: NONE_HOVER,
                text: NONE_TEXT,
                continuous: NONE_CONTINUOUS,
            },
            headings: {
                entrance: { type: 'blur-in', duration: 900, delay: 100, easing: 'ease-out', stagger: 0 },
                hover: NONE_HOVER,
                text: { type: 'gradient-flow' },
                continuous: NONE_CONTINUOUS,
            },
            text: {
                entrance: { type: 'slide-up', duration: 700, delay: 200, easing: 'ease-out', stagger: 0 },
                hover: NONE_HOVER,
                text: NONE_TEXT,
                continuous: NONE_CONTINUOUS,
            },
            images: {
                entrance: { type: 'flip', duration: 1000, delay: 100, easing: 'ease-out', stagger: 0 },
                hover: { type: 'scale', intensity: 'strong' },
                text: NONE_TEXT,
                continuous: NONE_CONTINUOUS,
            },
            buttons: {
                entrance: { type: 'bounce', duration: 800, delay: 400, easing: 'ease-out', stagger: 0 },
                hover: { type: 'glow', intensity: 'medium' },
                text: NONE_TEXT,
                continuous: NONE_CONTINUOUS,
            },
            lists: {
                entrance: { type: 'stagger-fade', duration: 600, delay: 100, easing: 'ease-out', stagger: 100 },
                hover: NONE_HOVER,
                text: NONE_TEXT,
                continuous: NONE_CONTINUOUS,
            },
            cards: {
                entrance: { type: 'blur-in', duration: 800, delay: 100, easing: 'ease-out', stagger: 120 },
                hover: { type: 'shadow-lift', intensity: 'strong' },
                text: NONE_TEXT,
                continuous: NONE_CONTINUOUS,
            },
        },
    },
    {
        id: 'magazine',
        name: 'Magazine',
        description: 'Style editorial, reveille elegant',
        config: {
            sections: {
                entrance: { type: 'fade-in', duration: 1000, delay: 0, easing: 'ease-out', stagger: 0 },
                hover: NONE_HOVER,
                text: NONE_TEXT,
                continuous: NONE_CONTINUOUS,
            },
            headings: {
                entrance: { type: 'slide-up', duration: 900, delay: 100, easing: 'ease-out', stagger: 0 },
                hover: { type: 'underline-slide', intensity: 'medium' },
                text: NONE_TEXT,
                continuous: NONE_CONTINUOUS,
            },
            text: {
                entrance: { type: 'fade-in', duration: 800, delay: 200, easing: 'ease-out', stagger: 0 },
                hover: NONE_HOVER,
                text: NONE_TEXT,
                continuous: NONE_CONTINUOUS,
            },
            images: {
                entrance: { type: 'zoom-in', duration: 1000, delay: 100, easing: 'ease-out', stagger: 0 },
                hover: { type: 'scale', intensity: 'subtle' },
                text: NONE_TEXT,
                continuous: NONE_CONTINUOUS,
            },
            buttons: {
                entrance: { type: 'fade-in', duration: 600, delay: 300, easing: 'ease-out', stagger: 0 },
                hover: { type: 'underline-slide', intensity: 'subtle' },
                text: NONE_TEXT,
                continuous: NONE_CONTINUOUS,
            },
            lists: {
                entrance: { type: 'slide-up', duration: 700, delay: 150, easing: 'ease-out', stagger: 80 },
                hover: NONE_HOVER,
                text: NONE_TEXT,
                continuous: NONE_CONTINUOUS,
            },
            cards: {
                entrance: { type: 'fade-in', duration: 900, delay: 100, easing: 'ease-out', stagger: 0 },
                hover: { type: 'shadow-lift', intensity: 'subtle' },
                text: NONE_TEXT,
                continuous: NONE_CONTINUOUS,
            },
        },
    },
];

export const ENTRANCE_TYPES = [
    { value: 'none', label: 'Aucune' },
    { value: 'fade-in', label: 'Fondu' },
    { value: 'slide-up', label: 'Glisser haut' },
    { value: 'slide-down', label: 'Glisser bas' },
    { value: 'slide-left', label: 'Glisser gauche' },
    { value: 'slide-right', label: 'Glisser droite' },
    { value: 'zoom-in', label: 'Zoom entree' },
    { value: 'zoom-out', label: 'Zoom sortie' },
    { value: 'blur-in', label: 'Fondu flou' },
    { value: 'stagger-fade', label: 'Apparition decalee' },
    { value: 'rotate', label: 'Rotation' },
    { value: 'bounce', label: 'Rebond' },
    { value: 'flip', label: 'Retournement' },
];

export const HOVER_TYPES = [
    { value: 'none', label: 'Aucun' },
    { value: 'scale', label: 'Zoom' },
    { value: 'shadow-lift', label: 'Elevation' },
    { value: 'glow', label: 'Halo' },
    { value: 'underline-slide', label: 'Soulignement' },
];

export const TEXT_EFFECT_TYPES = [
    { value: 'none', label: 'Aucun' },
    { value: 'shimmer', label: 'Shimmer' },
    { value: 'gradient-flow', label: 'Gradient anime' },
];

export const INTENSITY_OPTIONS = [
    { value: 'subtle', label: 'Subtil' },
    { value: 'medium', label: 'Moyen' },
    { value: 'strong', label: 'Fort' },
] as const;

export const BLOCK_TYPE_CATEGORIES: { value: BlockTypeCategory; label: string }[] = [
    { value: 'sections', label: 'Sections' },
    { value: 'headings', label: 'Titres' },
    { value: 'text', label: 'Textes' },
    { value: 'images', label: 'Images' },
    { value: 'buttons', label: 'Boutons' },
    { value: 'lists', label: 'Listes' },
    { value: 'cards', label: 'Cartes' },
];

export function getPresetById(id: string): AnimationPreset | undefined {
    return ANIMATION_PRESETS.find(p => p.id === id);
}

export function presetToConfig(preset: AnimationPreset): AnimationConfig {
    return {
        presetId: preset.id,
        config: JSON.parse(JSON.stringify(preset.config)),
    };
}

export const DEFAULT_ANIMATION_CONFIG: AnimationConfig = presetToConfig(ANIMATION_PRESETS[0]);
