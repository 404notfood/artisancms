import {
    FileText,
    Newspaper,
    Image,
    Settings,
    Palette,
    Puzzle,
    Users,
    LayoutDashboard,
    Menu,
    Tags,
    LayoutGrid,
    LayoutTemplate,
    MessageSquare,
    BarChart3,
    Globe,
    ClipboardList,
    Mail,
    HardDrive,
    Sparkles,
    Truck,
    Receipt,
    Star,
    Warehouse,
    Package,
    ShoppingCart,
    Ticket,
    FolderTree,
} from 'lucide-react';
import { type CommandItem } from './types';

interface RawCommand {
    id: string;
    label: string;
    icon: typeof FileText;
    path: string; // relative to admin prefix
    category: string;
    keywords?: string[];
    description?: string;
}

const RAW_COMMANDS: RawCommand[] = [
    // Content
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard, path: '', category: 'Contenu' },
    { id: 'pages', label: 'Pages', icon: FileText, path: 'pages', category: 'Contenu', keywords: ['page', 'contenu'] },
    { id: 'pages-new', label: 'Nouvelle page', icon: FileText, path: 'pages/create', category: 'Contenu', keywords: ['creer', 'nouveau'] },
    { id: 'posts', label: 'Articles', icon: Newspaper, path: 'posts', category: 'Contenu', keywords: ['blog', 'article'] },
    { id: 'posts-new', label: 'Nouvel article', icon: Newspaper, path: 'posts/create', category: 'Contenu', keywords: ['creer', 'nouveau', 'blog'] },
    { id: 'media', label: 'Medias', icon: Image, path: 'media', category: 'Contenu', keywords: ['image', 'fichier', 'upload'] },
    { id: 'comments', label: 'Commentaires', icon: MessageSquare, path: 'comments', category: 'Contenu' },

    // Structure
    { id: 'menus', label: 'Menus', icon: Menu, path: 'menus', category: 'Structure', keywords: ['navigation'] },
    { id: 'taxonomies', label: 'Taxonomies', icon: Tags, path: 'taxonomies', category: 'Structure', keywords: ['categorie', 'tag'] },
    { id: 'widgets', label: 'Widgets', icon: LayoutGrid, path: 'widgets', category: 'Structure', keywords: ['sidebar'] },
    { id: 'global-sections', label: 'Sections globales', icon: LayoutTemplate, path: 'global-sections', category: 'Structure', keywords: ['header', 'footer'] },

    // Appearance
    { id: 'themes', label: 'Themes', icon: Palette, path: 'themes', category: 'Apparence' },
    { id: 'style-book', label: 'Style Book', description: 'Design Tokens', icon: Palette, path: 'design-tokens', category: 'Apparence', keywords: ['token', 'couleur', 'style'] },
    { id: 'plugins', label: 'Plugins', icon: Puzzle, path: 'plugins', category: 'Apparence', keywords: ['extension'] },
    { id: 'templates', label: 'Templates', icon: LayoutTemplate, path: 'templates', category: 'Apparence' },

    // Boutique
    { id: 'shop-products', label: 'Produits', icon: Package, path: 'shop/products', category: 'Boutique', keywords: ['product', 'produit'] },
    { id: 'shop-orders', label: 'Commandes', icon: ShoppingCart, path: 'shop/orders', category: 'Boutique', keywords: ['order', 'commande'] },
    { id: 'shop-coupons', label: 'Coupons', icon: Ticket, path: 'shop/coupons', category: 'Boutique', keywords: ['coupon', 'promo', 'reduction'] },
    { id: 'shop-categories', label: 'Categories boutique', icon: FolderTree, path: 'shop/categories', category: 'Boutique', keywords: ['categorie'] },
    { id: 'shop-shipping', label: 'Livraison', icon: Truck, path: 'shop/shipping', category: 'Boutique', keywords: ['shipping', 'expedition'] },
    { id: 'shop-tax', label: 'Taxes', icon: Receipt, path: 'shop/tax', category: 'Boutique', keywords: ['tva', 'taxe'] },
    { id: 'shop-stock', label: 'Stock', icon: Warehouse, path: 'shop/stock', category: 'Boutique', keywords: ['inventaire'] },
    { id: 'shop-reviews', label: 'Avis clients', icon: Star, path: 'shop/reviews', category: 'Boutique', keywords: ['review', 'avis'] },
    { id: 'shop-reports', label: 'Rapports ventes', icon: BarChart3, path: 'shop/reports', category: 'Boutique', keywords: ['stats', 'ventes', 'rapport'] },
    { id: 'shop-settings', label: 'Parametres boutique', icon: Settings, path: 'shop/settings', category: 'Boutique', keywords: ['shop', 'config'] },

    // Outils
    { id: 'forms', label: 'Form Builder', icon: ClipboardList, path: 'forms', category: 'Outils', keywords: ['form', 'formulaire', 'soumission', 'builder'] },
    { id: 'contact', label: 'Messages contact', icon: Mail, path: 'plugins/contact-form/submissions', category: 'Outils', keywords: ['contact', 'message'] },
    { id: 'backups', label: 'Sauvegardes', icon: HardDrive, path: 'backups', category: 'Outils', keywords: ['backup', 'restore', 'sauvegarde'] },
    { id: 'ai-settings', label: 'Assistant IA', icon: Sparkles, path: 'ai/settings', category: 'Outils', keywords: ['ia', 'ai', 'openai', 'anthropic'] },

    // System
    { id: 'settings', label: 'Parametres', icon: Settings, path: 'settings', category: 'Systeme', keywords: ['config'] },
    { id: 'users', label: 'Utilisateurs', icon: Users, path: 'users', category: 'Systeme', keywords: ['user', 'role'] },
    { id: 'analytics', label: 'Analytiques', icon: BarChart3, path: 'analytics', category: 'Systeme', keywords: ['stats', 'trafic'] },
    { id: 'sites', label: 'Sites', icon: Globe, path: 'sites', category: 'Systeme', keywords: ['multisite'] },
];

/**
 * Build commands with the dynamic admin prefix.
 */
export function getCommands(prefix: string = 'admin'): CommandItem[] {
    return RAW_COMMANDS.map((cmd) => ({
        id: cmd.id,
        label: cmd.label,
        icon: cmd.icon,
        href: cmd.path ? `/${prefix}/${cmd.path}` : `/${prefix}`,
        category: cmd.category,
        ...(cmd.keywords && { keywords: cmd.keywords }),
        ...(cmd.description && { description: cmd.description }),
    }));
}

/** Default commands (backwards compatible). */
export const COMMANDS: CommandItem[] = getCommands('admin');
