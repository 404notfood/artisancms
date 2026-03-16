export interface BlockColorScheme {
    ring: string;
    ringHover: string;
    label: string;
    dot: string;
}

const colorMap: Record<string, BlockColorScheme> = {
    layout: {
        ring: 'ring-indigo-500',
        ringHover: 'ring-indigo-300',
        label: 'bg-indigo-500',
        dot: 'bg-indigo-500',
    },
    content: {
        ring: 'ring-blue-500',
        ringHover: 'ring-blue-300',
        label: 'bg-blue-500',
        dot: 'bg-blue-500',
    },
    media: {
        ring: 'ring-amber-500',
        ringHover: 'ring-amber-300',
        label: 'bg-amber-500',
        dot: 'bg-amber-500',
    },
    interactive: {
        ring: 'ring-purple-500',
        ringHover: 'ring-purple-300',
        label: 'bg-purple-500',
        dot: 'bg-purple-500',
    },
    marketing: {
        ring: 'ring-pink-500',
        ringHover: 'ring-pink-300',
        label: 'bg-pink-500',
        dot: 'bg-pink-500',
    },
    data: {
        ring: 'ring-emerald-500',
        ringHover: 'ring-emerald-300',
        label: 'bg-emerald-500',
        dot: 'bg-emerald-500',
    },
};

const defaultColors: BlockColorScheme = {
    ring: 'ring-gray-500',
    ringHover: 'ring-gray-300',
    label: 'bg-gray-500',
    dot: 'bg-gray-500',
};

export function getBlockColorScheme(category: string): BlockColorScheme {
    return colorMap[category] ?? defaultColors;
}
