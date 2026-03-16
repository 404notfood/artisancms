import { Head, Link, usePage } from '@inertiajs/react';
import type { MenuData, MenuItemData } from '@/types/cms';
import type { ReactNode } from 'react';

interface FrontLayoutProps {
    children: ReactNode;
    menus: Record<string, MenuData>;
    theme: {
        customizations: Record<string, string | boolean>;
        layouts: Array<{ slug: string; name: string }>;
    };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getMenuItemUrl(item: MenuItemData): string {
    if (item.url) return item.url;
    if (item.type === 'page') return `/${item.label.toLowerCase()}`;
    return '#';
}

function c(customizations: Record<string, string | boolean>, key: string, fallback = ''): string {
    const val = customizations[key];
    if (val === undefined || val === null || val === '') return fallback;
    return String(val);
}

function b(customizations: Record<string, string | boolean>, key: string, fallback = false): boolean {
    const val = customizations[key];
    if (val === undefined || val === null) return fallback;
    return Boolean(val);
}

/** Extract Google Fonts to load from customizations. */
function getGoogleFontsUrl(customizations: Record<string, string | boolean>): string | null {
    const heading = c(customizations, 'fonts.heading', 'Inter');
    const body = c(customizations, 'fonts.body', 'Inter');
    const families = new Set<string>();

    for (const font of [heading, body]) {
        if (font && !['Georgia', 'system-ui'].includes(font)) {
            families.add(font.replace(/ /g, '+'));
        }
    }

    if (families.size === 0) return null;
    const params = Array.from(families).map((f) => `family=${f}:wght@300;400;500;600;700;800`).join('&');
    return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}

// ─── Section CSS prefix map (mirrors PHP ThemeManager) ──────────────────────

const SECTION_PREFIXES: Record<string, string> = {
    colors: '--color-',
    fonts: '--font-',
    layout: '--',
    header: '--header-',
    footer: '--footer-',
    ecommerce: '--ecommerce-',
    global_styles: '--global-',
};

const NON_CSS_TYPES = new Set(['boolean', 'image', 'text']);

const SEMANTIC_MAPPINGS: Record<string, Record<string, string>> = {
    shadow_intensity: {
        none: 'none',
        light: '0 1px 3px 0 rgb(0 0 0 / 0.05)',
        medium: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        strong: '0 10px 15px -3px rgb(0 0 0 / 0.15)',
    },
    button_style: {
        square: '0',
        rounded: '0.375rem',
        pill: '9999px',
    },
};

function buildCssVariables(customizations: Record<string, string | boolean>): Record<string, string> {
    const vars: Record<string, string> = {};

    for (const [dotKey, value] of Object.entries(customizations)) {
        if (value === '' || value === null || value === undefined) continue;
        if (typeof value === 'boolean') continue;

        const dotIdx = dotKey.indexOf('.');
        if (dotIdx === -1) continue;

        const section = dotKey.substring(0, dotIdx);
        const key = dotKey.substring(dotIdx + 1);
        const prefix = SECTION_PREFIXES[section];
        if (!prefix) continue;

        // Skip non-CSS types heuristically (URLs, long text)
        if (String(value).startsWith('/') || String(value).startsWith('http')) continue;
        if (String(value).includes('{year}') || String(value).includes('{site_name}')) continue;

        let cssValue = String(value);

        // Apply semantic mappings
        if (SEMANTIC_MAPPINGS[key]?.[cssValue]) {
            cssValue = SEMANTIC_MAPPINGS[key][cssValue];
        }

        const cssKey = prefix + key.replace(/_/g, '-');
        vars[cssKey] = cssValue;
    }

    return vars;
}

// ─── Nav Item ───────────────────────────────────────────────────────────────

function NavItem({ item, textColor }: { item: MenuItemData; textColor?: string }) {
    const url = getMenuItemUrl(item);
    const isExternal = url.startsWith('http');
    const style = textColor ? { color: textColor } : undefined;

    if (isExternal) {
        return (
            <a
                href={url}
                target={item.target || '_self'}
                style={style}
                className={`text-sm font-medium transition-colors hover:text-[var(--color-primary)] ${item.css_class || ''}`}
            >
                {item.label}
            </a>
        );
    }

    return (
        <Link
            href={url}
            style={style}
            className={`text-sm font-medium transition-colors hover:text-[var(--color-primary)] ${item.css_class || ''}`}
        >
            {item.label}
        </Link>
    );
}

// ─── Header ─────────────────────────────────────────────────────────────────

function Header({ menu, customizations }: { menu?: MenuData; customizations: Record<string, string | boolean> }) {
    const { cms } = usePage().props as { cms?: { name: string; version: string }; [key: string]: unknown };
    const siteName = cms?.name || 'ArtisanCMS';

    const logoUrl = c(customizations, 'header.logo_url');
    const height = c(customizations, 'header.height', '64px');
    const headerStyle = c(customizations, 'header.style', 'solid');
    const sticky = b(customizations, 'header.sticky', true);
    const bgColor = c(customizations, 'header.background_color', '#ffffff');
    const textColor = c(customizations, 'header.text_color', '#1e293b');
    const menuAlignment = c(customizations, 'header.menu_alignment', 'right');
    const ctaText = c(customizations, 'header.cta_text');
    const ctaUrl = c(customizations, 'header.cta_url');
    const ctaStyle = c(customizations, 'header.cta_style', 'primary');

    const alignmentClass = menuAlignment === 'center' ? 'justify-center' : menuAlignment === 'left' ? 'justify-start' : 'justify-end';

    const headerBg = headerStyle === 'transparent'
        ? 'bg-transparent'
        : headerStyle === 'gradient'
            ? ''
            : '';

    const headerClasses = [
        sticky ? 'sticky top-0 z-50' : '',
        'border-b border-gray-100 backdrop-blur-md',
    ].filter(Boolean).join(' ');

    const headerStyleObj: React.CSSProperties = {
        backgroundColor: headerStyle === 'transparent' ? 'transparent' : `${bgColor}cc`,
        height,
    };

    if (headerStyle === 'gradient') {
        headerStyleObj.background = `linear-gradient(135deg, ${bgColor}, color-mix(in srgb, ${bgColor} 80%, black))`;
    }

    const ctaClasses: Record<string, string> = {
        primary: 'bg-[var(--color-primary)] text-white hover:opacity-90',
        secondary: 'bg-[var(--color-secondary)] text-white hover:opacity-90',
        outline: 'border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white',
    };

    return (
        <header className={headerClasses} style={headerStyleObj}>
            <div className="container flex h-full items-center justify-between">
                <Link href="/" className="shrink-0 text-xl font-bold hover:opacity-80" style={{ color: textColor }}>
                    {logoUrl ? (
                        <img src={logoUrl} alt={siteName} className="h-8 w-auto object-contain" />
                    ) : (
                        siteName
                    )}
                </Link>

                <div className={`hidden flex-1 items-center gap-6 px-6 md:flex ${alignmentClass}`}>
                    {menu && menu.items.length > 0 && (
                        <nav className="flex items-center gap-6">
                            {menu.items
                                .filter((item) => !item.parent_id)
                                .sort((a, b) => a.order - b.order)
                                .map((item) => (
                                    <NavItem key={item.id} item={item} textColor={textColor} />
                                ))}
                        </nav>
                    )}
                </div>

                {ctaText && ctaUrl && (
                    <Link
                        href={ctaUrl}
                        className={`hidden shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-all md:inline-flex ${ctaClasses[ctaStyle] || ctaClasses.primary}`}
                    >
                        {ctaText}
                    </Link>
                )}
            </div>
        </header>
    );
}

// ─── Social Icon ────────────────────────────────────────────────────────────

function SocialIcon({ platform, url, color }: { platform: string; url: string; color: string }) {
    if (!url) return null;

    const icons: Record<string, string> = {
        facebook: 'M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z',
        twitter: 'M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z',
        instagram: 'M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zM17.5 6.5h.01M7.5 2h9A5.5 5.5 0 0122 7.5v9a5.5 5.5 0 01-5.5 5.5h-9A5.5 5.5 0 012 16.5v-9A5.5 5.5 0 017.5 2z',
        linkedin: 'M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2zM4 2a2 2 0 110 4 2 2 0 010-4z',
        youtube: 'M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.43zM9.75 15.02V8.48l5.75 3.27-5.75 3.27z',
    };

    const d = icons[platform];
    if (!d) return null;

    return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="transition-opacity hover:opacity-70" style={{ color }}>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d={d} />
            </svg>
        </a>
    );
}

// ─── Footer ─────────────────────────────────────────────────────────────────

function Footer({ menu, customizations }: { menu?: MenuData; customizations: Record<string, string | boolean> }) {
    const { cms } = usePage().props as { cms?: { name: string }; [key: string]: unknown };
    const siteName = cms?.name || 'ArtisanCMS';
    const year = new Date().getFullYear();

    const bgColor = c(customizations, 'footer.background_color', '#f8fafc');
    const textColor = c(customizations, 'footer.text_color', '#64748b');
    const copyrightText = c(customizations, 'footer.copyright_text', `\u00a9 {year} {site_name}. Tous droits reserves.`)
        .replace('{year}', String(year))
        .replace('{site_name}', siteName);
    const showPoweredBy = b(customizations, 'footer.show_powered_by', true);
    const showSocialLinks = b(customizations, 'footer.show_social_links', false);

    const socialPlatforms = ['facebook', 'twitter', 'instagram', 'linkedin', 'youtube'];

    return (
        <footer className="border-t border-gray-100 py-8" style={{ backgroundColor: bgColor, color: textColor }}>
            <div className="container">
                {menu && menu.items.length > 0 && (
                    <nav className="mb-6 flex flex-wrap justify-center gap-6">
                        {menu.items
                            .filter((item) => !item.parent_id)
                            .sort((a, b) => a.order - b.order)
                            .map((item) => (
                                <NavItem key={item.id} item={item} textColor={textColor} />
                            ))}
                    </nav>
                )}

                {showSocialLinks && (
                    <div className="mb-6 flex justify-center gap-4">
                        {socialPlatforms.map((platform) => {
                            const url = c(customizations, `footer.social_${platform}`);
                            return url ? (
                                <SocialIcon key={platform} platform={platform} url={url} color={textColor} />
                            ) : null;
                        })}
                    </div>
                )}

                <p className="text-center text-sm" style={{ color: textColor }}>
                    {copyrightText}
                </p>

                {showPoweredBy && (
                    <p className="mt-2 text-center text-xs opacity-60">
                        Propulse par ArtisanCMS
                    </p>
                )}
            </div>
        </footer>
    );
}

// ─── Layout ─────────────────────────────────────────────────────────────────

export default function FrontLayout({ children, menus, theme }: FrontLayoutProps) {
    const customizations = (theme.customizations || {}) as Record<string, string | boolean>;
    const cssVariables = buildCssVariables(customizations);
    const googleFontsUrl = getGoogleFontsUrl(customizations);

    return (
        <div className="flex min-h-screen flex-col" style={cssVariables as React.CSSProperties}>
            <Head>
                <link rel="alternate" type="application/rss+xml" title={`${c(customizations, 'general.site_name', 'ArtisanCMS')} - Flux RSS`} href="/feed" />
                {googleFontsUrl && (
                    <>
                        <link rel="preconnect" href="https://fonts.googleapis.com" />
                        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                        <link rel="stylesheet" href={googleFontsUrl} />
                    </>
                )}
            </Head>
            <Header menu={menus.header} customizations={customizations} />
            <div className="flex-1">{children}</div>
            <Footer menu={menus.footer} customizations={customizations} />
        </div>
    );
}
