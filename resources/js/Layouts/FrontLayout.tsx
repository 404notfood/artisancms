import { Head, Link, usePage } from '@inertiajs/react';
import type { MenuData, MenuItemData } from '@/types/cms';
import type { ReactNode } from 'react';

interface FrontLayoutProps {
    children: ReactNode;
    menus: Record<string, MenuData>;
    theme: {
        customizations: Record<string, string>;
        layouts: Array<{ slug: string; name: string }>;
    };
}

function getMenuItemUrl(item: MenuItemData): string {
    if (item.url) return item.url;
    if (item.type === 'page') return `/${item.label.toLowerCase()}`;
    return '#';
}

function NavItem({ item }: { item: MenuItemData }) {
    const url = getMenuItemUrl(item);
    const isExternal = url.startsWith('http');

    if (isExternal) {
        return (
            <a
                href={url}
                target={item.target || '_self'}
                className={`text-sm font-medium transition-colors hover:text-[var(--color-primary)] ${item.css_class || ''}`}
            >
                {item.label}
            </a>
        );
    }

    return (
        <Link
            href={url}
            className={`text-sm font-medium transition-colors hover:text-[var(--color-primary)] ${item.css_class || ''}`}
        >
            {item.label}
        </Link>
    );
}

function Header({ menu }: { menu?: MenuData }) {
    const { cms } = usePage().props as { cms?: { name: string; version: string }; [key: string]: unknown };
    const siteName = cms?.name || 'ArtisanCMS';

    return (
        <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
            <div className="container flex h-16 items-center justify-between">
                <Link href="/" className="text-xl font-bold text-[var(--color-text)] hover:text-[var(--color-primary)]">
                    {siteName}
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

function Footer({ menu }: { menu?: MenuData }) {
    const year = new Date().getFullYear();

    return (
        <footer className="border-t border-gray-100 bg-gray-50 py-8">
            <div className="container">
                {menu && menu.items.length > 0 && (
                    <nav className="mb-6 flex flex-wrap justify-center gap-6">
                        {menu.items
                            .filter((item) => !item.parent_id)
                            .sort((a, b) => a.order - b.order)
                            .map((item) => (
                                <NavItem key={item.id} item={item} />
                            ))}
                    </nav>
                )}
                <p className="text-center text-sm text-gray-500">
                    &copy; {year} Tous droits r&eacute;serv&eacute;s.
                </p>
            </div>
        </footer>
    );
}

export default function FrontLayout({ children, menus, theme }: FrontLayoutProps) {
    const customizations = theme.customizations || {};

    const cssVariables: Record<string, string> = {};
    for (const [key, value] of Object.entries(customizations)) {
        if (key.startsWith('colors.')) {
            cssVariables[`--color-${key.replace('colors.', '')}`] = value;
        } else if (key.startsWith('fonts.')) {
            const fontKey = key.replace('fonts.', '');
            cssVariables[`--font-${fontKey}`] = `'${value}', sans-serif`;
        } else if (key === 'layout.container_width') {
            cssVariables['--container-width'] = value;
        } else if (key === 'layout.border_radius') {
            cssVariables['--border-radius'] = value;
        }
    }

    return (
        <div className="flex min-h-screen flex-col" style={cssVariables as React.CSSProperties}>
            <Head>
                <link rel="alternate" type="application/rss+xml" title={`${customizations['general.site_name'] || 'ArtisanCMS'} - Flux RSS`} href="/feed" />
            </Head>
            <Header menu={menus.header} />
            <div className="flex-1">{children}</div>
            <Footer menu={menus.footer} />
        </div>
    );
}
