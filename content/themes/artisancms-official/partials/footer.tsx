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

    const className = 'text-sm text-slate-400 transition-colors duration-200 hover:text-white';

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

    const footerSections = [
        {
            title: 'Produit',
            items: menu?.items?.filter(i => ['Fonctionnalites', 'Plugins', 'Templates', 'Tarifs'].includes(i.label)) || [],
        },
        {
            title: 'Documentation',
            items: menu?.items?.filter(i => ['Documentation', 'Getting Started', 'API Reference', 'Guides'].includes(i.label)) || [],
        },
        {
            title: 'Communaute',
            items: menu?.items?.filter(i => ['Blog', 'Changelog', 'GitHub', 'Discord'].includes(i.label)) || [],
        },
        {
            title: 'Legal',
            items: menu?.items?.filter(i => ['Mentions legales', 'Confidentialite'].includes(i.label)) || [],
        },
    ];

    const hasStructuredMenu = footerSections.some(s => s.items.length > 0);

    return (
        <div>
            {hasStructuredMenu ? (
                <div className="grid grid-cols-2 gap-8 md:grid-cols-4 mb-12">
                    {footerSections.map((section) => (
                        <div key={section.title}>
                            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
                                {section.title}
                            </h4>
                            <ul className="space-y-3">
                                {section.items.map((item) => (
                                    <li key={item.id || item.label}>
                                        <NavItem item={item} />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            ) : menu && menu.items.length > 0 ? (
                <nav className="mb-8 flex flex-wrap justify-center gap-6">
                    {menu.items
                        .filter((item) => !item.parent_id)
                        .sort((a, b) => a.order - b.order)
                        .map((item) => (
                            <NavItem key={item.id} item={item} />
                        ))}
                </nav>
            ) : null}

            <div className="border-t border-slate-800 pt-8 flex flex-col items-center gap-4 md:flex-row md:justify-between">
                <div className="text-sm text-slate-500">
                    <p>&copy; {year} {siteName}. Tous droits r&eacute;serv&eacute;s.</p>
                </div>

                <div className="flex items-center gap-4">
                    <a
                        href="https://github.com/artisancms/artisancms"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-500 transition-colors hover:text-white"
                        aria-label="GitHub"
                    >
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                        </svg>
                    </a>
                </div>

                {showPoweredBy && (
                    <p className="text-xs text-slate-600">
                        Propuls&eacute; par{' '}
                        <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent font-medium">
                            ArtisanCMS
                        </span>
                    </p>
                )}
            </div>
        </div>
    );
}
