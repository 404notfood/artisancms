import { Link, usePage, router } from '@inertiajs/react';
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import type { SharedProps } from '@/types/cms';
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
    Bell,
    LogOut,
    ChevronsLeft,
    ChevronsRight,
    PanelLeft,
    User,
    X,
    CheckCircle,
    AlertCircle,
    AlertTriangle,
    Info,
    type LucideIcon,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AdminLayoutProps {
    header?: ReactNode;
    children: ReactNode;
}

interface NavItem {
    label: string;
    href: string;
    icon: LucideIcon;
}

interface NavGroup {
    title: string;
    items: NavItem[];
}

// ---------------------------------------------------------------------------
// Navigation config
// ---------------------------------------------------------------------------

interface NavGroupDef extends NavGroup {
    /** If set, this group is only visible when the given plugin slug is enabled */
    requiresPlugin?: string;
}

const navigationDefs: NavGroupDef[] = [
    {
        title: 'Contenu',
        items: [
            { label: 'Tableau de bord', href: '/admin', icon: LayoutDashboard },
            { label: 'Pages', href: '/admin/pages', icon: FileText },
            { label: 'Articles', href: '/admin/posts', icon: Newspaper },
            { label: 'Medias', href: '/admin/media', icon: Image },
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
            { label: 'Commandes', href: '/admin/shop/orders', icon: ShoppingCart },
            { label: 'Coupons', href: '/admin/shop/coupons', icon: Ticket },
            { label: 'Categories', href: '/admin/shop/categories', icon: FolderTree },
        ],
    },
    {
        title: 'Apparence',
        items: [
            { label: 'Themes', href: '/admin/themes', icon: Palette },
            { label: 'Templates', href: '/admin/templates', icon: BookTemplate },
            { label: 'Plugins', href: '/admin/plugins', icon: Puzzle },
        ],
    },
    {
        title: 'Systeme',
        items: [
            { label: 'Parametres', href: '/admin/settings', icon: Settings },
        ],
    },
];

function getNavigation(enabledPlugins: string[]): NavGroup[] {
    return navigationDefs.filter((group) => {
        if (group.requiresPlugin) {
            return enabledPlugins.includes(group.requiresPlugin);
        }
        return true;
    });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SIDEBAR_KEY = 'artisan_sidebar_collapsed';

function getInitialCollapsed(): boolean {
    if (typeof window === 'undefined') return false;
    try {
        return localStorage.getItem(SIDEBAR_KEY) === '1';
    } catch {
        return false;
    }
}

function isActive(href: string, currentUrl: string): boolean {
    if (href === '/admin') {
        return currentUrl === '/admin' || currentUrl === '/admin/';
    }
    return currentUrl.startsWith(href);
}

// ---------------------------------------------------------------------------
// Flash toast component
// ---------------------------------------------------------------------------

interface ToastItem {
    id: number;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
}

const toastConfig: Record<ToastItem['type'], { icon: LucideIcon; bg: string; border: string; text: string }> = {
    success: { icon: CheckCircle, bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800' },
    error: { icon: AlertCircle, bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800' },
    warning: { icon: AlertTriangle, bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800' },
    info: { icon: Info, bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800' },
};

let toastIdCounter = 0;

function FlashToasts({ flash }: { flash: SharedProps['flash'] }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    useEffect(() => {
        const incoming: ToastItem[] = [];
        for (const type of ['success', 'error', 'warning', 'info'] as const) {
            if (flash?.[type]) {
                incoming.push({ id: ++toastIdCounter, type, message: flash[type]! });
            }
        }
        if (incoming.length > 0) {
            setToasts((prev) => [...prev, ...incoming]);
        }
    }, [flash]);

    useEffect(() => {
        if (toasts.length === 0) return;
        const timer = setTimeout(() => {
            setToasts((prev) => prev.slice(1));
        }, 5000);
        return () => clearTimeout(timer);
    }, [toasts]);

    const dismiss = useCallback((id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80">
            {toasts.map((toast) => {
                const cfg = toastConfig[toast.type];
                const Icon = cfg.icon;
                return (
                    <div
                        key={toast.id}
                        className={cn(
                            'flex items-start gap-3 rounded-lg border p-4 shadow-lg animate-in slide-in-from-right-5 fade-in duration-300',
                            cfg.bg,
                            cfg.border,
                        )}
                    >
                        <Icon className={cn('h-5 w-5 shrink-0 mt-0.5', cfg.text)} />
                        <p className={cn('text-sm font-medium flex-1', cfg.text)}>{toast.message}</p>
                        <button
                            onClick={() => dismiss(toast.id)}
                            className={cn('shrink-0 hover:opacity-70', cfg.text)}
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Sidebar nav item
// ---------------------------------------------------------------------------

function SidebarNavItem({
    item,
    active,
    collapsed,
}: {
    item: NavItem;
    active: boolean;
    collapsed: boolean;
}) {
    const Icon = item.icon;

    return (
        <Link
            href={item.href}
            className={cn(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                active
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200',
                collapsed && 'justify-center px-0',
            )}
        >
            <Icon className={cn('h-5 w-5 shrink-0', active ? 'text-white' : 'text-slate-500 group-hover:text-slate-300')} />
            {!collapsed && <span className="truncate">{item.label}</span>}
            {collapsed && (
                <span className="pointer-events-none absolute left-full ml-3 rounded-md bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-200 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 whitespace-nowrap z-50 border border-slate-700">
                    {item.label}
                </span>
            )}
        </Link>
    );
}

// ---------------------------------------------------------------------------
// Main layout
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Notification types
// ---------------------------------------------------------------------------

interface NotificationItem {
    id: number;
    type: string;
    title: string;
    message: string;
    read_at: string | null;
    created_at: string;
}

const notificationIcons: Record<string, string> = {
    comment: 'comment',
    form_submission: 'form',
    content_published: 'publish',
    content_pending: 'pending',
    backup_completed: 'backup',
};

function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMinutes < 1) return 'A l\'instant';
    if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;

    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

export default function AdminLayout({ header, children }: AdminLayoutProps) {
    const { auth, flash, cms, notifications_count } = usePage<SharedProps>().props;
    const currentUrl = usePage().url;

    const enabledPlugins = cms?.enabledPlugins ?? [];
    const navigation = getNavigation(enabledPlugins);

    const [collapsed, setCollapsed] = useState(getInitialCollapsed);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [notifLoading, setNotifLoading] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);
    const unreadCount = (notifications_count as number) ?? 0;

    // Close notifications dropdown on click outside
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
                setNotifOpen(false);
            }
        }
        if (notifOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [notifOpen]);

    const toggleNotifications = useCallback(() => {
        setNotifOpen((prev) => {
            const next = !prev;
            if (next && notifications.length === 0) {
                setNotifLoading(true);
                fetch('/admin/notifications', {
                    headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                    credentials: 'same-origin',
                })
                    .then((res) => res.json())
                    .then((data) => {
                        setNotifications(data.data ?? []);
                    })
                    .catch(() => {})
                    .finally(() => setNotifLoading(false));
            }
            return next;
        });
    }, [notifications.length]);

    const markAsRead = useCallback((notifId: number) => {
        fetch(`/admin/notifications/${notifId}/read`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-XSRF-TOKEN': decodeURIComponent(
                    document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? ''
                ),
            },
            credentials: 'same-origin',
        }).then(() => {
            setNotifications((prev) =>
                prev.map((n) => n.id === notifId ? { ...n, read_at: new Date().toISOString() } : n)
            );
            router.reload({ only: ['notifications_count'] });
        });
    }, []);

    const markAllAsRead = useCallback(() => {
        fetch('/admin/notifications/read-all', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-XSRF-TOKEN': decodeURIComponent(
                    document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? ''
                ),
            },
            credentials: 'same-origin',
        }).then(() => {
            setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
            router.reload({ only: ['notifications_count'] });
        });
    }, []);

    const toggleCollapsed = useCallback(() => {
        setCollapsed((prev) => {
            const next = !prev;
            try { localStorage.setItem(SIDEBAR_KEY, next ? '1' : '0'); } catch { /* noop */ }
            return next;
        });
    }, []);

    // Close mobile sidebar on navigation
    useEffect(() => {
        setMobileOpen(false);
    }, [currentUrl]);

    // Lock body scroll when mobile sidebar is open
    useEffect(() => {
        if (mobileOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [mobileOpen]);

    const sidebarWidth = collapsed ? 'w-[72px]' : 'w-[260px]';
    const mainPadding = collapsed ? 'lg:pl-[72px]' : 'lg:pl-[260px]';
    const userInitials = auth.user?.name
        ? auth.user.name
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()
        : '?';

    // -----------------------------------------------------------------------
    // Sidebar content (shared between desktop and mobile)
    // -----------------------------------------------------------------------
    const sidebarContent = (
        <>
            {/* Logo */}
            <div className={cn('flex h-16 items-center shrink-0 border-b border-slate-800', collapsed ? 'justify-center px-2' : 'gap-3 px-5')}>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-md shadow-indigo-500/25">
                    <span className="text-sm font-bold text-white">A</span>
                </div>
                {!collapsed && (
                    <span className="text-base font-semibold text-white tracking-tight truncate">
                        {cms?.name ?? 'ArtisanCMS'}
                    </span>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-thin">
                {navigation.map((group) => (
                    <div key={group.title}>
                        {!collapsed && (
                            <h3 className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                {group.title}
                            </h3>
                        )}
                        {collapsed && <div className="mb-1 mx-auto h-px w-6 bg-slate-800" />}
                        <div className="space-y-0.5">
                            {group.items.map((item) => (
                                <SidebarNavItem
                                    key={item.href}
                                    item={item}
                                    active={isActive(item.href, currentUrl)}
                                    collapsed={collapsed}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Collapse toggle (desktop only, hidden on mobile overlay) */}
            <div className="hidden lg:block border-t border-slate-800">
                <button
                    onClick={toggleCollapsed}
                    className="flex w-full items-center justify-center gap-2 py-3 text-slate-500 hover:text-slate-300 transition-colors"
                    title={collapsed ? 'Agrandir le menu' : 'Reduire le menu'}
                >
                    {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
                    {!collapsed && <span className="text-xs font-medium">Reduire</span>}
                </button>
            </div>

            {/* User section */}
            <div className={cn('border-t border-slate-800 p-3', collapsed && 'flex flex-col items-center gap-2 py-3')}>
                <div className={cn('flex items-center', collapsed ? 'flex-col gap-2' : 'gap-3')}>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-700 ring-2 ring-slate-600">
                        <span className="text-xs font-semibold text-slate-300">{userInitials}</span>
                    </div>
                    {!collapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="truncate text-sm font-medium text-slate-200">{auth.user?.name}</p>
                            <p className="truncate text-xs text-slate-500">{auth.user?.email}</p>
                        </div>
                    )}
                    {!collapsed && (
                        <div className="flex items-center gap-1">
                            <Link
                                href="/admin/settings"
                                className="rounded-md p-1.5 text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-colors"
                                title="Profil"
                            >
                                <User className="h-4 w-4" />
                            </Link>
                            <Link
                                href="/logout"
                                method="post"
                                as="button"
                                className="rounded-md p-1.5 text-slate-500 hover:bg-slate-800 hover:text-red-400 transition-colors"
                                title="Deconnexion"
                            >
                                <LogOut className="h-4 w-4" />
                            </Link>
                        </div>
                    )}
                </div>
                {collapsed && (
                    <Link
                        href="/logout"
                        method="post"
                        as="button"
                        className="rounded-md p-1.5 text-slate-500 hover:bg-slate-800 hover:text-red-400 transition-colors"
                        title="Deconnexion"
                    >
                        <LogOut className="h-4 w-4" />
                    </Link>
                )}
            </div>
        </>
    );

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------
    return (
        <div className="min-h-screen bg-gray-50/80">
            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Mobile sidebar */}
            <aside
                className={cn(
                    'fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-slate-900 transition-transform duration-300 ease-in-out lg:hidden',
                    mobileOpen ? 'translate-x-0' : '-translate-x-full',
                )}
            >
                <button
                    onClick={() => setMobileOpen(false)}
                    className="absolute top-4 right-4 rounded-md p-1 text-slate-500 hover:text-slate-300"
                >
                    <X className="h-5 w-5" />
                </button>
                {sidebarContent}
            </aside>

            {/* Desktop sidebar */}
            <aside
                className={cn(
                    'fixed inset-y-0 left-0 z-30 hidden flex-col bg-slate-900 transition-all duration-300 ease-in-out lg:flex',
                    sidebarWidth,
                )}
            >
                {sidebarContent}
            </aside>

            {/* Main area */}
            <div className={cn('transition-all duration-300 ease-in-out', mainPadding)}>
                {/* Top header bar */}
                <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm px-4 lg:px-8">
                    {/* Mobile hamburger */}
                    <button
                        type="button"
                        className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors lg:hidden"
                        onClick={() => setMobileOpen(true)}
                    >
                        <PanelLeft className="h-5 w-5" />
                    </button>

                    {/* Header / breadcrumb */}
                    {header && <div className="flex-1 min-w-0">{header}</div>}
                    {!header && <div className="flex-1" />}

                    {/* Right side actions */}
                    <div className="flex items-center gap-2">
                        {/* Notification bell */}
                        <div ref={notifRef} className="relative">
                            <button
                                type="button"
                                onClick={toggleNotifications}
                                className="relative rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                            >
                                <Bell className="h-5 w-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            {notifOpen && (
                                <div className="absolute right-0 top-full mt-2 w-96 rounded-xl border border-gray-200 bg-white shadow-xl z-50 overflow-hidden">
                                    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                                        <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                                        {unreadCount > 0 && (
                                            <button
                                                type="button"
                                                onClick={markAllAsRead}
                                                className="text-xs font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
                                            >
                                                Tout marquer comme lu
                                            </button>
                                        )}
                                    </div>
                                    <div className="max-h-[400px] overflow-y-auto">
                                        {notifLoading ? (
                                            <div className="flex items-center justify-center py-8">
                                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-indigo-500" />
                                            </div>
                                        ) : notifications.length > 0 ? (
                                            <div className="divide-y divide-gray-50">
                                                {notifications.slice(0, 10).map((notif) => (
                                                    <button
                                                        key={notif.id}
                                                        type="button"
                                                        onClick={() => { if (!notif.read_at) markAsRead(notif.id); }}
                                                        className={cn(
                                                            'flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors',
                                                            !notif.read_at && 'bg-indigo-50/40',
                                                        )}
                                                    >
                                                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100">
                                                            <Bell className="h-4 w-4 text-indigo-600" />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-sm font-medium text-gray-900 truncate">{notif.title}</p>
                                                                {!notif.read_at && (
                                                                    <span className="h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{notif.message}</p>
                                                            <p className="text-xs text-gray-400 mt-1">{formatTimeAgo(notif.created_at)}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                                <Bell className="h-8 w-8 text-gray-300 mb-2" />
                                                <p className="text-sm text-gray-500">Aucune notification</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="border-t border-gray-100 px-4 py-2">
                                        <button
                                            type="button"
                                            onClick={() => setNotifOpen(false)}
                                            className="w-full text-center text-xs font-medium text-indigo-600 hover:text-indigo-500 py-1 transition-colors"
                                        >
                                            Voir toutes les notifications
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* User avatar dropdown (simple link for now) */}
                        <Link
                            href="/admin/settings"
                            className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-gray-100 transition-colors"
                        >
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
                                <span className="text-xs font-semibold">{userInitials}</span>
                            </div>
                            <span className="hidden text-sm font-medium text-gray-700 md:block">{auth.user?.name}</span>
                        </Link>
                    </div>
                </header>

                {/* Page content */}
                <main className="p-4 lg:p-8">{children}</main>
            </div>

            {/* Flash toasts */}
            <FlashToasts flash={flash} />
        </div>
    );
}
