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
        'hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)]',
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
                <nav className="mb-6 rounded-[var(--border-radius)] border border-gray-200 bg-[var(--color-background)] p-4">
                    <h3 className="font-heading mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--color-secondary)]">
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
