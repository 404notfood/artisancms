import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import {
    Search,
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
    ArrowRight,
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
    type LucideIcon,
} from 'lucide-react';

interface CommandItem {
    id: string;
    label: string;
    description?: string;
    icon: LucideIcon;
    href: string;
    category: string;
    keywords?: string[];
}

const COMMANDS: CommandItem[] = [
    // Content
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard, href: '/admin', category: 'Contenu' },
    { id: 'pages', label: 'Pages', icon: FileText, href: '/admin/pages', category: 'Contenu', keywords: ['page', 'contenu'] },
    { id: 'pages-new', label: 'Nouvelle page', icon: FileText, href: '/admin/pages/create', category: 'Contenu', keywords: ['creer', 'nouveau'] },
    { id: 'posts', label: 'Articles', icon: Newspaper, href: '/admin/posts', category: 'Contenu', keywords: ['blog', 'article'] },
    { id: 'posts-new', label: 'Nouvel article', icon: Newspaper, href: '/admin/posts/create', category: 'Contenu', keywords: ['creer', 'nouveau', 'blog'] },
    { id: 'media', label: 'Medias', icon: Image, href: '/admin/media', category: 'Contenu', keywords: ['image', 'fichier', 'upload'] },
    { id: 'comments', label: 'Commentaires', icon: MessageSquare, href: '/admin/comments', category: 'Contenu' },

    // Structure
    { id: 'menus', label: 'Menus', icon: Menu, href: '/admin/menus', category: 'Structure', keywords: ['navigation'] },
    { id: 'taxonomies', label: 'Taxonomies', icon: Tags, href: '/admin/taxonomies', category: 'Structure', keywords: ['categorie', 'tag'] },
    { id: 'widgets', label: 'Widgets', icon: LayoutGrid, href: '/admin/widgets', category: 'Structure', keywords: ['sidebar'] },
    { id: 'global-sections', label: 'Sections globales', icon: LayoutTemplate, href: '/admin/global-sections', category: 'Structure', keywords: ['header', 'footer'] },

    // Appearance
    { id: 'themes', label: 'Themes', icon: Palette, href: '/admin/themes', category: 'Apparence' },
    { id: 'style-book', label: 'Style Book', description: 'Design Tokens', icon: Palette, href: '/admin/design-tokens', category: 'Apparence', keywords: ['token', 'couleur', 'style'] },
    { id: 'plugins', label: 'Plugins', icon: Puzzle, href: '/admin/plugins', category: 'Apparence', keywords: ['extension'] },
    { id: 'templates', label: 'Templates', icon: LayoutTemplate, href: '/admin/templates', category: 'Apparence' },

    // Boutique
    { id: 'shop-products', label: 'Produits', icon: Package, href: '/admin/shop/products', category: 'Boutique', keywords: ['product', 'produit'] },
    { id: 'shop-orders', label: 'Commandes', icon: ShoppingCart, href: '/admin/shop/orders', category: 'Boutique', keywords: ['order', 'commande'] },
    { id: 'shop-coupons', label: 'Coupons', icon: Ticket, href: '/admin/shop/coupons', category: 'Boutique', keywords: ['coupon', 'promo', 'reduction'] },
    { id: 'shop-categories', label: 'Categories boutique', icon: FolderTree, href: '/admin/shop/categories', category: 'Boutique', keywords: ['categorie'] },
    { id: 'shop-shipping', label: 'Livraison', icon: Truck, href: '/admin/shop/shipping', category: 'Boutique', keywords: ['shipping', 'expedition'] },
    { id: 'shop-tax', label: 'Taxes', icon: Receipt, href: '/admin/shop/tax', category: 'Boutique', keywords: ['tva', 'taxe'] },
    { id: 'shop-stock', label: 'Stock', icon: Warehouse, href: '/admin/shop/stock', category: 'Boutique', keywords: ['inventaire'] },
    { id: 'shop-reviews', label: 'Avis clients', icon: Star, href: '/admin/shop/reviews', category: 'Boutique', keywords: ['review', 'avis'] },
    { id: 'shop-reports', label: 'Rapports ventes', icon: BarChart3, href: '/admin/shop/reports', category: 'Boutique', keywords: ['stats', 'ventes', 'rapport'] },
    { id: 'shop-settings', label: 'Parametres boutique', icon: Settings, href: '/admin/shop/settings', category: 'Boutique', keywords: ['shop', 'config'] },

    // Outils
    { id: 'forms', label: 'Form Builder', icon: ClipboardList, href: '/admin/forms', category: 'Outils', keywords: ['form', 'formulaire', 'soumission', 'builder'] },
    { id: 'contact', label: 'Messages contact', icon: Mail, href: '/admin/plugins/contact-form/submissions', category: 'Outils', keywords: ['contact', 'message'] },
    { id: 'backups', label: 'Sauvegardes', icon: HardDrive, href: '/admin/backups', category: 'Outils', keywords: ['backup', 'restore', 'sauvegarde'] },
    { id: 'ai-settings', label: 'Assistant IA', icon: Sparkles, href: '/admin/ai/settings', category: 'Outils', keywords: ['ia', 'ai', 'openai', 'anthropic'] },

    // System
    { id: 'settings', label: 'Parametres', icon: Settings, href: '/admin/settings', category: 'Systeme', keywords: ['config'] },
    { id: 'users', label: 'Utilisateurs', icon: Users, href: '/admin/users', category: 'Systeme', keywords: ['user', 'role'] },
    { id: 'analytics', label: 'Analytiques', icon: BarChart3, href: '/admin/analytics', category: 'Systeme', keywords: ['stats', 'trafic'] },
    { id: 'sites', label: 'Sites', icon: Globe, href: '/admin/sites', category: 'Systeme', keywords: ['multisite'] },
];

export default function CommandPalette() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    // Toggle with Ctrl+K
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setOpen((prev) => !prev);
                setQuery('');
                setSelectedIndex(0);
            }
            if (e.key === 'Escape') {
                setOpen(false);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    // Focus input when opened
    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [open]);

    // Fuzzy search
    const filtered = useMemo(() => {
        if (!query.trim()) return COMMANDS;
        const q = query.toLowerCase();
        return COMMANDS.filter((cmd) => {
            const haystack = [
                cmd.label,
                cmd.description ?? '',
                cmd.category,
                ...(cmd.keywords ?? []),
            ]
                .join(' ')
                .toLowerCase();
            return haystack.includes(q);
        });
    }, [query]);

    // Group by category
    const grouped = useMemo(() => {
        const map = new Map<string, CommandItem[]>();
        for (const item of filtered) {
            if (!map.has(item.category)) map.set(item.category, []);
            map.get(item.category)!.push(item);
        }
        return map;
    }, [filtered]);

    // Flatten for keyboard nav
    const flatItems = useMemo(() => filtered, [filtered]);

    // Keyboard navigation
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex((i) => Math.min(i + 1, flatItems.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex((i) => Math.max(i - 1, 0));
            } else if (e.key === 'Enter' && flatItems[selectedIndex]) {
                e.preventDefault();
                navigate(flatItems[selectedIndex].href);
            }
        },
        [flatItems, selectedIndex],
    );

    const navigate = (href: string) => {
        setOpen(false);
        router.visit(href);
    };

    // Scroll selected into view
    useEffect(() => {
        const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
        el?.scrollIntoView({ block: 'nearest' });
    }, [selectedIndex]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    if (!open) return null;

    let flatIndex = -1;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />

            {/* Dialog */}
            <div className="relative w-full max-w-lg mx-4 bg-white rounded-xl shadow-2xl border overflow-hidden">
                {/* Search input */}
                <div className="flex items-center gap-3 border-b px-4 py-3">
                    <Search className="h-5 w-5 text-gray-400 shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Rechercher une page, action..."
                        className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
                    />
                    <kbd className="hidden sm:inline-flex items-center rounded border bg-gray-50 px-1.5 py-0.5 text-[10px] font-mono text-gray-400">
                        ESC
                    </kbd>
                </div>

                {/* Results */}
                <div ref={listRef} className="max-h-[50vh] overflow-y-auto py-2">
                    {flatItems.length > 0 ? (
                        Array.from(grouped.entries()).map(([category, items]) => (
                            <div key={category}>
                                <p className="px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                                    {category}
                                </p>
                                {items.map((item) => {
                                    flatIndex++;
                                    const idx = flatIndex;
                                    const Icon = item.icon;
                                    return (
                                        <button
                                            key={item.id}
                                            data-index={idx}
                                            onClick={() => navigate(item.href)}
                                            onMouseEnter={() => setSelectedIndex(idx)}
                                            className={cn(
                                                'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                                                selectedIndex === idx
                                                    ? 'bg-indigo-50 text-indigo-700'
                                                    : 'text-gray-700 hover:bg-gray-50',
                                            )}
                                        >
                                            <Icon className="h-4 w-4 shrink-0 opacity-60" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{item.label}</p>
                                                {item.description && (
                                                    <p className="text-xs text-gray-400 truncate">{item.description}</p>
                                                )}
                                            </div>
                                            {selectedIndex === idx && (
                                                <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-50" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        ))
                    ) : (
                        <div className="px-4 py-8 text-center">
                            <p className="text-sm text-gray-400">Aucun resultat pour "{query}"</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t px-4 py-2 flex items-center gap-4 text-[11px] text-gray-400">
                    <span><kbd className="font-mono">↑↓</kbd> naviguer</span>
                    <span><kbd className="font-mono">↵</kbd> ouvrir</span>
                    <span><kbd className="font-mono">esc</kbd> fermer</span>
                </div>
            </div>
        </div>
    );
}
