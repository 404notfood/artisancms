import { Link, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import type { MenuData, MenuItemData } from '@/types/cms';
import { c, b, isHexDark, getMenuItemUrl, buildMenuTree, resolveThemeStyle, type ThemeStyle, type MenuItemWithChildren } from './theme-helpers';

// ─── Types ──────────────────────────────────────────────────────────────────

type HeaderVariant = 'classic' | 'centered' | 'split' | 'minimal' | 'stacked';
type MobileMenuStyle = 'hamburger' | 'slide' | 'fullscreen';

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

    const className = styleVariant === 'luxury'
        ? `text-sm tracking-widest uppercase font-light transition-colors hover:text-[var(--color-primary)] ${item.css_class || ''}`
        : styleVariant === 'dark'
            ? `text-sm font-medium transition-all hover:text-[var(--color-primary)] hover:drop-shadow-[0_0_8px_var(--color-primary)] ${item.css_class || ''}`
            : styleVariant === 'nature'
                ? `text-sm font-medium transition-colors hover:text-[var(--color-primary)] relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-[var(--color-primary)] after:transition-all hover:after:w-full ${item.css_class || ''}`
                : styleVariant === 'creative'
                    ? `text-sm font-bold tracking-tight transition-all hover:text-[var(--color-primary)] hover:skew-x-[-2deg] ${item.css_class || ''}`
                    : `text-sm font-medium transition-colors hover:text-[var(--color-primary)] ${item.css_class || ''}`;

    const props = {
        style: baseStyle,
        className,
        ...(isExternal ? { target: item.target || '_self' } : {}),
    };

    const badge = item.badge_text ? (
        <span className="ml-1.5 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold"
            style={{ backgroundColor: item.badge_color || accentColor || '#6366f1', color: '#fff' }}>
            {item.badge_text}
        </span>
    ) : null;

    return isExternal
        ? <a href={url} {...props}>{item.label}{badge}</a>
        : <Link href={url} {...props}>{item.label}{badge}</Link>;
}

// ─── Nav Item with Dropdown (desktop hover) ─────────────────────────────────

function NavItemWithDropdown({ item, children, style: styleVariant, textColor, accentColor, isDark }: {
    item: MenuItemData;
    children: MenuItemData[];
    style?: string;
    textColor?: string;
    accentColor?: string;
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
                    className="absolute top-full left-0 mt-1 min-w-48 rounded-lg py-1 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                    style={{
                        backgroundColor: dropdownBg,
                        border: `1px solid ${dropdownBorder}`,
                    }}
                >
                    {children.map((child) => {
                        const childUrl = getMenuItemUrl(child);
                        const isExt = childUrl.startsWith('http');
                        const LinkComponent = isExt ? 'a' : Link;
                        const linkProps = isExt
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

// ─── Mobile Menu: Hamburger (dropdown) ──────────────────────────────────────

function MobileMenuHamburger({ menuTree, textColor, bgColor, isDark, primaryColor, ctaText, ctaUrl, ctaBtnStyle, onClose }: {
    menuTree: MenuItemWithChildren[];
    textColor: string;
    bgColor: string;
    isDark: boolean;
    primaryColor: string;
    ctaText: string;
    ctaUrl: string;
    ctaBtnStyle: React.CSSProperties;
    onClose: () => void;
}) {
    const [expanded, setExpanded] = useState<Set<number>>(new Set());

    const toggleExpand = (id: number) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    return (
        <div className="md:hidden border-t animate-in slide-in-from-top-1 duration-200" style={{
            backgroundColor: bgColor,
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
        }}>
            <nav className="container flex flex-col py-4 gap-1">
                {menuTree.map((item) =>
                    item.children.length > 0 ? (
                        <div key={item.id}>
                            <button
                                type="button"
                                className="flex w-full items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium transition-colors"
                                style={{ color: textColor }}
                                onClick={() => toggleExpand(item.id)}
                            >
                                <span>{item.label}</span>
                                <svg
                                    className={`h-4 w-4 transition-transform duration-200 ${expanded.has(item.id) ? 'rotate-180' : ''}`}
                                    fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                </svg>
                            </button>
                            {expanded.has(item.id) && (
                                <div className="pl-4 animate-in slide-in-from-top-1 duration-150">
                                    {item.children.map((child) => (
                                        <Link
                                            key={child.id}
                                            href={getMenuItemUrl(child)}
                                            className="block px-3 py-2 rounded-md text-sm transition-colors"
                                            style={{ color: textColor, opacity: 0.75 }}
                                            onClick={onClose}
                                        >
                                            {child.label}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link
                            key={item.id}
                            href={getMenuItemUrl(item)}
                            className="px-3 py-2.5 rounded-md text-sm font-medium transition-colors"
                            style={{ color: textColor }}
                            onClick={onClose}
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
                    <Link href={ctaUrl} className="mt-3 inline-flex items-center justify-center" style={ctaBtnStyle} onClick={onClose}>
                        {ctaText}
                    </Link>
                )}
            </nav>
        </div>
    );
}

// ─── Mobile Menu: Slide (side panel) ────────────────────────────────────────

function MobileMenuSlide({ menuTree, textColor, bgColor, isDark, primaryColor, accentColor, ctaText, ctaUrl, ctaBtnStyle, onClose, siteName }: {
    menuTree: MenuItemWithChildren[];
    textColor: string;
    bgColor: string;
    isDark: boolean;
    primaryColor: string;
    accentColor: string;
    ctaText: string;
    ctaUrl: string;
    ctaBtnStyle: React.CSSProperties;
    onClose: () => void;
    siteName: string;
}) {
    const [expanded, setExpanded] = useState<Set<number>>(new Set());

    const toggleExpand = (id: number) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm animate-in fade-in duration-300 md:hidden"
                onClick={onClose}
            />
            {/* Panel */}
            <div
                className="fixed top-0 right-0 z-[70] h-full w-[300px] max-w-[85vw] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 md:hidden"
                style={{ backgroundColor: bgColor }}
            >
                {/* Panel header */}
                <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)' }}>
                    <span style={{ color: textColor, fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '1.1rem' }}>
                        {siteName}
                    </span>
                    <button type="button" onClick={onClose} className="p-1.5 rounded-md transition-colors hover:bg-black/5" style={{ color: textColor }}>
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto px-3 py-4">
                    {menuTree.map((item) =>
                        item.children.length > 0 ? (
                            <div key={item.id} className="mb-1">
                                <button
                                    type="button"
                                    className="flex w-full items-center justify-between px-3 py-3 rounded-lg text-sm font-medium transition-colors"
                                    style={{ color: textColor }}
                                    onClick={() => toggleExpand(item.id)}
                                >
                                    <span>{item.label}</span>
                                    <svg
                                        className={`h-4 w-4 transition-transform duration-200 ${expanded.has(item.id) ? 'rotate-180' : ''}`}
                                        fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                    </svg>
                                </button>
                                {expanded.has(item.id) && (
                                    <div className="pl-3 mb-2 animate-in slide-in-from-top-1 duration-150"
                                        style={{ borderLeft: `2px solid ${primaryColor}30` }}>
                                        {item.children.map((child) => (
                                            <Link
                                                key={child.id}
                                                href={getMenuItemUrl(child)}
                                                className="block px-3 py-2.5 rounded-md text-sm transition-colors"
                                                style={{ color: textColor, opacity: 0.75 }}
                                                onClick={onClose}
                                            >
                                                {child.label}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link
                                key={item.id}
                                href={getMenuItemUrl(item)}
                                className="block px-3 py-3 rounded-lg text-sm font-medium transition-colors mb-1"
                                style={{ color: textColor }}
                                onClick={onClose}
                            >
                                {item.label}
                                {item.badge_text && (
                                    <span className="ml-2 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                                        style={{ backgroundColor: item.badge_color || primaryColor, color: '#fff' }}>
                                        {item.badge_text}
                                    </span>
                                )}
                            </Link>
                        ),
                    )}
                </nav>

                {/* Panel footer */}
                {ctaText && ctaUrl && (
                    <div className="px-5 py-4" style={{ borderTop: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)' }}>
                        <Link href={ctaUrl} className="flex items-center justify-center w-full" style={ctaBtnStyle} onClick={onClose}>
                            {ctaText}
                        </Link>
                    </div>
                )}
            </div>
        </>
    );
}

// ─── Mobile Menu: Fullscreen overlay ────────────────────────────────────────

function MobileMenuFullscreen({ menuTree, textColor, bgColor, isDark, primaryColor, ctaText, ctaUrl, ctaBtnStyle, onClose, siteName }: {
    menuTree: MenuItemWithChildren[];
    textColor: string;
    bgColor: string;
    isDark: boolean;
    primaryColor: string;
    ctaText: string;
    ctaUrl: string;
    ctaBtnStyle: React.CSSProperties;
    onClose: () => void;
    siteName: string;
}) {
    const [expanded, setExpanded] = useState<Set<number>>(new Set());

    const toggleExpand = (id: number) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    return (
        <div
            className="fixed inset-0 z-[80] flex flex-col animate-in fade-in zoom-in-95 duration-300 md:hidden"
            style={{ backgroundColor: bgColor }}
        >
            {/* Top bar */}
            <div className="flex items-center justify-between px-6 py-5">
                <span style={{ color: textColor, fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.25rem' }}>
                    {siteName}
                </span>
                <button type="button" onClick={onClose} className="p-2 rounded-full transition-colors" style={{ color: textColor, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Centered nav */}
            <nav className="flex-1 flex flex-col items-center justify-center gap-2 px-6 overflow-y-auto">
                {menuTree.map((item, idx) =>
                    item.children.length > 0 ? (
                        <div key={item.id} className="w-full max-w-sm text-center">
                            <button
                                type="button"
                                className="inline-flex items-center gap-2 py-3 transition-all"
                                style={{
                                    color: textColor,
                                    fontFamily: 'var(--font-heading)',
                                    fontSize: '1.5rem',
                                    fontWeight: 600,
                                    animationDelay: `${idx * 50}ms`,
                                }}
                                onClick={() => toggleExpand(item.id)}
                            >
                                {item.label}
                                <svg
                                    className={`h-5 w-5 transition-transform duration-200 ${expanded.has(item.id) ? 'rotate-180' : ''}`}
                                    fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                </svg>
                            </button>
                            {expanded.has(item.id) && (
                                <div className="flex flex-col items-center gap-1 mb-2 animate-in fade-in duration-200">
                                    {item.children.map((child) => (
                                        <Link
                                            key={child.id}
                                            href={getMenuItemUrl(child)}
                                            className="py-1.5 text-base transition-colors"
                                            style={{ color: textColor, opacity: 0.6 }}
                                            onClick={onClose}
                                        >
                                            {child.label}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link
                            key={item.id}
                            href={getMenuItemUrl(item)}
                            className="py-3 transition-all hover:tracking-wider"
                            style={{
                                color: textColor,
                                fontFamily: 'var(--font-heading)',
                                fontSize: '1.5rem',
                                fontWeight: 600,
                                animationDelay: `${idx * 50}ms`,
                            }}
                            onClick={onClose}
                        >
                            {item.label}
                            {item.badge_text && (
                                <span className="ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold"
                                    style={{ backgroundColor: item.badge_color || primaryColor, color: '#fff' }}>
                                    {item.badge_text}
                                </span>
                            )}
                        </Link>
                    ),
                )}
            </nav>

            {/* Bottom CTA */}
            {ctaText && ctaUrl && (
                <div className="px-6 py-6">
                    <Link href={ctaUrl} className="flex items-center justify-center w-full text-lg" style={{ ...ctaBtnStyle, padding: '0.875rem 2rem' }} onClick={onClose}>
                        {ctaText}
                    </Link>
                </div>
            )}
        </div>
    );
}

// ─── Hamburger Icon (animated) ──────────────────────────────────────────────

function HamburgerIcon({ open, color }: { open: boolean; color: string }) {
    return (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke={color}>
            {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            )}
        </svg>
    );
}

// ─── Header ─────────────────────────────────────────────────────────────────

interface HeaderProps {
    menu?: MenuData;
    customizations: Record<string, string | boolean>;
    brandingLogo?: string;
    themeStyle?: ThemeStyle;
}

export default function FrontHeader({ menu, customizations, brandingLogo, themeStyle }: HeaderProps) {
    const { cms } = usePage().props as { cms?: { name: string; version: string }; [key: string]: unknown };
    const siteName = cms?.name || 'ArtisanCMS';
    const [mobileOpen, setMobileOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

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
    const headerVariant = c(customizations, 'header.variant', 'classic') as HeaderVariant;
    const mobileMenuStyle = c(customizations, 'header.mobile_menu_style', 'hamburger') as MobileMenuStyle;

    const style = resolveThemeStyle(customizations, themeStyle);
    const isDark = style === 'dark';
    const isLuxury = style === 'luxury';
    const isNature = style === 'nature';
    const isCreative = style === 'creative';
    const navStyle = isDark ? 'dark' : isLuxury ? 'luxury' : isNature ? 'nature' : isCreative ? 'creative' : 'default';

    // Scroll detection for transparent/gradient headers
    useEffect(() => {
        if (headerStyle !== 'transparent' && headerStyle !== 'gradient') return;
        const handler = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handler, { passive: true });
        return () => window.removeEventListener('scroll', handler);
    }, [headerStyle]);

    const alignmentClass = menuAlignment === 'center'
        ? 'justify-center'
        : menuAlignment === 'left'
            ? 'justify-start'
            : 'justify-end';

    // Background computation
    let headerBgStyle: string | undefined;
    if (headerStyle === 'transparent') {
        headerBgStyle = scrolled ? bgColor : 'transparent';
    } else if (headerStyle === 'gradient') {
        headerBgStyle = scrolled ? bgColor : undefined;
    } else if (headerStyle === 'blur') {
        headerBgStyle = bgColor + 'e0';
    } else {
        headerBgStyle = bgColor;
    }

    let headerBorder = '';
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
        headerStyle === 'blur' ? 'backdrop-blur-md' : '',
        headerStyle === 'transparent' ? 'transition-all duration-300' : '',
        'transition-all duration-200',
    ].filter(Boolean).join(' ');

    const headerStyleObj: React.CSSProperties = {
        backgroundColor: headerBgStyle,
        height: headerVariant === 'stacked' ? 'auto' : height,
        borderBottom: headerBorder || undefined,
    };

    if (headerStyle === 'gradient' && !scrolled) {
        headerStyleObj.background = `linear-gradient(180deg, ${bgColor}, transparent)`;
    }

    const ctaBtnStyle: React.CSSProperties = {
        backgroundColor: ctaStyle === 'primary' ? primaryColor : 'transparent',
        color: ctaStyle === 'primary' ? '#fff' : primaryColor,
        border: ctaStyle === 'outline' ? `1px solid ${primaryColor}` : ctaStyle === 'secondary' ? `1px solid ${primaryColor}30` : 'none',
        borderRadius,
        padding: isLuxury ? '0.5rem 1.75rem' : '0.5rem 1.25rem',
        fontSize: isLuxury ? '0.75rem' : '0.875rem',
        letterSpacing: isLuxury ? '0.1em' : '0',
        textTransform: isLuxury ? 'uppercase' as const : 'none' as const,
        fontWeight: isDark ? 600 : isLuxury ? 400 : 500,
    };

    if (isDark && ctaStyle === 'primary') {
        ctaBtnStyle.boxShadow = `0 0 20px ${primaryColor}40`;
    }

    const menuTree = buildMenuTree(menu?.items ?? []);

    // Split menu for "split" variant: half left, half right of logo
    const halfIdx = Math.ceil(menuTree.length / 2);
    const leftMenu = menuTree.slice(0, halfIdx);
    const rightMenu = menuTree.slice(halfIdx);

    // ─── Logo ───────────────────────────────────────────────────────────────
    const LogoComponent = () => (
        <Link href="/" className="shrink-0 hover:opacity-80 transition-opacity" style={{ color: textColor }}>
            {logoUrl ? (
                <img src={logoUrl} alt={siteName} className="h-8 w-auto object-contain" />
            ) : isLuxury ? (
                <span style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: headerVariant === 'centered' || headerVariant === 'stacked' ? '1.5rem' : '1.25rem',
                    fontWeight: 300,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                }}>
                    {siteName}
                </span>
            ) : isDark ? (
                <span style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: headerVariant === 'centered' || headerVariant === 'stacked' ? '1.5rem' : '1.25rem',
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                }}>
                    {siteName}
                </span>
            ) : isNature ? (
                <span style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: headerVariant === 'centered' || headerVariant === 'stacked' ? '1.5rem' : '1.25rem',
                    fontWeight: 600,
                    fontStyle: 'italic',
                }}>
                    {siteName}
                </span>
            ) : (
                <span style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: headerVariant === 'centered' || headerVariant === 'stacked' ? '1.5rem' : '1.25rem',
                    fontWeight: 600,
                }}>
                    {siteName}
                </span>
            )}
        </Link>
    );

    // ─── Nav Section ────────────────────────────────────────────────────────
    const renderNavItems = (items: MenuItemWithChildren[]) =>
        items.map((item) =>
            item.children.length > 0 ? (
                <NavItemWithDropdown
                    key={item.id}
                    item={item}
                    children={item.children}
                    style={navStyle}
                    textColor={textColor}
                    accentColor={primaryColor}
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
        );

    // ─── Mobile menu trigger ────────────────────────────────────────────────
    const MobileToggle = () => (
        <button
            type="button"
            className="md:hidden p-2 rounded-md"
            style={{ color: textColor }}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
        >
            <HamburgerIcon open={mobileMenuStyle === 'hamburger' && mobileOpen} color={textColor} />
        </button>
    );

    // ─── Render mobile menu ─────────────────────────────────────────────────
    const renderMobileMenu = () => {
        if (!mobileOpen) return null;

        const commonProps = {
            menuTree,
            textColor,
            bgColor,
            isDark,
            primaryColor,
            accentColor: primaryColor,
            ctaText,
            ctaUrl,
            ctaBtnStyle,
            onClose: () => setMobileOpen(false),
            siteName,
        };

        switch (mobileMenuStyle) {
            case 'slide':
                return <MobileMenuSlide {...commonProps} />;
            case 'fullscreen':
                return <MobileMenuFullscreen {...commonProps} />;
            default:
                return <MobileMenuHamburger {...commonProps} />;
        }
    };

    // ─── Variant: Centered (logo centered, nav below or around) ─────────────

    if (headerVariant === 'centered') {
        return (
            <header className={headerClasses} style={headerStyleObj}>
                {accentLine && (
                    <div style={{ height: '2px', background: `linear-gradient(90deg, transparent, ${primaryColor}, transparent)` }} />
                )}
                <div className="container flex flex-col items-center justify-center h-full py-2">
                    <LogoComponent />
                    {menuTree.length > 0 && (
                        <nav className={`hidden md:flex items-center mt-2 ${isLuxury ? 'gap-8' : 'gap-6'}`}>
                            {renderNavItems(menuTree)}
                        </nav>
                    )}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
                        {ctaText && ctaUrl && (
                            <Link href={ctaUrl} className="hidden md:inline-flex items-center transition-all" style={ctaBtnStyle}>
                                {ctaText}
                            </Link>
                        )}
                        <MobileToggle />
                    </div>
                </div>
                {renderMobileMenu()}
            </header>
        );
    }

    // ─── Variant: Split (nav left - logo center - nav right) ────────────────

    if (headerVariant === 'split') {
        return (
            <header className={headerClasses} style={headerStyleObj}>
                {accentLine && (
                    <div style={{ height: '2px', background: `linear-gradient(90deg, transparent, ${primaryColor}, transparent)` }} />
                )}
                <div className="container flex items-center justify-between h-full">
                    {/* Left nav */}
                    <nav className={`hidden md:flex items-center flex-1 ${isLuxury ? 'gap-8' : 'gap-6'} justify-end pr-8`}>
                        {renderNavItems(leftMenu)}
                    </nav>

                    {/* Center logo */}
                    <LogoComponent />

                    {/* Right nav */}
                    <nav className={`hidden md:flex items-center flex-1 ${isLuxury ? 'gap-8' : 'gap-6'} justify-start pl-8`}>
                        {renderNavItems(rightMenu)}
                        {ctaText && ctaUrl && (
                            <Link href={ctaUrl} className="inline-flex items-center transition-all ml-auto" style={ctaBtnStyle}>
                                {ctaText}
                            </Link>
                        )}
                    </nav>

                    <MobileToggle />
                </div>
                {renderMobileMenu()}
            </header>
        );
    }

    // ─── Variant: Stacked (logo top line, nav second line) ──────────────────

    if (headerVariant === 'stacked') {
        return (
            <header className={headerClasses} style={headerStyleObj}>
                {accentLine && (
                    <div style={{ height: '2px', background: `linear-gradient(90deg, transparent, ${primaryColor}, transparent)` }} />
                )}
                {/* Top line: logo + CTA */}
                <div className="container flex items-center justify-between py-4">
                    <LogoComponent />
                    <div className="flex items-center gap-3">
                        {ctaText && ctaUrl && (
                            <Link href={ctaUrl} className="hidden md:inline-flex items-center transition-all" style={ctaBtnStyle}>
                                {ctaText}
                            </Link>
                        )}
                        <MobileToggle />
                    </div>
                </div>
                {/* Bottom line: nav */}
                {menuTree.length > 0 && (
                    <div className="hidden md:block" style={{ borderTop: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)' }}>
                        <div className="container">
                            <nav className={`flex items-center py-3 ${isLuxury ? 'gap-8' : 'gap-6'} ${alignmentClass}`}>
                                {renderNavItems(menuTree)}
                            </nav>
                        </div>
                    </div>
                )}
                {renderMobileMenu()}
            </header>
        );
    }

    // ─── Variant: Minimal (logo left, only hamburger, no desktop inline nav) ─

    if (headerVariant === 'minimal') {
        return (
            <header className={headerClasses} style={headerStyleObj}>
                {accentLine && (
                    <div style={{ height: '2px', background: `linear-gradient(90deg, transparent, ${primaryColor}, transparent)` }} />
                )}
                <div className="container flex items-center justify-between h-full">
                    <LogoComponent />
                    <div className="flex items-center gap-3">
                        {ctaText && ctaUrl && (
                            <Link href={ctaUrl} className="hidden md:inline-flex items-center transition-all" style={ctaBtnStyle}>
                                {ctaText}
                            </Link>
                        )}
                        {/* Always show hamburger, even on desktop */}
                        <button
                            type="button"
                            className="p-2 rounded-md"
                            style={{ color: textColor }}
                            onClick={() => setMobileOpen(!mobileOpen)}
                            aria-label="Menu"
                        >
                            <HamburgerIcon open={mobileMenuStyle === 'hamburger' && mobileOpen} color={textColor} />
                        </button>
                    </div>
                </div>
                {/* Use fullscreen or slide for minimal variant */}
                {mobileOpen && (() => {
                    const commonProps = {
                        menuTree,
                        textColor,
                        bgColor,
                        isDark,
                        primaryColor,
                        accentColor: primaryColor,
                        ctaText,
                        ctaUrl,
                        ctaBtnStyle,
                        onClose: () => setMobileOpen(false),
                        siteName,
                    };
                    if (mobileMenuStyle === 'slide') return <MobileMenuSlide {...commonProps} />;
                    if (mobileMenuStyle === 'fullscreen') return <MobileMenuFullscreen {...commonProps} />;
                    // Default for minimal: slide panel
                    return <MobileMenuSlide {...commonProps} />;
                })()}
            </header>
        );
    }

    // ─── Variant: Classic (default - logo left, nav right) ──────────────────

    return (
        <header className={headerClasses} style={headerStyleObj}>
            {accentLine && (
                <div style={{ height: '2px', background: `linear-gradient(90deg, transparent, ${primaryColor}, transparent)` }} />
            )}

            <div className="container flex h-full items-center justify-between">
                {/* Logo / Site name */}
                <LogoComponent />

                {/* Desktop nav */}
                <div className={`hidden flex-1 items-center gap-6 px-8 md:flex ${alignmentClass}`}>
                    {menuTree.length > 0 && (
                        <nav className={`flex items-center ${isLuxury ? 'gap-8' : 'gap-6'}`}>
                            {renderNavItems(menuTree)}
                        </nav>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {ctaText && ctaUrl && (
                        <Link href={ctaUrl} className="hidden md:inline-flex items-center transition-all" style={ctaBtnStyle}>
                            {ctaText}
                        </Link>
                    )}
                    <MobileToggle />
                </div>
            </div>

            {renderMobileMenu()}
        </header>
    );
}
