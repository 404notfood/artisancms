import { Link, usePage, router } from '@inertiajs/react';
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { formatTimeAgo } from '@/lib/format';
import type { SharedProps } from '@/types/cms';
import CommandPalette from '@/Components/admin/command-palette';
import { ErrorBoundary } from '@/Components/error-boundary';
import FlashToasts from '@/Layouts/admin/FlashToasts';
import SidebarNavItem from '@/Layouts/admin/SidebarNavItem';
import { getNavigation, isActive, buildDashboardItem } from '@/Layouts/admin/admin-navigation';
import { getDashboardTheme, buildDashboardCssVars } from '@/Layouts/admin/dashboard-themes';
import {
    Bell, LogOut, ChevronsLeft, ChevronsRight, PanelLeft, User, X, ChevronDown,
} from 'lucide-react';

interface AdminLayoutProps { header?: ReactNode; children: ReactNode }
interface NotificationItem { id: number; type: string; title: string; message: string; read_at: string | null; created_at: string }

const SIDEBAR_KEY = 'artisan_sidebar_collapsed';

function getInitialCollapsed(): boolean {
    if (typeof window === 'undefined') return false;
    try { return localStorage.getItem(SIDEBAR_KEY) === '1'; } catch { return false; }
}

export default function AdminLayout({ header, children }: AdminLayoutProps) {
    const { auth, flash, cms, notifications_count, sidebar_badges } = usePage<SharedProps>().props;
    const currentUrl = usePage().url;

    const enabledPlugins = cms?.enabledPlugins ?? [];
    const adminPrefix = cms?.adminPrefix ?? 'admin';
    const navigation = useMemo(() => getNavigation(enabledPlugins, adminPrefix), [enabledPlugins, adminPrefix]);
    const dashboardItem = useMemo(() => buildDashboardItem(adminPrefix), [adminPrefix]);
    const badges = sidebar_badges ?? {};

    // Dashboard theme
    const dashboardThemeId = cms?.dashboardTheme ?? 'indigo';
    const dashboardTheme = useMemo(() => getDashboardTheme(dashboardThemeId), [dashboardThemeId]);
    const cssVars = useMemo(() => buildDashboardCssVars(dashboardTheme), [dashboardTheme]);

    const [collapsed, setCollapsed] = useState(getInitialCollapsed);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [notifLoading, setNotifLoading] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
        const expanded = new Set<string>();
        for (const group of navigation) {
            for (const item of group.items) {
                if (isActive(item.href, currentUrl, adminPrefix)) expanded.add(group.title);
                item.children?.forEach((c) => { if (isActive(c.href, currentUrl, adminPrefix)) expanded.add(group.title); });
            }
        }
        return expanded;
    });

    const notifRef = useRef<HTMLDivElement>(null);
    const unreadCount = notifications_count ?? 0;

    const toggleGroup = useCallback((t: string) => {
        setExpandedGroups((prev) => { const n = new Set(prev); n.has(t) ? n.delete(t) : n.add(t); return n; });
    }, []);

    useEffect(() => {
        if (!notifOpen) return;
        const h = (e: MouseEvent) => { if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, [notifOpen]);

    const xsrf = useCallback(() => decodeURIComponent(document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? ''), []);
    const jsonHeaders = useCallback(() => ({
        Accept: 'application/json', 'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest', 'X-XSRF-TOKEN': xsrf(),
    }), [xsrf]);

    const toggleNotifications = useCallback(() => {
        setNotifOpen((prev) => {
            if (!prev && notifications.length === 0) {
                setNotifLoading(true);
                fetch(`/${adminPrefix}/notifications`, { headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' }, credentials: 'same-origin' })
                    .then((r) => r.json()).then((d) => setNotifications(d.data ?? []))
                    .catch(() => {}).finally(() => setNotifLoading(false));
            }
            return !prev;
        });
    }, [notifications.length]);

    const markAsRead = useCallback((id: number) => {
        fetch(`/${adminPrefix}/notifications/${id}/read`, { method: 'POST', headers: jsonHeaders(), credentials: 'same-origin' })
            .then(() => { setNotifications((p) => p.map((n) => n.id === id ? { ...n, read_at: new Date().toISOString() } : n)); router.reload({ only: ['notifications_count'] }); });
    }, [jsonHeaders]);

    const markAllAsRead = useCallback(() => {
        fetch(`/${adminPrefix}/notifications/read-all`, { method: 'POST', headers: jsonHeaders(), credentials: 'same-origin' })
            .then(() => { setNotifications((p) => p.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() }))); router.reload({ only: ['notifications_count'] }); });
    }, [jsonHeaders]);

    const toggleCollapsed = useCallback(() => {
        setCollapsed((p) => { const n = !p; try { localStorage.setItem(SIDEBAR_KEY, n ? '1' : '0'); } catch {} return n; });
    }, []);

    useEffect(() => { setMobileOpen(false); }, [currentUrl]);
    useEffect(() => {
        document.body.style.overflow = mobileOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [mobileOpen]);

    const sidebarWidth = collapsed ? 'w-[72px]' : 'w-[260px]';
    const mainPadding = collapsed ? 'lg:pl-[72px]' : 'lg:pl-[260px]';
    const userInitials = auth.user?.name?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() ?? '?';

    const sidebarContent = (
        <>
            {/* Logo */}
            <div className={cn('flex h-16 items-center shrink-0 border-b border-white/10', collapsed ? 'justify-center px-2' : 'gap-3 px-5')}>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg shadow-md" style={{ background: dashboardTheme.colors.logoGradient }}>
                    <span className="text-sm font-bold text-white">A</span>
                </div>
                {!collapsed && <span className="text-base font-semibold text-white tracking-tight truncate">{cms?.name ?? 'ArtisanCMS'}</span>}
            </div>

            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin">
                {/* Dashboard — pinned at top */}
                <div className="mb-2">
                    <SidebarNavItem item={dashboardItem} active={isActive(dashboardItem.href, currentUrl)} collapsed={collapsed} />
                </div>
                {!collapsed && <div className="mx-3 h-px bg-white/[0.06] mb-2" />}
                {collapsed && <div className="mx-auto h-px w-4 rounded-full bg-white/[0.08] mb-2" />}

                {/* Navigation groups */}
                {navigation.map((group, idx) => {
                    const isExpanded = expandedGroups.has(group.title);
                    const hasActive = group.items.some((i) => isActive(i.href, currentUrl) || i.children?.some((c) => isActive(c.href, currentUrl, adminPrefix)));
                    if (collapsed) return (
                        <div key={group.title}>
                            {idx > 0 && <div className="my-1.5 mx-auto h-px w-4 rounded-full bg-white/[0.08]" />}
                            <div className="space-y-0.5">
                                {group.items.map((item) => <SidebarNavItem key={item.href} item={item} active={isActive(item.href, currentUrl, adminPrefix)} collapsed badge={item.badgeKey ? badges[item.badgeKey] : undefined} />)}
                            </div>
                        </div>
                    );
                    return (
                        <div key={group.title}>
                            <button type="button" onClick={() => toggleGroup(group.title)} className={cn('flex w-full items-center justify-between rounded-lg px-3 py-2 text-[11px] font-semibold uppercase tracking-wider transition-colors', hasActive ? 'text-slate-300' : 'text-slate-500 hover:text-slate-400')}>
                                <span>{group.title}</span>
                                <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 transition-transform duration-200', isExpanded && 'rotate-180')} />
                            </button>
                            {isExpanded && (
                                <div className="mt-0.5 space-y-0.5">
                                    {group.items.map((item) => <SidebarNavItem key={item.href} item={item} active={isActive(item.href, currentUrl, adminPrefix)} collapsed={false} badge={item.badgeKey ? badges[item.badgeKey] : undefined} />)}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>

            {/* Collapse button */}
            <div className="hidden lg:block border-t border-white/10">
                <button
                    onClick={toggleCollapsed}
                    className={cn(
                        'flex w-full items-center justify-center py-3 transition-colors',
                        collapsed ? 'px-0' : 'gap-2 px-4',
                    )}
                    title={collapsed ? 'Agrandir le menu' : 'Reduire le menu'}
                >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-slate-500 hover:bg-white/10 hover:text-slate-300 transition-colors">
                        {collapsed ? <ChevronsRight className="h-3.5 w-3.5" /> : <ChevronsLeft className="h-3.5 w-3.5" />}
                    </span>
                    {!collapsed && <span className="text-xs font-medium text-slate-500">Reduire</span>}
                </button>
            </div>

            {/* User zone */}
            <div className={cn('border-t border-white/10 p-3', collapsed && 'flex flex-col items-center gap-2 py-3')}>
                <div className={cn('flex items-center', collapsed ? 'flex-col gap-2' : 'gap-3')}>
                    {collapsed ? (
                        /* Collapsed: avatar with tooltip */
                        <Link href={`/${adminPrefix}/account`} className="group relative">
                            {auth.user?.avatar_url ? (
                                <img src={auth.user.avatar_url} alt={auth.user.name} className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-white/20 transition-transform group-hover:scale-105" />
                            ) : (
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-2 ring-white/20 transition-transform group-hover:scale-105" style={{ backgroundColor: 'var(--admin-primary, #6366f1)' }}>
                                    <span className="text-xs font-semibold text-white">{userInitials}</span>
                                </div>
                            )}
                            {/* Tooltip */}
                            <span className="pointer-events-none absolute left-full ml-3 flex items-center opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-1 z-50">
                                <span className="h-2 w-2 -mr-1 rotate-45 border-l border-b" style={{ backgroundColor: 'var(--admin-sidebar-bg, #0f172a)', borderColor: 'rgba(255,255,255,0.08)' }} />
                                <span className="rounded-md px-2.5 py-1.5 text-xs text-slate-200 shadow-lg whitespace-nowrap border" style={{ backgroundColor: 'var(--admin-sidebar-bg, #0f172a)', borderColor: 'rgba(255,255,255,0.08)' }}>
                                    <span className="font-medium">{auth.user?.name}</span>
                                    <span className="block text-slate-500 text-[10px]">{auth.user?.email}</span>
                                </span>
                            </span>
                        </Link>
                    ) : (
                        /* Expanded: full user info */
                        <>
                            {auth.user?.avatar_url ? (
                                <img src={auth.user.avatar_url} alt={auth.user.name} className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-white/20" />
                            ) : (
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-2 ring-white/20" style={{ backgroundColor: 'var(--admin-primary, #6366f1)' }}>
                                    <span className="text-xs font-semibold text-white">{userInitials}</span>
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="truncate text-sm font-medium text-slate-200">{auth.user?.name}</p>
                                <p className="truncate text-xs text-slate-500">{auth.user?.email}</p>
                            </div>
                            <div className="flex items-center gap-1">
                                <Link href={`/${adminPrefix}/account`} className="rounded-md p-1.5 text-slate-500 hover:bg-white/5 hover:text-slate-300 transition-colors" title="Mon compte"><User className="h-4 w-4" /></Link>
                                <Link href="/logout" method="post" as="button" className="rounded-md p-1.5 text-slate-500 hover:bg-white/5 hover:text-red-400 transition-colors" title="Deconnexion"><LogOut className="h-4 w-4" /></Link>
                            </div>
                        </>
                    )}
                </div>
                {collapsed && <Link href="/logout" method="post" as="button" className="rounded-md p-1.5 text-slate-500 hover:bg-white/5 hover:text-red-400 transition-colors" title="Deconnexion"><LogOut className="h-4 w-4" /></Link>}
            </div>
        </>
    );

    return (
        <div className="min-h-screen bg-gray-50/80" style={cssVars as React.CSSProperties}>
            {mobileOpen && <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />}
            <aside className={cn('fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col transition-transform duration-300 ease-in-out lg:hidden', mobileOpen ? 'translate-x-0' : '-translate-x-full')} style={{ backgroundColor: 'var(--admin-sidebar-bg, #0f172a)' }}>
                <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 rounded-md p-1 text-slate-500 hover:text-slate-300"><X className="h-5 w-5" /></button>
                {sidebarContent}
            </aside>
            <aside className={cn('fixed inset-y-0 left-0 z-30 hidden flex-col transition-all duration-300 ease-in-out lg:flex', sidebarWidth)} style={{ backgroundColor: 'var(--admin-sidebar-bg, #0f172a)' }}>
                {sidebarContent}
            </aside>
            <div className={cn('transition-all duration-300 ease-in-out', mainPadding)}>
                <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm px-4 lg:px-8">
                    <button type="button" className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors lg:hidden" onClick={() => setMobileOpen(true)}><PanelLeft className="h-5 w-5" /></button>
                    {header ? <div className="flex-1 min-w-0">{header}</div> : <div className="flex-1" />}
                    <div className="flex items-center gap-2">
                        <div ref={notifRef} className="relative">
                            <button type="button" onClick={toggleNotifications} className="relative rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                                <Bell className="h-5 w-5" />
                                {unreadCount > 0 && <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white ring-2 ring-white" style={{ backgroundColor: 'var(--admin-primary, #6366f1)' }}>{unreadCount > 99 ? '99+' : unreadCount}</span>}
                            </button>
                            {notifOpen && (
                                <div className="absolute right-0 top-full mt-2 w-96 rounded-xl border border-gray-200 bg-white shadow-xl z-50 overflow-hidden">
                                    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                                        <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                                        {unreadCount > 0 && <button type="button" onClick={markAllAsRead} className="text-xs font-medium transition-colors" style={{ color: 'var(--admin-primary, #6366f1)' }}>Tout marquer comme lu</button>}
                                    </div>
                                    <div className="max-h-[400px] overflow-y-auto">
                                        {notifLoading ? <div className="flex items-center justify-center py-8"><div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200" style={{ borderTopColor: 'var(--admin-primary, #6366f1)' }} /></div>
                                        : notifications.length > 0 ? (
                                            <div className="divide-y divide-gray-50">
                                                {notifications.slice(0, 10).map((n) => (
                                                    <button key={n.id} type="button" onClick={() => { if (!n.read_at) markAsRead(n.id); }} className={cn('flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors', !n.read_at && 'bg-blue-50/40')}>
                                                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: 'color-mix(in srgb, var(--admin-primary, #6366f1) 15%, transparent)' }}><Bell className="h-4 w-4" style={{ color: 'var(--admin-primary, #6366f1)' }} /></div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-sm font-medium text-gray-900 truncate">{n.title}</p>
                                                                {!n.read_at && <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: 'var(--admin-primary, #6366f1)' }} />}
                                                            </div>
                                                            <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{n.message}</p>
                                                            <p className="text-xs text-gray-400 mt-1">{formatTimeAgo(n.created_at)}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        ) : <div className="flex flex-col items-center justify-center py-8 text-center"><Bell className="h-8 w-8 text-gray-300 mb-2" /><p className="text-sm text-gray-500">Aucune notification</p></div>}
                                    </div>
                                    <div className="border-t border-gray-100 px-4 py-2">
                                        <button type="button" onClick={() => setNotifOpen(false)} className="w-full text-center text-xs font-medium py-1 transition-colors" style={{ color: 'var(--admin-primary, #6366f1)' }}>Voir toutes les notifications</button>
                                    </div>
                                </div>
                            )}
                        </div>
                        <Link href={`/${adminPrefix}/account`} className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-gray-100 transition-colors">
                            {auth.user?.avatar_url ? <img src={auth.user.avatar_url} alt={auth.user.name} className="h-8 w-8 rounded-full object-cover" /> : (
                                <div className="flex h-8 w-8 items-center justify-center rounded-full text-white" style={{ backgroundColor: 'var(--admin-primary, #6366f1)' }}><span className="text-xs font-semibold">{userInitials}</span></div>
                            )}
                            <span className="hidden text-sm font-medium text-gray-700 md:block">{auth.user?.name}</span>
                        </Link>
                    </div>
                </header>
                <main className="p-4 lg:p-8"><ErrorBoundary>{children}</ErrorBoundary></main>
            </div>
            <FlashToasts flash={flash} />
            <CommandPalette />
        </div>
    );
}
