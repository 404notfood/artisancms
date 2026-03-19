export interface Template {
    slug: string;
    name: string;
    description?: string;
    category?: string;
    version?: string;
    thumbnail_url?: string;
}

export interface TemplatePageDetail {
    id: string;
    title: string;
    slug: string;
    meta_description: string;
    blocks_count: number;
}

export interface TemplateMenuDetail {
    name: string;
    location: string;
    items_count: number;
}

export interface TemplateThemeSummary {
    primary_color: string | null;
    secondary_color: string | null;
    font_heading: string | null;
    font_body: string | null;
}

export interface TemplateDetails {
    pages: TemplatePageDetail[];
    menus: TemplateMenuDetail[];
    has_settings: boolean;
    has_theme_overrides: boolean;
    theme_summary: TemplateThemeSummary | null;
}

export const categoryLabels: Record<string, string> = {
    blank: 'Vide',
    business: 'Business',
    creative: 'Creatif',
    content: 'Contenu',
    marketing: 'Marketing',
    restaurant: 'Restaurant',
    agency: 'Agence',
    portfolio: 'Portfolio',
    blog: 'Blog',
    custom: 'Personnalise',
};

export const categoryColors: Record<string, string> = {
    blank: 'bg-gray-50 text-gray-600 border-gray-200',
    business: 'bg-blue-50 text-blue-700 border-blue-200',
    creative: 'bg-purple-50 text-purple-700 border-purple-200',
    content: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    marketing: 'bg-orange-50 text-orange-700 border-orange-200',
    restaurant: 'bg-red-50 text-red-700 border-red-200',
    agency: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    portfolio: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    blog: 'bg-teal-50 text-teal-700 border-teal-200',
};

export const COLOR_PALETTES = [
    { name: 'Indigo', primary: '#4f46e5', heading: '#1e1b4b', text: '#374151' },
    { name: 'Emeraude', primary: '#059669', heading: '#064e3b', text: '#374151' },
    { name: 'Rose', primary: '#e11d48', heading: '#4c0519', text: '#374151' },
    { name: 'Ambre', primary: '#d97706', heading: '#451a03', text: '#374151' },
    { name: 'Ciel', primary: '#0284c7', heading: '#0c4a6e', text: '#374151' },
];

export interface WizardStep {
    id: number;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
}
