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
            <Icon className={cn('h-5 w-5 shrink-0', active ? 'text-white' : 'text-slate-500 group-hover:text-slate-300')} />
            {!collapsed && (
                <>
                    <span className="flex-1 truncate">{item.label}</span>
                    {badge != null && badge > 0 && (
                        <span
                            className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                            style={{ backgroundColor: 'var(--admin-accent, #818cf8)' }}
                        >
                            {badge > 99 ? '99+' : badge}
                        </span>
                    )}
                </>
            )}
            {collapsed && (
                <span className="pointer-events-none absolute left-full ml-3 rounded-md bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-200 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 whitespace-nowrap z-50 border border-slate-700">
                    {item.label}
                    {badge != null && badge > 0 && (
                        <span
                            className="ml-1.5 inline-flex h-[16px] min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold text-white"
                            style={{ backgroundColor: 'var(--admin-accent, #818cf8)' }}
                        >
                            {badge > 99 ? '99+' : badge}
                        </span>
                    )}
                </span>
            )}
        </Link>
    );
}
