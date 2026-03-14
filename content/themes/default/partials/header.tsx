import { Link } from '@inertiajs/react';
import type { MenuItemData } from '@/types/cms';

interface HeaderProps {
    menu?: {
        items: MenuItemData[];
    };
    settings: Record<string, unknown>;
    siteName?: string;
}

function getMenuItemUrl(item: MenuItemData): string {
    if (item.url) return item.url;
    if (item.type === 'page') return `/${item.label.toLowerCase()}`;
    return '#';
}

function NavItem({ item }: { item: MenuItemData }) {
    const url = getMenuItemUrl(item);
    const isExternal = url.startsWith('http');

    const className = [
        'text-sm font-medium transition-colors',
        'hover:text-[var(--color-primary)]',
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

export default function Header({ menu, settings, siteName }: HeaderProps) {
    const name = (settings?.site_name as string) || siteName || 'ArtisanCMS';

    return (
        <header className="sticky top-0 z-50 border-b border-gray-100 bg-[var(--color-background)]/80 backdrop-blur-md">
            <div
                className="mx-auto flex h-16 items-center justify-between px-4"
                style={{ maxWidth: 'var(--container-width)' }}
            >
                <Link
                    href="/"
                    className="font-heading text-xl font-bold text-[var(--color-text)] transition-colors hover:text-[var(--color-primary)]"
                >
                    {name}
                </Link>

                {menu && menu.items.length > 0 && (
                    <nav className="hidden items-center gap-6 md:flex">
                        {menu.items
                            .filter((item) => !item.parent_id)
                            .sort((a, b) => a.order - b.order)
                            .map((item) => (
                                <NavItem key={item.id} item={item} />
                            ))}
                    </nav>
                )}
            </div>
        </header>
    );
}
