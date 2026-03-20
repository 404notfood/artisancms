import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import type { NavItem } from './admin-navigation';

interface Props {
    item: NavItem;
    active: boolean;
    collapsed: boolean;
    badge?: number;
}

export default function SidebarNavItem({ item, active, collapsed, badge }: Props) {
    const Icon = item.icon;
    const hasBadge = badge != null && badge > 0;

    return (
        <Link
            href={item.href}
            className={cn(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                active
                    ? 'bg-[var(--admin-primary,#6366f1)] text-white shadow-md'
                    : 'text-[var(--admin-sidebar-text,#94a3b8)] hover:bg-white/5 hover:text-slate-200',
                collapsed && 'justify-center px-0',
            )}
            style={active ? { boxShadow: `0 4px 12px color-mix(in srgb, var(--admin-primary, #6366f1) 25%, transparent)` } : undefined}
        >
            <span className={cn('relative shrink-0', collapsed && 'transition-transform duration-150 group-hover:scale-110')}>
                <Icon className={cn('h-5 w-5', active ? 'text-white' : 'text-slate-500 group-hover:text-slate-300')} />
                {/* Badge dot in collapsed mode */}
                {collapsed && hasBadge && (
                    <span
                        className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full ring-2 animate-pulse"
                        style={{
                            backgroundColor: 'var(--admin-accent, #818cf8)',
                            ringColor: 'var(--admin-sidebar-bg, #0f172a)',
                        }}
                    />
                )}
            </span>
            {!collapsed && (
                <>
                    <span className="flex-1 truncate">{item.label}</span>
                    {hasBadge && (
                        <span
                            className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                            style={{ backgroundColor: 'var(--admin-accent, #818cf8)' }}
                        >
                            {badge > 99 ? '99+' : badge}
                        </span>
                    )}
                </>
            )}
            {/* Tooltip with arrow in collapsed mode */}
            {collapsed && (
                <span className="pointer-events-none absolute left-full ml-3 flex items-center opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-1 z-50">
                    {/* Arrow */}
                    <span
                        className="h-2 w-2 -mr-1 rotate-45 border-l border-b"
                        style={{
                            backgroundColor: 'var(--admin-sidebar-bg, #0f172a)',
                            borderColor: 'rgba(255,255,255,0.08)',
                        }}
                    />
                    {/* Tooltip body */}
                    <span
                        className="rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-200 shadow-lg whitespace-nowrap border"
                        style={{
                            backgroundColor: 'var(--admin-sidebar-bg, #0f172a)',
                            borderColor: 'rgba(255,255,255,0.08)',
                        }}
                    >
                        {item.label}
                        {hasBadge && (
                            <span
                                className="ml-1.5 inline-flex h-[16px] min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold text-white"
                                style={{ backgroundColor: 'var(--admin-accent, #818cf8)' }}
                            >
                                {badge > 99 ? '99+' : badge}
                            </span>
                        )}
                    </span>
                </span>
            )}
        </Link>
    );
}
