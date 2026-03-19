import { Link } from '@inertiajs/react';
import type { MenuItemData } from '@/types/cms';
import type { ReactNode } from 'react';

interface SidebarProps {
    menu?: {
        items: MenuItemData[];
    };
    widgets?: ReactNode;
}

function getMenuItemUrl(item: MenuItemData): string {
    if (item.url) return item.url;
    if (item.type === 'page') return `/${item.label.toLowerCase()}`;
    return '#';
}

function SidebarNavItem({ item }: { item: MenuItemData }) {
    const url = getMenuItemUrl(item);
    const isExternal = url.startsWith('http');

    const className = [
        'block py-2 px-3 text-sm transition-colors rounded-[var(--border-radius)]',
        'hover:bg-[var(--color-primary-light,rgba(79,70,229,0.08))] hover:text-[var(--color-primary)]',
        item.css_class || '',
    ]
        .filter(Boolean)
        .join(' ');

    if (isExternal) {
        return (
            <a href={url} target={item.target || '_self'} className={className}>
                {item.label}
            </a>
        );
    }

    return (
        <Link href={url} className={className}>
            {item.label}
        </Link>
    );
}

export default function Sidebar({ menu, widgets }: SidebarProps) {
    return (
        <aside className="w-full lg:w-72 shrink-0">
            {menu && menu.items.length > 0 && (
                <nav className="mb-6 rounded-[var(--border-radius)] border p-4" style={{
                    borderColor: 'var(--color-border, #e2e8f0)',
                    backgroundColor: 'var(--color-surface, #f8fafc)',
                }}>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider" style={{
                        fontFamily: 'var(--font-heading)',
                        color: 'var(--color-text-muted, #64748b)',
                    }}>
                        Navigation
                    </h3>
                    <ul className="space-y-1">
                        {menu.items
                            .filter((item) => !item.parent_id)
                            .sort((a, b) => a.order - b.order)
                            .map((item) => (
                                <li key={item.id}>
                                    <SidebarNavItem item={item} />
                                </li>
                            ))}
                    </ul>
                </nav>
            )}

            {widgets && (
                <div className="space-y-6">
                    {widgets}
                </div>
            )}
        </aside>
    );
}
