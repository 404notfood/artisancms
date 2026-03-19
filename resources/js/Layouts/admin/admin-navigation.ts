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

const NAV_DEFS: NavGroup[] = [
    {
        title: 'Contenu',
        items: [
            { label: 'Tableau de bord', href: '/admin', icon: LayoutDashboard },
            { label: 'Pages', href: '/admin/pages', icon: FileText },
            { label: 'Articles', href: '/admin/posts', icon: Newspaper },
            { label: 'Medias', href: '/admin/media', icon: Image },
            { label: 'Commentaires', href: '/admin/comments', icon: MessageSquare, badgeKey: 'unread_comments' },
        ],
    },
    {
        title: 'Structure',
        items: [
            { label: 'Menus', href: '/admin/menus', icon: Menu },
            { label: 'Sections globales', href: '/admin/global-sections', icon: LayoutTemplate },
            { label: 'Widgets', href: '/admin/widgets', icon: LayoutGrid },
            { label: 'Taxonomies', href: '/admin/taxonomies', icon: Tags },
        ],
    },
    {
        title: 'Boutique',
        requiresPlugin: 'ecommerce',
        items: [
            { label: 'Produits', href: '/admin/shop/products', icon: Package },
            { label: 'Commandes', href: '/admin/shop/orders', icon: ShoppingCart, badgeKey: 'pending_orders' },
            { label: 'Coupons', href: '/admin/shop/coupons', icon: Ticket },
            { label: 'Categories', href: '/admin/shop/categories', icon: FolderTree },
            { label: 'Livraison', href: '/admin/shop/shipping', icon: Truck },
            { label: 'Taxes', href: '/admin/shop/tax', icon: Receipt },
            { label: 'Stock', href: '/admin/shop/stock', icon: Warehouse },
            { label: 'Avis', href: '/admin/shop/reviews', icon: Star },
            { label: 'Rapports', href: '/admin/shop/reports', icon: BarChart3 },
            { label: 'Parametres', href: '/admin/shop/settings', icon: Settings },
        ],
    },
    {
        title: 'Espace Membres',
        requiresPlugin: 'member-space',
        items: [
            { label: 'Membres', href: '/admin/member-space/members', icon: Users },
            { label: 'Plans', href: '/admin/member-space/plans', icon: Crown },
            { label: 'Champs perso.', href: '/admin/member-space/fields', icon: ClipboardList },
            { label: 'Verifications', href: '/admin/member-space/verifications', icon: UserCheck, badgeKey: 'pending_verifications' },
            { label: 'Restrictions', href: '/admin/member-space/restrictions', icon: Lock },
            { label: 'Parametres', href: '/admin/member-space/settings', icon: Settings },
        ],
    },
    {
        title: 'Outils',
        items: [
            { label: 'Form Builder', href: '/admin/forms', icon: ClipboardList, requiresPlugin: 'form-builder', badgeKey: 'new_forms' },
            { label: 'Messages contact', href: '/admin/plugins/contact-form/submissions', icon: Mail, requiresPlugin: 'contact-form', badgeKey: 'new_contacts' },
            { label: 'Sauvegardes', href: '/admin/backups', icon: HardDrive, requiresPlugin: 'backup' },
            { label: 'Assistant IA', href: '/admin/ai/settings', icon: Sparkles, requiresPlugin: 'ai-assistant' },
        ],
    },
    {
        title: 'Apparence',
        items: [
            { label: 'Themes', href: '/admin/themes', icon: Palette },
            { label: 'Style Book', href: '/admin/design-tokens', icon: Palette },
            { label: 'Templates', href: '/admin/templates', icon: BookTemplate },
            { label: 'Plugins', href: '/admin/plugins', icon: Puzzle },
        ],
    },
    {
        title: 'Systeme',
        items: [
            { label: 'Utilisateurs', href: '/admin/users', icon: Users },
            { label: 'Roles', href: '/admin/roles', icon: Shield },
            { label: 'Redirections', href: '/admin/redirects', icon: ArrowRightLeft },
            { label: 'Parametres', href: '/admin/settings', icon: Settings },
        ],
    },
];

export { NAV_DEFS };

export function getNavigation(enabledPlugins: string[]): NavGroup[] {
    return NAV_DEFS
        .filter((g) => !g.requiresPlugin || enabledPlugins.includes(g.requiresPlugin))
        .map((g) => ({
            ...g,
            items: g.items.filter((i) => !i.requiresPlugin || enabledPlugins.includes(i.requiresPlugin)),
        }))
        .filter((g) => g.items.length > 0);
}

export function isActive(href: string, currentUrl: string): boolean {
    if (href === '/admin') return currentUrl === '/admin' || currentUrl === '/admin/';
    return currentUrl.startsWith(href);
}
