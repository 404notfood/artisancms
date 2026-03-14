import { Link } from '@inertiajs/react';
import type { MenuItemData } from '@/types/cms';

interface FooterProps {
    menu?: {
        items: MenuItemData[];
    };
    settings: Record<string, unknown>;
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
        'text-sm transition-colors',
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

export default function Footer({ menu, settings }: FooterProps) {
    const year = new Date().getFullYear();
    const siteName = (settings?.site_name as string) || 'ArtisanCMS';
    const showPoweredBy = settings?.show_powered_by !== false;

    return (
        <footer className="border-t border-gray-200 bg-[var(--color-background)] py-10">
            <div
                className="mx-auto px-4"
                style={{ maxWidth: 'var(--container-width)' }}
            >
                {menu && menu.items.length > 0 && (
                    <nav className="mb-8 flex flex-wrap justify-center gap-6">
                        {menu.items
                            .filter((item) => !item.parent_id)
                            .sort((a, b) => a.order - b.order)
                            .map((item) => (
                                <NavItem key={item.id} item={item} />
                            ))}
                    </nav>
                )}

                <div className="text-center text-sm text-[var(--color-secondary)]">
                    <p>&copy; {year} {siteName}. Tous droits r&eacute;serv&eacute;s.</p>
                    {showPoweredBy && (
                        <p className="mt-2 text-xs opacity-60">
                            Propuls&eacute; par ArtisanCMS
                        </p>
                    )}
                </div>
            </div>
        </footer>
    );
}
