import {
    LayoutDashboard,
    LayoutGrid,
    LayoutTemplate,
    FileText,
    Newspaper,
    Image,
    Menu,
    Tags,
    Package,
    ShoppingCart,
    Ticket,
    FolderTree,
    Palette,
    Puzzle,
    BookTemplate,
    Settings,
    Mail,
    HardDrive,
    Sparkles,
    Truck,
    Receipt,
    Star,
    Warehouse,
    BarChart3,
    Users,
    UserCheck,
    Crown,
    Lock,
    ClipboardList,
    MessageSquare,
    Shield,
    ArrowRightLeft,
    type LucideIcon,
} from 'lucide-react';

export interface NavItem {
    label: string;
    href: string;
    icon: LucideIcon;
    badgeKey?: string;
    requiresPlugin?: string;
    children?: NavItem[];
}

export interface NavGroup {
    title: string;
    items: NavItem[];
    requiresPlugin?: string;
}

/**
 * Raw nav definitions using relative paths (no prefix).
 * The prefix is prepended at runtime by buildNavDefs().
 */
interface RawNavItem {
    label: string;
    path: string; // relative path (e.g. 'pages', 'shop/products', '' for dashboard)
    icon: LucideIcon;
    badgeKey?: string;
    requiresPlugin?: string;
}

interface RawNavGroup {
    title: string;
    items: RawNavItem[];
    requiresPlugin?: string;
}

const RAW_DASHBOARD: RawNavItem = { label: 'Tableau de bord', path: '', icon: LayoutDashboard };

const RAW_NAV_DEFS: RawNavGroup[] = [
    {
        title: 'Contenu',
        items: [
            { label: 'Pages', path: 'pages', icon: FileText },
            { label: 'Articles', path: 'posts', icon: Newspaper },
            { label: 'Medias', path: 'media', icon: Image },
            { label: 'Commentaires', path: 'comments', icon: MessageSquare, badgeKey: 'unread_comments' },
        ],
    },
    {
        title: 'Structure',
        items: [
            { label: 'Menus', path: 'menus', icon: Menu },
            { label: 'Sections globales', path: 'global-sections', icon: LayoutTemplate },
            { label: 'Widgets', path: 'widgets', icon: LayoutGrid },
            { label: 'Taxonomies', path: 'taxonomies', icon: Tags },
        ],
    },
    {
        title: 'Boutique',
        requiresPlugin: 'ecommerce',
        items: [
            { label: 'Produits', path: 'shop/products', icon: Package },
            { label: 'Commandes', path: 'shop/orders', icon: ShoppingCart, badgeKey: 'pending_orders' },
            { label: 'Coupons', path: 'shop/coupons', icon: Ticket },
            { label: 'Categories', path: 'shop/categories', icon: FolderTree },
            { label: 'Livraison', path: 'shop/shipping', icon: Truck },
            { label: 'Taxes', path: 'shop/tax', icon: Receipt },
            { label: 'Stock', path: 'shop/stock', icon: Warehouse },
            { label: 'Avis', path: 'shop/reviews', icon: Star },
            { label: 'Rapports', path: 'shop/reports', icon: BarChart3 },
            { label: 'Parametres', path: 'shop/settings', icon: Settings },
        ],
    },
    {
        title: 'Espace Membres',
        requiresPlugin: 'member-space',
        items: [
            { label: 'Membres', path: 'member-space/members', icon: Users },
            { label: 'Plans', path: 'member-space/plans', icon: Crown },
            { label: 'Champs perso.', path: 'member-space/fields', icon: ClipboardList },
            { label: 'Verifications', path: 'member-space/verifications', icon: UserCheck, badgeKey: 'pending_verifications' },
            { label: 'Restrictions', path: 'member-space/restrictions', icon: Lock },
            { label: 'Parametres', path: 'member-space/settings', icon: Settings },
        ],
    },
    {
        title: 'Outils',
        items: [
            { label: 'Form Builder', path: 'forms', icon: ClipboardList, requiresPlugin: 'form-builder', badgeKey: 'new_forms' },
            { label: 'Messages contact', path: 'plugins/contact-form/submissions', icon: Mail, requiresPlugin: 'contact-form', badgeKey: 'new_contacts' },
            { label: 'Sauvegardes', path: 'backups', icon: HardDrive, requiresPlugin: 'backup' },
            { label: 'Assistant IA', path: 'ai/settings', icon: Sparkles, requiresPlugin: 'ai-assistant' },
        ],
    },
    {
        title: 'Apparence',
        items: [
            { label: 'Themes', path: 'themes', icon: Palette },
            { label: 'Style Book', path: 'design-tokens', icon: Palette },
            { label: 'Templates', path: 'templates', icon: BookTemplate },
            { label: 'Plugins', path: 'plugins', icon: Puzzle },
        ],
    },
    {
        title: 'Systeme',
        items: [
            { label: 'Utilisateurs', path: 'users', icon: Users },
            { label: 'Roles', path: 'settings/roles', icon: Shield },
            { label: 'Redirections', path: 'redirects', icon: ArrowRightLeft },
            { label: 'Parametres', path: 'settings', icon: Settings },
        ],
    },
];

function buildItem(raw: RawNavItem, prefix: string): NavItem {
    return {
        label: raw.label,
        href: raw.path ? `/${prefix}/${raw.path}` : `/${prefix}`,
        icon: raw.icon,
        ...(raw.badgeKey && { badgeKey: raw.badgeKey }),
        ...(raw.requiresPlugin && { requiresPlugin: raw.requiresPlugin }),
    };
}

/**
 * Build the dashboard item with the given admin prefix.
 */
export function buildDashboardItem(prefix: string = 'admin'): NavItem {
    return buildItem(RAW_DASHBOARD, prefix);
}

/** Default dashboard item (for backwards compatibility). */
export const DASHBOARD_ITEM: NavItem = buildDashboardItem('admin');

/**
 * Build all nav groups with the given admin prefix.
 */
export function buildNavDefs(prefix: string = 'admin'): NavGroup[] {
    return RAW_NAV_DEFS.map((g) => ({
        title: g.title,
        items: g.items.map((i) => buildItem(i, prefix)),
        ...(g.requiresPlugin && { requiresPlugin: g.requiresPlugin }),
    }));
}

/** Default nav defs (backwards compatible). */
export const NAV_DEFS: NavGroup[] = buildNavDefs('admin');

/**
 * Get navigation filtered by enabled plugins.
 */
export function getNavigation(enabledPlugins: string[], prefix: string = 'admin'): NavGroup[] {
    const defs = buildNavDefs(prefix);
    return defs
        .filter((g) => !g.requiresPlugin || enabledPlugins.includes(g.requiresPlugin))
        .map((g) => ({
            ...g,
            items: g.items.filter((i) => !i.requiresPlugin || enabledPlugins.includes(i.requiresPlugin)),
        }))
        .filter((g) => g.items.length > 0);
}

/**
 * Check if a nav item is active based on current URL.
 */
export function isActive(href: string, currentUrl: string, prefix: string = 'admin'): boolean {
    const dashboardHref = `/${prefix}`;
    if (href === dashboardHref) return currentUrl === dashboardHref || currentUrl === `${dashboardHref}/`;
    return currentUrl.startsWith(href);
}
