import { Head, Link, usePage } from '@inertiajs/react';
import type { MenuData, MenuItemData } from '@/types/cms';
import { useMemo, useRef, useState, type ReactNode } from 'react';
import { AnnouncementBar } from '@/Components/front/announcement-bar';
import { AnimationConfigContext, type AnimationConfigMap } from '@/Components/front/block-renderer';

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

/** Detect if a hex color is dark (lightness < 40%). */
function isHexDark(hex: string): boolean {
    const clean = hex.replace('#', '');
    if (clean.length < 6) return false;
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    // Perceived luminance
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return lum < 0.4;
}

function buildCssVariables(customizations: Record<string, string | boolean>): Record<string, string> {
    const vars: Record<string, string> = {};

    for (const [dotKey, value] of Object.entries(customizations)) {
        if (value === '' || value === null || value === undefined) continue;
        if (typeof value === 'boolean') continue;

        const dotIdx = dotKey.indexOf('.');
        if (dotIdx === -1) continue;

        const section = dotKey.substring(0, dotIdx);
        const key = dotKey.substring(dotIdx + 1);

        if (section === 'animations' || section === 'typography') continue;

        const prefix = SECTION_PREFIXES[section];
        if (!prefix) continue;

        if (String(value).startsWith('/') || String(value).startsWith('http')) continue;
        if (String(value).includes('{year}') || String(value).includes('{site_name}')) continue;

        let cssValue = String(value);
        if (SEMANTIC_MAPPINGS[key]?.[cssValue]) {
            cssValue = SEMANTIC_MAPPINGS[key][cssValue];
        }

        const cssKey = prefix + key.replace(/_/g, '-');
        vars[cssKey] = cssValue;
    }

    // ── Derive semantic variables for block renderers ──────────────────────
    const bg = String(customizations['colors.background'] || '#ffffff');
    const isDark = isHexDark(bg);

    // --color-surface: subtle card background
    if (!vars['--color-surface']) {
        vars['--color-surface'] = isDark
            ? 'rgba(255,255,255,0.04)'
            : 'rgba(0,0,0,0.025)';
    }

    // --color-border: subtle divider / card border
    if (!vars['--color-border']) {
        vars['--color-border'] = isDark
            ? 'rgba(255,255,255,0.08)'
            : 'rgba(0,0,0,0.07)';
    }

    // --color-hero-text: text on hero (always high contrast)
    if (!vars['--color-hero-text']) {
        vars['--color-hero-text'] = isDark ? '#ffffff' : '#ffffff';
    }

    // --border-radius: alias for layout.border_radius
    if (vars['--border-radius'] === undefined) {
        const br = String(customizations['layout.border_radius'] || '0.5rem');
        const BUTTON_RADIUS_MAP: Record<string, string> = {
            square: '0',
            rounded: '0.375rem',
            pill: '9999px',
        };
        vars['--border-radius'] = BUTTON_RADIUS_MAP[br] ?? br;
    }

    return vars;
}

// ─── Menu tree builder ──────────────────────────────────────────────────────

type MenuItemWithChildren = MenuItemData & { children: MenuItemData[] };

function buildMenuTree(items: MenuItemData[]): MenuItemWithChildren[] {
    const roots = items.filter((i) => !i.parent_id).sort((a, b) => a.order - b.order);
    return roots.map((root) => ({
        ...root,
        children: items.filter((i) => i.parent_id === root.id).sort((a, b) => a.order - b.order),
    }));
}

// ─── Nav Item ───────────────────────────────────────────────────────────────

function NavItem({ item, style: styleVariant, textColor, accentColor }: {
    item: MenuItemData;
    style?: string;
    textColor?: string;
    accentColor?: string;
}) {
    const url = getMenuItemUrl(item);
    const isExternal = url.startsWith('http');

    const baseStyle = textColor ? { color: textColor } : undefined;

    // Different hover effects per style
    const className = styleVariant === 'luxury'
        ? `text-sm tracking-widest uppercase font-light transition-colors hover:text-[var(--color-primary)] ${item.css_class || ''}`
        : styleVariant === 'dark'
            ? `text-sm font-medium transition-all hover:text-[var(--color-primary)] hover:drop-shadow-[0_0_8px_var(--color-primary)] ${item.css_class || ''}`
            : `text-sm font-medium transition-colors hover:text-[var(--color-primary)] ${item.css_class || ''}`;

    const props = {
        style: baseStyle,
        className,
        ...(isExternal ? { target: item.target || '_self' } : {}),
    };

    return isExternal
        ? <a href={url} {...props}>
            {item.label}
            {item.badge_text && (
                <span className="ml-1.5 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                    style={{ backgroundColor: item.badge_color || accentColor || '#6366f1', color: '#fff' }}>
                    {item.badge_text}
                </span>
            )}
          </a>
        : <Link href={url} {...props}>
            {item.label}
            {item.badge_text && (
                <span className="ml-1.5 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                    style={{ backgroundColor: item.badge_color || accentColor || '#6366f1', color: '#fff' }}>
                    {item.badge_text}
                </span>
            )}
          </Link>;
}

// ─── Nav Item with Dropdown (desktop hover, mobile accordion) ───────────────

function NavItemWithDropdown({ item, children, style: styleVariant, textColor, accentColor, bgColor, isDark }: {
    item: MenuItemData;
    children: MenuItemData[];
    style?: string;
    textColor?: string;
    accentColor?: string;
    bgColor?: string;
    isDark?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

    const onMouseEnter = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setOpen(true);
    };
    const onMouseLeave = () => {
        timeoutRef.current = setTimeout(() => setOpen(false), 150);
    };

    const dropdownBg = isDark ? '#1e1e2e' : '#ffffff';
    const dropdownBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)';
    const hoverBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)';

    const navClassName = styleVariant === 'luxury'
        ? `text-sm tracking-widest uppercase font-light transition-colors hover:text-[var(--color-primary)] ${item.css_class || ''}`
        : styleVariant === 'dark'
            ? `text-sm font-medium transition-all hover:text-[var(--color-primary)] hover:drop-shadow-[0_0_8px_var(--color-primary)] ${item.css_class || ''}`
            : `text-sm font-medium transition-colors hover:text-[var(--color-primary)] ${item.css_class || ''}`;

    return (
        <div className="relative" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
            <button
                type="button"
                className={`${navClassName} inline-flex items-center gap-1`}
                style={{ color: textColor }}
            >
                {item.label}
                {item.badge_text && (
                    <span className="ml-1 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                        style={{ backgroundColor: item.badge_color || accentColor || '#6366f1', color: '#fff' }}>
                        {item.badge_text}
                    </span>
                )}
                <svg
                    className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
            </button>

            {open && (
                <div
                    className="absolute top-full left-0 mt-1 min-w-48 rounded-lg py-1 shadow-xl z-50"
                    style={{
                        backgroundColor: dropdownBg,
                        border: `1px solid ${dropdownBorder}`,
                    }}
                >
                    {children.map((child) => {
                        const childUrl = getMenuItemUrl(child);
                        const isExternal = childUrl.startsWith('http');
                        const LinkComponent = isExternal ? 'a' : Link;
                        const linkProps = isExternal
                            ? { href: childUrl, target: child.target || '_self' }
                            : { href: childUrl };

                        return (
                            <LinkComponent
                                key={child.id}
                                {...linkProps as any}
                                className="block px-4 py-2 text-sm transition-colors"
                                style={{ color: textColor }}
                                onMouseEnter={(e: React.MouseEvent<HTMLElement>) => {
                                    (e.currentTarget as HTMLElement).style.backgroundColor = hoverBg;
                                }}
                                onMouseLeave={(e: React.MouseEvent<HTMLElement>) => {
                                    (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                                }}
                            >
                                {child.label}
                                {child.badge_text && (
                                    <span className="ml-1.5 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                                        style={{ backgroundColor: child.badge_color || accentColor || '#6366f1', color: '#fff' }}>
                                        {child.badge_text}
                                    </span>
                                )}
                            </LinkComponent>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ─── Header ─────────────────────────────────────────────────────────────────

function Header({ menu, customizations, brandingLogo }: {
    menu?: MenuData;
    customizations: Record<string, string | boolean>;
    brandingLogo?: string;
}) {
    const { cms } = usePage().props as { cms?: { name: string; version: string }; [key: string]: unknown };
    const siteName = cms?.name || 'ArtisanCMS';
    const [mobileOpen, setMobileOpen] = useState(false);

    const logoUrl = c(customizations, 'header.logo_url') || brandingLogo || '';
    const height = c(customizations, 'header.height', '64px');
    const headerStyle = c(customizations, 'header.style', 'solid');
    const sticky = b(customizations, 'header.sticky', true);
    const bgColor = c(customizations, 'header.background_color', '#ffffff');
    const textColor = c(customizations, 'header.text_color', '#1e293b');
    const borderBottomColor = c(customizations, 'header.border_bottom_color', '');
    const hasBorderBottom = b(customizations, 'header.border_bottom', true);
    const accentLine = b(customizations, 'header.accent_line', false);
    const menuAlignment = c(customizations, 'header.menu_alignment', 'right');
    const ctaText = c(customizations, 'header.cta_text');
    const ctaUrl = c(customizations, 'header.cta_url');
    const ctaStyle = c(customizations, 'header.cta_style', 'primary');
    const primaryColor = c(customizations, 'colors.primary', '#6366f1');
    const borderRadius = c(customizations, 'layout.border_radius', '0.375rem');

    // Detect theme personality from colors/style
    const isDark = isHexDark(bgColor);
    const isLuxury = borderRadius === '0' || borderRadius === '0.125rem' || borderRadius === '0.25rem';

    const navStyle = isDark ? 'dark' : isLuxury ? 'luxury' : 'default';

    const alignmentClass = menuAlignment === 'center'
        ? 'justify-center'
        : menuAlignment === 'left'
            ? 'justify-start'
            : 'justify-end';

    // Header background per style
    let headerBg = '';
    let headerBorder = '';

    if (headerStyle === 'transparent') {
        headerBg = 'bg-transparent';
    } else if (headerStyle === 'blur') {
        headerBg = 'backdrop-blur-md';
    }

    if (hasBorderBottom !== false && !isDark) {
        headerBorder = borderBottomColor
            ? `1px solid ${borderBottomColor}`
            : '1px solid rgba(0,0,0,0.06)';
    } else if (isDark) {
        headerBorder = borderBottomColor
            ? `1px solid ${borderBottomColor}`
            : '1px solid rgba(255,255,255,0.06)';
    }

    const headerClasses = [
        sticky ? 'sticky top-0 z-50' : '',
        headerBg,
        'transition-all duration-200',
    ].filter(Boolean).join(' ');

    const headerStyleObj: React.CSSProperties = {
        backgroundColor: headerStyle === 'transparent' ? 'transparent' : bgColor,
        height,
        borderBottom: headerBorder || undefined,
    };

    if (headerStyle === 'blur') {
        headerStyleObj.backgroundColor = bgColor + 'e0';
    }

    // CTA button style
    const ctaBtnStyle: React.CSSProperties = {
        backgroundColor: ctaStyle === 'primary' ? primaryColor : 'transparent',
        color: ctaStyle === 'primary' ? '#fff' : primaryColor,
        border: ctaStyle === 'outline' ? `1px solid ${primaryColor}` : 'none',
        borderRadius,
        padding: isLuxury ? '0.5rem 1.75rem' : '0.5rem 1.25rem',
        fontSize: isLuxury ? '0.75rem' : '0.875rem',
        letterSpacing: isLuxury ? '0.1em' : '0',
        textTransform: isLuxury ? 'uppercase' as const : 'none' as const,
        fontWeight: isDark ? 600 : isLuxury ? 400 : 500,
    };

    if (isDark && ctaStyle === 'primary') {
        // Glow effect for dark themes
        ctaBtnStyle.boxShadow = `0 0 20px ${primaryColor}40`;
    }

    const menuTree = buildMenuTree(menu?.items ?? []);
    const [mobileExpanded, setMobileExpanded] = useState<Set<number>>(new Set());

    const toggleMobileExpand = (id: number) => {
        setMobileExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    return (
        <header className={headerClasses} style={headerStyleObj}>
            {/* Accent line (luxury themes) */}
            {accentLine && (
                <div style={{ height: '2px', background: `linear-gradient(90deg, transparent, ${primaryColor}, transparent)` }} />
            )}

            <div className="container flex h-full items-center justify-between">
                {/* Logo / Site name */}
                <Link href="/" className="shrink-0 hover:opacity-80 transition-opacity" style={{ color: textColor }}>
                    {logoUrl ? (
                        <img src={logoUrl} alt={siteName} className="h-8 w-auto object-contain" />
                    ) : isLuxury ? (
                        <span style={{
                            fontFamily: 'var(--font-heading)',
                            fontSize: '1.25rem',
                            fontWeight: 300,
                            letterSpacing: '0.2em',
                            textTransform: 'uppercase',
                        }}>
                            {siteName}
                        </span>
                    ) : isDark ? (
                        <span style={{
                            fontFamily: 'var(--font-heading)',
                            fontSize: '1.25rem',
                            fontWeight: 800,
                            letterSpacing: '-0.02em',
                        }}>
                            {siteName}
                        </span>
                    ) : (
                        <span style={{
                            fontFamily: 'var(--font-heading)',
                            fontSize: '1.25rem',
                            fontWeight: 600,
                        }}>
                            {siteName}
                        </span>
                    )}
                </Link>

                {/* Desktop nav */}
                <div className={`hidden flex-1 items-center gap-6 px-8 md:flex ${alignmentClass}`}>
                    {menuTree.length > 0 && (
                        <nav className={`flex items-center ${isLuxury ? 'gap-8' : 'gap-6'}`}>
                            {menuTree.map((item) =>
                                item.children.length > 0 ? (
                                    <NavItemWithDropdown
                                        key={item.id}
                                        item={item}
                                        children={item.children}
                                        style={navStyle}
                                        textColor={textColor}
                                        accentColor={primaryColor}
                                        bgColor={bgColor}
                                        isDark={isDark}
                                    />
                                ) : (
                                    <NavItem
                                        key={item.id}
                                        item={item}
                                        style={navStyle}
                                        textColor={textColor}
                                        accentColor={primaryColor}
                                    />
                                ),
                            )}
                        </nav>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {ctaText && ctaUrl && (
                        <Link href={ctaUrl} className="hidden md:inline-flex items-center transition-all" style={ctaBtnStyle}>
                            {ctaText}
                        </Link>
                    )}

                    {/* Mobile hamburger */}
                    <button
                        type="button"
                        className="md:hidden p-2 rounded-md"
                        style={{ color: textColor }}
                        onClick={() => setMobileOpen(!mobileOpen)}
                        aria-label="Menu"
                    >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                            {mobileOpen
                                ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                : <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                            }
                        </svg>
                    </button>
                </div>
            </div>

            {/* Mobile menu */}
            {mobileOpen && (
                <div className="md:hidden border-t" style={{
                    backgroundColor: bgColor,
                    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                }}>
                    <nav className="container flex flex-col py-4 gap-1">
                        {menuTree.map((item) =>
                            item.children.length > 0 ? (
                                <div key={item.id}>
                                    <button
                                        type="button"
                                        className="flex w-full items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-black/5"
                                        style={{ color: textColor }}
                                        onClick={() => toggleMobileExpand(item.id)}
                                    >
                                        <span>{item.label}</span>
                                        <svg
                                            className={`h-4 w-4 transition-transform duration-200 ${mobileExpanded.has(item.id) ? 'rotate-180' : ''}`}
                                            fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                        </svg>
                                    </button>
                                    {mobileExpanded.has(item.id) && (
                                        <div className="pl-4">
                                            {item.children.map((child) => (
                                                <Link
                                                    key={child.id}
                                                    href={getMenuItemUrl(child)}
                                                    className="block px-3 py-2 rounded-md text-sm transition-colors hover:bg-black/5"
                                                    style={{ color: textColor, opacity: 0.8 }}
                                                    onClick={() => setMobileOpen(false)}
                                                >
                                                    {child.label}
                                                    {child.badge_text && (
                                                        <span className="ml-1.5 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                                                            style={{ backgroundColor: child.badge_color || primaryColor, color: '#fff' }}>
                                                            {child.badge_text}
                                                        </span>
                                                    )}
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <Link
                                    key={item.id}
                                    href={getMenuItemUrl(item)}
                                    className="px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-black/5"
                                    style={{ color: textColor }}
                                    onClick={() => setMobileOpen(false)}
                                >
                                    {item.label}
                                    {item.badge_text && (
                                        <span className="ml-1.5 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                                            style={{ backgroundColor: item.badge_color || primaryColor, color: '#fff' }}>
                                            {item.badge_text}
                                        </span>
                                    )}
                                </Link>
                            ),
                        )}
                        {ctaText && ctaUrl && (
                            <Link href={ctaUrl} className="mt-3 inline-flex items-center justify-center" style={ctaBtnStyle}>
                                {ctaText}
                            </Link>
                        )}
                    </nav>
                </div>
            )}
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
        github: 'M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22',
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
    const accentColor = c(customizations, 'footer.accent_color', c(customizations, 'colors.primary', '#6366f1'));
    const tagline = c(customizations, 'footer.tagline', '');
    const layout = c(customizations, 'footer.layout', 'simple');
    const showPoweredBy = b(customizations, 'footer.show_powered_by', true);
    const showSocialLinks = b(customizations, 'footer.show_social_links', false);
    const primaryColor = c(customizations, 'colors.primary', '#6366f1');
    const borderRadius = c(customizations, 'layout.border_radius', '0.375rem');

    const isDark = isHexDark(bgColor);
    const isLuxury = !isDark && (borderRadius === '0' || borderRadius === '0.125rem' || borderRadius === '0.25rem');

    const copyrightText = c(customizations, 'footer.copyright_text', `© {year} {site_name}.`)
        .replace('{year}', String(year))
        .replace('{site_name}', siteName);

    const borderStyle = isDark
        ? `1px solid rgba(255,255,255,0.06)`
        : `1px solid rgba(0,0,0,0.06)`;

    const menuTree = buildMenuTree(menu?.items ?? []);
    const socialPlatforms = ['facebook', 'twitter', 'instagram', 'linkedin', 'github', 'youtube'];

    // Footer nav renderer — shows sub-items in column under parent
    const FooterNav = ({ items, style: s, gap }: { items: MenuItemWithChildren[]; style?: string; gap?: string }) => (
        <nav className={`flex flex-wrap justify-center ${gap || 'gap-8'} mb-10`}>
            {items.map((item) => (
                <div key={item.id} className="text-center">
                    <NavItem item={item} style={s} textColor={textColor} accentColor={accentColor} />
                    {item.children.length > 0 && (
                        <div className="mt-2 flex flex-col gap-1">
                            {item.children.map((child) => (
                                <NavItem key={child.id} item={child} style={s} textColor={textColor} accentColor={accentColor} />
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </nav>
    );

    // Luxury footer — columns with accent titles
    if (isLuxury) {
        return (
            <footer style={{ backgroundColor: bgColor, color: textColor, borderTop: borderStyle }}>
                <div className="container py-16">
                    {tagline && (
                        <p className="text-center mb-8 text-sm tracking-widest uppercase opacity-60" style={{ fontFamily: 'var(--font-heading)' }}>
                            {tagline}
                        </p>
                    )}

                    {menuTree.length > 0 && <FooterNav items={menuTree} style="luxury" />}

                    {/* Gold divider */}
                    <div style={{ height: '1px', background: `linear-gradient(90deg, transparent, ${accentColor}60, transparent)`, margin: '0 auto 2rem', maxWidth: '200px' }} />

                    {showSocialLinks && (
                        <div className="flex justify-center gap-5 mb-8">
                            {socialPlatforms.map((p) => {
                                const url = c(customizations, `footer.social_${p}`);
                                return url ? <SocialIcon key={p} platform={p} url={url} color={accentColor} /> : null;
                            })}
                        </div>
                    )}

                    <p className="text-center text-xs tracking-widest uppercase opacity-50">{copyrightText}</p>
                    {showPoweredBy && (
                        <p className="mt-2 text-center text-xs opacity-30">Propulsé par ArtisanCMS</p>
                    )}
                </div>
            </footer>
        );
    }

    // Dark footer — modern minimal avec accent néon
    if (isDark) {
        return (
            <footer style={{ backgroundColor: bgColor, color: textColor, borderTop: borderStyle }}>
                <div className="container py-12">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                        {/* Brand */}
                        <div className="flex-1">
                            <Link href="/" className="hover:opacity-80 transition-opacity">
                                <span style={{
                                    fontFamily: 'var(--font-heading)',
                                    fontSize: '1.125rem',
                                    fontWeight: 800,
                                    letterSpacing: '-0.02em',
                                    color: '#fff',
                                }}>
                                    {siteName}
                                </span>
                            </Link>
                            {tagline && (
                                <p className="mt-2 text-sm opacity-50">{tagline}</p>
                            )}
                        </div>

                        {/* Nav with sub-items */}
                        {menuTree.length > 0 && (
                            <nav className="flex flex-wrap gap-6">
                                {menuTree.map((item) => (
                                    <div key={item.id}>
                                        <NavItem item={item} style="dark" textColor={textColor} accentColor={accentColor} />
                                        {item.children.length > 0 && (
                                            <div className="mt-1.5 flex flex-col gap-0.5">
                                                {item.children.map((child) => (
                                                    <NavItem key={child.id} item={child} style="dark" textColor={textColor} accentColor={accentColor} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </nav>
                        )}

                        {/* Social */}
                        {showSocialLinks && (
                            <div className="flex gap-4">
                                {socialPlatforms.map((p) => {
                                    const url = c(customizations, `footer.social_${p}`);
                                    return url ? <SocialIcon key={p} platform={p} url={url} color={accentColor} /> : null;
                                })}
                            </div>
                        )}
                    </div>

                    <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.06)', margin: '2.5rem 0' }} />

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs opacity-40">
                        <p>{copyrightText}</p>
                        {showPoweredBy && <p>Propulsé par ArtisanCMS</p>}
                    </div>
                </div>
            </footer>
        );
    }

    // Default / nature footer
    return (
        <footer style={{ backgroundColor: bgColor, color: textColor, borderTop: borderStyle }}>
            <div className="container py-10">
                {tagline && (
                    <p className="text-center mb-6 text-sm italic opacity-70" style={{ fontFamily: 'var(--font-heading)' }}>
                        {tagline}
                    </p>
                )}

                {menuTree.length > 0 && (
                    <nav className="mb-6 flex flex-wrap justify-center gap-6">
                        {menuTree.map((item) => (
                            <div key={item.id} className="text-center">
                                <NavItem item={item} textColor={textColor} />
                                {item.children.length > 0 && (
                                    <div className="mt-1.5 flex flex-col gap-0.5">
                                        {item.children.map((child) => (
                                            <NavItem key={child.id} item={child} textColor={textColor} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </nav>
                )}

                {showSocialLinks && (
                    <div className="mb-6 flex justify-center gap-4">
                        {socialPlatforms.map((p) => {
                            const url = c(customizations, `footer.social_${p}`);
                            return url ? <SocialIcon key={p} platform={p} url={url} color={accentColor} /> : null;
                        })}
                    </div>
                )}

                <p className="text-center text-sm opacity-70">{copyrightText}</p>
                {showPoweredBy && (
                    <p className="mt-2 text-center text-xs opacity-40">Propulsé par ArtisanCMS</p>
                )}
            </div>
        </footer>
    );
}

// ─── Layout ─────────────────────────────────────────────────────────────────

export default function FrontLayout({ children, menus, theme }: FrontLayoutProps) {
    const { branding, designTokensCss, announcement } = usePage().props as {
        branding?: { logo?: string; favicon?: string; name?: string };
        designTokensCss?: string;
        announcement?: {
            id: number; message: string; link_text?: string; link_url?: string;
            bg_color: string; text_color: string; position: 'top' | 'bottom'; dismissible: boolean;
        } | null;
        [key: string]: unknown;
    };
    const customizations = (theme.customizations || {}) as Record<string, string | boolean>;
    const cssVariables = buildCssVariables(customizations);
    const googleFontsUrl = getGoogleFontsUrl(customizations);
    const favicon = branding?.favicon;

    const bgColor = c(customizations, 'colors.background', '#ffffff');
    const textColor = c(customizations, 'colors.text', '#1e293b');
    const fontBody = c(customizations, 'fonts.body', '');
    const fontHeading = c(customizations, 'fonts.heading', '');
    const baseSize = c(customizations, 'fonts.base_size', '16px');
    const lineHeight = c(customizations, 'fonts.line_height', '1.6');

    const animationConfigMap = useMemo<AnimationConfigMap | null>(() => {
        const raw = customizations['animations.config'];
        if (!raw || typeof raw !== 'string') return null;
        try {
            return JSON.parse(raw) as AnimationConfigMap;
        } catch {
            return null;
        }
    }, [customizations]);

    // Inject font family into CSS variables if declared
    const allVars: Record<string, string> = { ...cssVariables };
    if (fontBody) allVars['--font-body'] = `'${fontBody}', system-ui, sans-serif`;
    if (fontHeading) allVars['--font-heading'] = `'${fontHeading}', Georgia, serif`;

    // Build CSS variables as a <style> tag to avoid React's CSSProperties serialization issues
    // (spreading CSS custom properties via inline style can cause React to drop standard properties)
    const cssVarBlock = Object.entries(allVars)
        .map(([k, v]) => `${k}:${v}`)
        .join(';');
    const themeStyleTag = `.artisan-theme{${cssVarBlock}}`;

    const rootStyle: React.CSSProperties = {
        backgroundColor: bgColor,
        color: textColor,
        fontFamily: fontBody ? `var(--font-body)` : undefined,
        fontSize: baseSize,
        lineHeight,
    };

    return (
        <AnimationConfigContext.Provider value={animationConfigMap}>
            <div className="artisan-theme flex min-h-screen flex-col" style={rootStyle}>
                <Head>
                    {favicon && <link rel="icon" href={favicon} />}
                    <style>{themeStyleTag}</style>
                    {designTokensCss && <style>{designTokensCss}</style>}
                    <link rel="alternate" type="application/rss+xml" title="Flux RSS" href="/feed" />
                    {googleFontsUrl && (
                        <>
                            <link rel="preconnect" href="https://fonts.googleapis.com" />
                            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                            <link rel="stylesheet" href={googleFontsUrl} />
                        </>
                    )}
                </Head>
                {announcement && announcement.position === 'top' && (
                    <AnnouncementBar announcement={announcement} />
                )}
                <Header menu={menus.header} customizations={customizations} brandingLogo={branding?.logo} />
                <div className="flex-1">{children}</div>
                <Footer menu={menus.footer} customizations={customizations} />
                {announcement && announcement.position === 'bottom' && (
                    <AnnouncementBar announcement={announcement} />
                )}
            </div>
        </AnimationConfigContext.Provider>
    );
}
