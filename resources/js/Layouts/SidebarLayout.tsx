import { Head, Link, usePage } from '@inertiajs/react';
import type { MenuData, MenuItemData } from '@/types/cms';
import { useMemo, useState, useEffect, type ReactNode } from 'react';

function useIsDesktop() {
    const [isDesktop, setIsDesktop] = useState(() =>
        typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
    );
    useEffect(() => {
        const mq = window.matchMedia('(min-width: 1024px)');
        const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
        mq.addEventListener('change', handler);
        setIsDesktop(mq.matches);
        return () => mq.removeEventListener('change', handler);
    }, []);
    return isDesktop;
}
import { AnimationConfigContext, type AnimationConfigMap } from '@/Components/front/block-renderer';

interface SidebarLayoutProps {
    children: ReactNode;
    menus: Record<string, MenuData>;
    theme: {
        customizations: Record<string, string | boolean>;
        layouts: Array<{ slug: string; name: string }>;
    };
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

function getGoogleFontsUrl(customizations: Record<string, string | boolean>): string | null {
    const heading = c(customizations, 'fonts.heading', 'Syne');
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

function buildCssVariables(customizations: Record<string, string | boolean>): Record<string, string> {
    const vars: Record<string, string> = {};
    const PREFIXES: Record<string, string> = {
        colors: '--color-',
        fonts: '--font-',
        layout: '--',
        sidebar: '--sidebar-',
    };
    for (const [dotKey, value] of Object.entries(customizations)) {
        if (!value && value !== 0) continue;
        if (typeof value === 'boolean') continue;
        const dotIdx = dotKey.indexOf('.');
        if (dotIdx === -1) continue;
        const section = dotKey.substring(0, dotIdx);
        const key = dotKey.substring(dotIdx + 1);
        if (['animations', 'typography', 'effects', 'global_styles', 'footer', 'header'].includes(section)) continue;
        const prefix = PREFIXES[section];
        if (!prefix) continue;
        const strVal = String(value);
        if (strVal.startsWith('/') || strVal.startsWith('http')) continue;
        if (strVal.includes('{year}') || strVal.includes('{site_name}')) continue;
        vars[prefix + key.replace(/_/g, '-')] = strVal;
    }
    return vars;
}

// ─── Social icons ────────────────────────────────────────────────────────────

const SOCIAL_PATHS: Record<string, string> = {
    twitter: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
    instagram: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z',
    linkedin: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
    github: 'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12',
    dribbble: 'M12 24C5.385 24 0 18.615 0 12S5.385 0 12 0s12 5.385 12 12-5.385 12-12 12zm10.12-10.358c-.35-.11-3.17-.953-6.384-.438 1.34 3.684 1.887 6.684 1.992 7.308 2.3-1.555 3.936-4.02 4.395-6.87zm-6.115 7.808c-.153-.9-.75-4.032-2.19-7.77l-.066.02c-5.79 2.015-7.86 6.017-8.04 6.4 1.73 1.358 3.92 2.166 6.29 2.166 1.42 0 2.77-.29 4-.816zm-11.62-2.logout c.166-.398 2.38-4.735 7.744-6.44.13-.04.26-.08.39-.12-.25-.566-.51-1.112-.78-1.65C7.27 13 2.6 13.05 2.21 13.05h-.08c0 2.46.976 4.7 2.554 6.4zm-2.42-8.955c.41.003 4.44-.024 8.86-1.19.4-.11.8-.24 1.19-.38-.76-1.37-1.57-2.55-2.39-3.53-2.73 1.29-4.83 3.54-5.66 6.1zM12.07 2.1c.81 1 1.63 2.2 2.41 3.62 2.87-1.07 4.09-2.7 4.24-2.92C17.12 1.26 14.66.5 12.07 2.1zM19.76 4.9c-.19.25-1.55 1.99-4.54 3.23.19.39.37.79.54 1.19.06.14.12.28.17.42 3.38-.42 6.73.26 7.07.33-.03-1.93-.58-3.73-1.54-5.18z',
};

function SocialIcon({ platform, url, color }: { platform: string; url: string; color: string }) {
    const path = SOCIAL_PATHS[platform];
    if (!path || !url) return null;
    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            title={platform}
            style={{ color, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, transition: 'opacity 0.15s, color 0.15s' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = ''; (e.currentTarget as HTMLElement).style.color = color; }}
        >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d={path} />
            </svg>
        </a>
    );
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

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function Sidebar({ menu, customizations, siteName, favicon }: {
    menu?: MenuData;
    customizations: Record<string, string | boolean>;
    siteName: string;
    favicon?: string;
}) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
    const isDesktop = useIsDesktop();

    const sidebarBg = c(customizations, 'sidebar.background_color', '#080808');
    const textColor = c(customizations, 'sidebar.text_color', '#a1a1aa');
    const activeColor = c(customizations, 'sidebar.active_color', '#ffffff');
    const borderColor = c(customizations, 'sidebar.border_color', 'rgba(255,255,255,0.06)');
    const logoUrl = c(customizations, 'sidebar.logo_url', '');
    const tagline = c(customizations, 'sidebar.tagline', 'Studio créatif');
    const showTagline = b(customizations, 'sidebar.show_tagline', true);
    const ctaText = c(customizations, 'sidebar.cta_text', 'Démarrer un projet');
    const ctaUrl = c(customizations, 'sidebar.cta_url', '/contact');
    const primaryColor = c(customizations, 'colors.primary', '#7c3aed');
    const showSocial = b(customizations, 'sidebar.show_social', true);
    const sidebarWidth = c(customizations, 'sidebar.width', '260px');

    useEffect(() => {
        const el = document.querySelector('.studio-content');
        if (!el) return;
        const handler = () => setScrolled(el.scrollTop > 20);
        el.addEventListener('scroll', handler);
        return () => el.removeEventListener('scroll', handler);
    }, []);

    const menuTree = buildMenuTree(menu?.items ?? []);
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

    const toggleExpand = (id: number) => {
        setExpandedItems((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const socialPlatforms = ['twitter', 'instagram', 'linkedin', 'github', 'dribbble'];

    const getItemHref = (item: MenuItemData) => item.url || (item.type === 'page' ? `/${item.label.toLowerCase()}` : '#');

    const sidebarContent = (
        <div style={{
            width: sidebarWidth,
            minWidth: sidebarWidth,
            height: '100vh',
            backgroundColor: sidebarBg,
            borderRight: `1px solid ${borderColor}`,
            display: 'flex',
            flexDirection: 'column',
            position: 'fixed',
            top: 0,
            left: 0,
            zIndex: 50,
            overflow: 'hidden',
        }}>
            {/* Logo / Brand */}
            <div style={{ padding: '32px 28px 24px', borderBottom: `1px solid ${borderColor}` }}>
                <Link href="/" style={{ textDecoration: 'none', display: 'block' }}>
                    {logoUrl ? (
                        <img src={logoUrl} alt={siteName} style={{ height: 32, width: 'auto', objectFit: 'contain' }} />
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {favicon ? (
                                <img src={favicon} alt="" style={{ width: 28, height: 28, borderRadius: 6 }} />
                            ) : (
                                <div style={{
                                    width: 28, height: 28, borderRadius: 6,
                                    background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}99)`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 13, fontWeight: 700, color: '#fff',
                                }}>
                                    {siteName.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <span style={{
                                fontFamily: 'var(--font-heading, inherit)',
                                fontSize: '1rem',
                                fontWeight: 700,
                                color: '#fff',
                                letterSpacing: '-0.02em',
                            }}>
                                {siteName}
                            </span>
                        </div>
                    )}
                </Link>
                {showTagline && tagline && (
                    <p style={{ margin: '8px 0 0', fontSize: '0.72rem', color: textColor, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.6 }}>
                        {tagline}
                    </p>
                )}
            </div>

            {/* Navigation */}
            <nav style={{ flex: 1, padding: '20px 16px', overflowY: 'auto' }}>
                {menuTree.length > 0 && (
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {menuTree.map((item) => {
                            const href = getItemHref(item);
                            const hasChildren = item.children.length > 0;
                            const isItemActive = hasChildren
                                ? item.children.some((ch) => { const h = getItemHref(ch); return currentPath === h || currentPath.startsWith(h + '/'); })
                                : (currentPath === href || currentPath.startsWith(href + '/'));
                            const isExpanded = expandedItems.has(item.id);

                            return (
                                <li key={item.id}>
                                    {hasChildren ? (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => toggleExpand(item.id)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    width: '100%',
                                                    gap: 10,
                                                    padding: '9px 12px',
                                                    borderRadius: 8,
                                                    fontSize: '0.875rem',
                                                    fontWeight: isItemActive ? 600 : 400,
                                                    color: isItemActive ? activeColor : textColor,
                                                    textDecoration: 'none',
                                                    backgroundColor: isItemActive ? 'rgba(255,255,255,0.06)' : 'transparent',
                                                    transition: 'all 0.15s ease',
                                                    position: 'relative',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    textAlign: 'left',
                                                }}
                                            >
                                                {isItemActive && (
                                                    <span style={{
                                                        position: 'absolute',
                                                        left: 0, top: '50%', transform: 'translateY(-50%)',
                                                        width: 3, height: '60%',
                                                        backgroundColor: primaryColor,
                                                        borderRadius: '0 2px 2px 0',
                                                    }} />
                                                )}
                                                <span style={{ flex: 1, paddingLeft: isItemActive ? 4 : 0 }}>
                                                    {item.label}
                                                    {item.badge_text && (
                                                        <span style={{
                                                            marginLeft: 6,
                                                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                            padding: '1px 6px', borderRadius: 999,
                                                            backgroundColor: item.badge_color || primaryColor,
                                                            color: '#fff', fontSize: '0.625rem', fontWeight: 700,
                                                        }}>
                                                            {item.badge_text}
                                                        </span>
                                                    )}
                                                </span>
                                                <svg
                                                    width="14" height="14" viewBox="0 0 24 24" fill="none"
                                                    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                                    style={{ transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', opacity: 0.5 }}
                                                >
                                                    <path d="M6 9l6 6 6-6" />
                                                </svg>
                                            </button>
                                            {isExpanded && (
                                                <ul style={{ listStyle: 'none', margin: '2px 0 0', padding: '0 0 0 24px', display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                    {item.children.map((child) => {
                                                        const childHref = getItemHref(child);
                                                        const childActive = currentPath === childHref || currentPath.startsWith(childHref + '/');
                                                        return (
                                                            <li key={child.id}>
                                                                <Link
                                                                    href={childHref}
                                                                    style={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        padding: '7px 10px',
                                                                        borderRadius: 6,
                                                                        fontSize: '0.8125rem',
                                                                        fontWeight: childActive ? 500 : 400,
                                                                        color: childActive ? activeColor : textColor,
                                                                        textDecoration: 'none',
                                                                        opacity: childActive ? 1 : 0.75,
                                                                        backgroundColor: childActive ? 'rgba(255,255,255,0.04)' : 'transparent',
                                                                        transition: 'all 0.15s ease',
                                                                    }}
                                                                    onMouseEnter={(e) => {
                                                                        if (!childActive) (e.currentTarget as HTMLElement).style.opacity = '1';
                                                                        if (!childActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.03)';
                                                                    }}
                                                                    onMouseLeave={(e) => {
                                                                        if (!childActive) (e.currentTarget as HTMLElement).style.opacity = '0.75';
                                                                        if (!childActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                                                                    }}
                                                                >
                                                                    {child.label}
                                                                    {child.badge_text && (
                                                                        <span style={{
                                                                            marginLeft: 6,
                                                                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                                            padding: '1px 5px', borderRadius: 999,
                                                                            backgroundColor: child.badge_color || primaryColor,
                                                                            color: '#fff', fontSize: '0.6rem', fontWeight: 700,
                                                                        }}>
                                                                            {child.badge_text}
                                                                        </span>
                                                                    )}
                                                                </Link>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            )}
                                        </>
                                    ) : (
                                        <Link
                                            href={href}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 10,
                                                padding: '9px 12px',
                                                borderRadius: 8,
                                                fontSize: '0.875rem',
                                                fontWeight: isItemActive ? 600 : 400,
                                                color: isItemActive ? activeColor : textColor,
                                                textDecoration: 'none',
                                                backgroundColor: isItemActive ? 'rgba(255,255,255,0.06)' : 'transparent',
                                                transition: 'all 0.15s ease',
                                                position: 'relative',
                                            }}
                                            onMouseEnter={(e) => {
                                                if (!isItemActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.04)';
                                                if (!isItemActive) (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.85)';
                                            }}
                                            onMouseLeave={(e) => {
                                                if (!isItemActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                                                if (!isItemActive) (e.currentTarget as HTMLElement).style.color = textColor;
                                            }}
                                        >
                                            {isItemActive && (
                                                <span style={{
                                                    position: 'absolute',
                                                    left: 0, top: '50%', transform: 'translateY(-50%)',
                                                    width: 3, height: '60%',
                                                    backgroundColor: primaryColor,
                                                    borderRadius: '0 2px 2px 0',
                                                }} />
                                            )}
                                            <span style={{ paddingLeft: isItemActive ? 4 : 0 }}>
                                                {item.label}
                                                {item.badge_text && (
                                                    <span style={{
                                                        marginLeft: 6,
                                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                        padding: '1px 6px', borderRadius: 999,
                                                        backgroundColor: item.badge_color || primaryColor,
                                                        color: '#fff', fontSize: '0.625rem', fontWeight: 700,
                                                    }}>
                                                        {item.badge_text}
                                                    </span>
                                                )}
                                            </span>
                                        </Link>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </nav>

            {/* CTA + Social */}
            <div style={{ padding: '16px 20px 24px', borderTop: `1px solid ${borderColor}` }}>
                {ctaText && ctaUrl && (
                    <Link
                        href={ctaUrl}
                        style={{
                            display: 'block',
                            width: '100%',
                            textAlign: 'center',
                            padding: '10px 16px',
                            borderRadius: 8,
                            backgroundColor: primaryColor,
                            color: '#fff',
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            textDecoration: 'none',
                            marginBottom: showSocial ? 16 : 0,
                            boxShadow: `0 0 24px ${primaryColor}40`,
                            transition: 'opacity 0.15s, box-shadow 0.15s',
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.9'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
                    >
                        {ctaText}
                    </Link>
                )}
                {showSocial && (
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        {socialPlatforms.map((p) => {
                            const url = c(customizations, `sidebar.social_${p}`);
                            return url ? <SocialIcon key={p} platform={p} url={url} color={textColor} /> : null;
                        })}
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop sidebar */}
            {isDesktop && (
                <div style={{ width: sidebarWidth, flexShrink: 0 }}>
                    {sidebarContent}
                </div>
            )}

            {/* Mobile header */}
            {!isDesktop && (
            <div
                style={{
                    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
                    height: 56,
                    backgroundColor: scrolled ? sidebarBg + 'f0' : sidebarBg,
                    backdropFilter: scrolled ? 'blur(12px)' : 'none',
                    borderBottom: `1px solid ${borderColor}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0 20px',
                    transition: 'background-color 0.2s',
                }}
            >
                <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {logoUrl ? (
                        <img src={logoUrl} alt={siteName} style={{ height: 24, width: 'auto' }} />
                    ) : (
                        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: '#fff', fontSize: '0.9375rem', letterSpacing: '-0.02em' }}>
                            {siteName}
                        </span>
                    )}
                </Link>

                <button
                    type="button"
                    onClick={() => setMobileOpen(!mobileOpen)}
                    aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', padding: 4, display: 'flex', alignItems: 'center' }}
                >
                    {mobileOpen ? (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    ) : (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
                        </svg>
                    )}
                </button>
            </div>
            )}

            {/* Mobile menu overlay */}
            {!isDesktop && mobileOpen && (
                <div
                    style={{
                        position: 'fixed', inset: 0, zIndex: 49,
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(4px)',
                    }}
                    onClick={() => setMobileOpen(false)}
                />
            )}
            {!isDesktop && mobileOpen && (
                <div
                    style={{
                        position: 'fixed', top: 56, left: 0, bottom: 0, zIndex: 49,
                        width: Math.min(280, window.innerWidth * 0.85),
                        backgroundColor: sidebarBg,
                        borderRight: `1px solid ${borderColor}`,
                        overflowY: 'auto',
                        display: 'flex', flexDirection: 'column',
                        animation: 'slideInLeft 0.25s ease',
                    }}
                >
                    <style>{`
                        @keyframes slideInLeft {
                            from { transform: translateX(-100%); opacity: 0; }
                            to { transform: translateX(0); opacity: 1; }
                        }
                    `}</style>
                    <nav style={{ flex: 1, padding: '16px 12px' }}>
                        {menuTree.map((item) => {
                            const href = getItemHref(item);
                            const hasChildren = item.children.length > 0;
                            return (
                                <div key={item.id}>
                                    {hasChildren ? (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => toggleExpand(item.id)}
                                                style={{
                                                    display: 'flex', alignItems: 'center', width: '100%',
                                                    justifyContent: 'space-between',
                                                    padding: '11px 14px', borderRadius: 8,
                                                    fontSize: '0.9375rem', fontWeight: 500, color: textColor,
                                                    border: 'none', background: 'transparent', cursor: 'pointer',
                                                    textAlign: 'left', marginBottom: 2,
                                                }}
                                            >
                                                <span>{item.label}</span>
                                                <svg
                                                    width="14" height="14" viewBox="0 0 24 24" fill="none"
                                                    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                                    style={{ transition: 'transform 0.2s', transform: expandedItems.has(item.id) ? 'rotate(180deg)' : 'rotate(0deg)', opacity: 0.5 }}
                                                >
                                                    <path d="M6 9l6 6 6-6" />
                                                </svg>
                                            </button>
                                            {expandedItems.has(item.id) && (
                                                <div style={{ paddingLeft: 16, marginBottom: 4 }}>
                                                    {item.children.map((child) => (
                                                        <Link
                                                            key={child.id}
                                                            href={getItemHref(child)}
                                                            style={{
                                                                display: 'block', padding: '9px 14px', borderRadius: 8,
                                                                fontSize: '0.875rem', fontWeight: 400, color: textColor,
                                                                textDecoration: 'none', marginBottom: 1, opacity: 0.8,
                                                            }}
                                                            onClick={() => setMobileOpen(false)}
                                                        >
                                                            {child.label}
                                                            {child.badge_text && (
                                                                <span style={{
                                                                    marginLeft: 6,
                                                                    display: 'inline-flex', alignItems: 'center',
                                                                    padding: '1px 5px', borderRadius: 999,
                                                                    backgroundColor: child.badge_color || primaryColor,
                                                                    color: '#fff', fontSize: '0.6rem', fontWeight: 700,
                                                                }}>
                                                                    {child.badge_text}
                                                                </span>
                                                            )}
                                                        </Link>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <Link
                                            href={href}
                                            style={{
                                                display: 'block', padding: '11px 14px', borderRadius: 8,
                                                fontSize: '0.9375rem', fontWeight: 500, color: textColor,
                                                textDecoration: 'none', marginBottom: 2,
                                            }}
                                            onClick={() => setMobileOpen(false)}
                                        >
                                            {item.label}
                                            {item.badge_text && (
                                                <span style={{
                                                    marginLeft: 6,
                                                    display: 'inline-flex', alignItems: 'center',
                                                    padding: '1px 6px', borderRadius: 999,
                                                    backgroundColor: item.badge_color || primaryColor,
                                                    color: '#fff', fontSize: '0.625rem', fontWeight: 700,
                                                }}>
                                                    {item.badge_text}
                                                </span>
                                            )}
                                        </Link>
                                    )}
                                </div>
                            );
                        })}
                    </nav>
                    {ctaText && ctaUrl && (
                        <div style={{ padding: '16px 20px 24px', borderTop: `1px solid ${borderColor}` }}>
                            <Link
                                href={ctaUrl}
                                style={{
                                    display: 'block', textAlign: 'center',
                                    padding: '12px', borderRadius: 8,
                                    backgroundColor: primaryColor, color: '#fff',
                                    fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none',
                                }}
                                onClick={() => setMobileOpen(false)}
                            >
                                {ctaText}
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}

// ─── Layout ──────────────────────────────────────────────────────────────────

export default function SidebarLayout({ children, menus, theme }: SidebarLayoutProps) {
    const isDesktop = useIsDesktop();
    const { branding, designTokensCss } = usePage().props as {
        branding?: { logo?: string; favicon?: string; name?: string };
        designTokensCss?: string;
        [key: string]: unknown;
    };
    const { cms } = usePage().props as { cms?: { name: string }; [key: string]: unknown };
    const siteName = branding?.name || cms?.name || 'Studio';
    const customizations = (theme.customizations || {}) as Record<string, string | boolean>;
    const cssVariables = buildCssVariables(customizations);
    const googleFontsUrl = getGoogleFontsUrl(customizations);
    const favicon = branding?.favicon;

    const fontBody = c(customizations, 'fonts.body', 'Inter');
    const fontHeading = c(customizations, 'fonts.heading', 'Syne');
    const bgColor = c(customizations, 'colors.background', '#0c0c0e');
    const textColor = c(customizations, 'colors.text', '#fafafa');
    const baseSize = c(customizations, 'fonts.base_size', '15px');
    const lineHeight = c(customizations, 'fonts.line_height', '1.7');
    const sidebarWidth = c(customizations, 'sidebar.width', '260px');

    const animationConfigMap = useMemo<AnimationConfigMap | null>(() => {
        const raw = customizations['animations.config'];
        if (!raw || typeof raw !== 'string') return null;
        try { return JSON.parse(raw) as AnimationConfigMap; } catch { return null; }
    }, [customizations]);

    const allVars: Record<string, string> = { ...cssVariables };
    if (fontBody) allVars['--font-body'] = `'${fontBody}', system-ui, sans-serif`;
    if (fontHeading) allVars['--font-heading'] = `'${fontHeading}', Georgia, serif`;

    const cssVarBlock = Object.entries(allVars).map(([k, v]) => `${k}:${v}`).join(';');
    const themeStyleTag = `.studio-theme{${cssVarBlock}}`;

    const rootStyle: React.CSSProperties = {
        backgroundColor: bgColor,
        color: textColor,
        fontFamily: fontBody ? `var(--font-body)` : undefined,
        fontSize: baseSize,
        lineHeight,
    };

    return (
        <AnimationConfigContext.Provider value={animationConfigMap}>
            <div className="studio-theme" style={rootStyle}>
                <Head>
                    {favicon && <link rel="icon" href={favicon} />}
                    <style>{themeStyleTag}</style>
                    {designTokensCss && <style>{designTokensCss}</style>}
                    {googleFontsUrl && (
                        <>
                            <link rel="preconnect" href="https://fonts.googleapis.com" />
                            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                            <link rel="stylesheet" href={googleFontsUrl} />
                        </>
                    )}
                </Head>

                <div style={{ display: 'flex', minHeight: '100vh' }}>
                    <Sidebar
                        menu={menus.sidebar || menus.header}
                        customizations={customizations}
                        siteName={siteName}
                        favicon={favicon}
                    />

                    {/* Main content — scrollable, offset by sidebar width on desktop */}
                    <main
                        className="studio-content lg:ml-0"
                        style={{
                            flex: 1,
                            minWidth: 0,
                            // On desktop, the sidebar is fixed so we need margin
                        }}
                    >
                        {/* Mobile top padding (for fixed mobile header) */}
                        {!isDesktop && <div style={{ height: 56 }} />}
                        {children}
                    </main>
                </div>
            </div>
        </AnimationConfigContext.Provider>
    );
}
