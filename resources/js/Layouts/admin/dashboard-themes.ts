export interface DashboardTheme {
    id: string;
    name: string;
    description: string;
    colors: {
        primary: string;
        primaryHover: string;
        sidebarBg: string;
        sidebarText: string;
        sidebarActive: string;
        accent: string;
        logoBg: string;
        logoGradient: string;
    };
}

export const DASHBOARD_THEMES: DashboardTheme[] = [
    {
        id: 'indigo',
        name: 'Indigo',
        description: 'Classique et professionnel',
        colors: {
            primary: '#6366f1',
            primaryHover: '#4f46e5',
            sidebarBg: '#0f172a',
            sidebarText: '#94a3b8',
            sidebarActive: '#6366f1',
            accent: '#818cf8',
            logoBg: 'from-indigo-500 to-indigo-600',
            logoGradient: 'linear-gradient(135deg, #6366f1, #4f46e5)',
        },
    },
    {
        id: 'emerald',
        name: 'Emeraude',
        description: 'Nature et croissance',
        colors: {
            primary: '#10b981',
            primaryHover: '#059669',
            sidebarBg: '#022c22',
            sidebarText: '#6ee7b7',
            sidebarActive: '#10b981',
            accent: '#34d399',
            logoBg: 'from-emerald-500 to-emerald-600',
            logoGradient: 'linear-gradient(135deg, #10b981, #059669)',
        },
    },
    {
        id: 'rose',
        name: 'Rose',
        description: 'Audacieux et creatif',
        colors: {
            primary: '#f43f5e',
            primaryHover: '#e11d48',
            sidebarBg: '#1a0610',
            sidebarText: '#fda4af',
            sidebarActive: '#f43f5e',
            accent: '#fb7185',
            logoBg: 'from-rose-500 to-rose-600',
            logoGradient: 'linear-gradient(135deg, #f43f5e, #e11d48)',
        },
    },
    {
        id: 'amber',
        name: 'Ambre',
        description: 'Chaleureux et accueillant',
        colors: {
            primary: '#f59e0b',
            primaryHover: '#d97706',
            sidebarBg: '#1c1306',
            sidebarText: '#fcd34d',
            sidebarActive: '#f59e0b',
            accent: '#fbbf24',
            logoBg: 'from-amber-500 to-amber-600',
            logoGradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
        },
    },
    {
        id: 'slate',
        name: 'Ardoise',
        description: 'Sobre et elegant',
        colors: {
            primary: '#3b82f6',
            primaryHover: '#2563eb',
            sidebarBg: '#0f172a',
            sidebarText: '#94a3b8',
            sidebarActive: '#3b82f6',
            accent: '#60a5fa',
            logoBg: 'from-blue-500 to-blue-600',
            logoGradient: 'linear-gradient(135deg, #3b82f6, #2563eb)',
        },
    },
    {
        id: 'auto',
        name: 'Auto (Theme actif)',
        description: 'Couleurs adaptees au theme du site',
        colors: {
            primary: 'var(--color-primary, #6366f1)',
            primaryHover: 'var(--color-primary-hover, #4f46e5)',
            sidebarBg: '#0f172a',
            sidebarText: '#94a3b8',
            sidebarActive: 'var(--color-primary, #6366f1)',
            accent: 'var(--color-accent, #818cf8)',
            logoBg: 'from-indigo-500 to-indigo-600',
            logoGradient: 'var(--color-primary, #6366f1)',
        },
    },
];

export function getDashboardTheme(themeId: string): DashboardTheme {
    return DASHBOARD_THEMES.find((t) => t.id === themeId) ?? DASHBOARD_THEMES[0];
}

export function buildDashboardCssVars(theme: DashboardTheme): Record<string, string> {
    return {
        '--admin-primary': theme.colors.primary,
        '--admin-primary-hover': theme.colors.primaryHover,
        '--admin-sidebar-bg': theme.colors.sidebarBg,
        '--admin-sidebar-text': theme.colors.sidebarText,
        '--admin-sidebar-active': theme.colors.sidebarActive,
        '--admin-accent': theme.colors.accent,
    };
}
