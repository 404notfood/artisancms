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
        'text-sm font-medium transition-colors duration-200',
        'text-slate-300 hover:text-white',
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
        <div className="flex items-center justify-between">
            <Link
                href="/"
                className="flex items-center gap-3 text-xl font-bold transition-colors hover:opacity-80"
                style={{
                    fontFamily: 'var(--font-heading)',
                    color: '#ffffff',
                }}
            >
                <span className="artisancms-logo-text bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                    {name}
                </span>
            </Link>

            <div className="hidden items-center gap-8 md:flex">
                {menu && menu.items.length > 0 && (
                    <nav className="flex items-center gap-6">
                        {menu.items
                            .filter((item) => !item.parent_id)
                            .sort((a, b) => a.order - b.order)
                            .map((item) => (
                                <NavItem key={item.id} item={item} />
                            ))}
                    </nav>
                )}

                <a
                    href="https://github.com/artisancms/artisancms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 transition-all duration-200 hover:border-slate-400 hover:text-white"
                >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                    Star on GitHub
                </a>
            </div>
        </div>
    );
}
