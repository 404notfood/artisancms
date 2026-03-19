import { Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import type { MenuData, MenuItemData } from '@/types/cms';
import SocialIcon from '../Front/SocialIcon';
import { c, b, buildMenuTree, type MenuItemWithChildren } from '../Front/theme-helpers';

export function useIsDesktop() {
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

interface SidebarProps {
    menu?: MenuData;
    customizations: Record<string, string | boolean>;
    siteName: string;
    favicon?: string;
}

function getItemHref(item: MenuItemData) {
    return item.url || (item.type === 'page' ? `/${item.label.toLowerCase()}` : '#');
}

function SidebarBrand({ logoUrl, siteName, favicon, primaryColor, showTagline, tagline, textColor, borderColor }: {
    logoUrl: string;
    siteName: string;
    favicon?: string;
    primaryColor: string;
    showTagline: boolean;
    tagline: string;
    textColor: string;
    borderColor: string;
}) {
    return (
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
    );
}

function DesktopNavItem({ item, currentPath, textColor, activeColor, primaryColor, expandedItems, toggleExpand }: {
    item: MenuItemWithChildren;
    currentPath: string;
    textColor: string;
    activeColor: string;
    primaryColor: string;
    expandedItems: Set<number>;
    toggleExpand: (id: number) => void;
}) {
    const href = getItemHref(item);
    const hasChildren = item.children.length > 0;
    const isItemActive = hasChildren
        ? item.children.some((ch) => { const h = getItemHref(ch); return currentPath === h || currentPath.startsWith(h + '/'); })
        : (currentPath === href || currentPath.startsWith(href + '/'));
    const isExpanded = expandedItems.has(item.id);

    const activeIndicator = isItemActive && (
        <span style={{
            position: 'absolute',
            left: 0, top: '50%', transform: 'translateY(-50%)',
            width: 3, height: '60%',
            backgroundColor: primaryColor,
            borderRadius: '0 2px 2px 0',
        }} />
    );

    const badge = item.badge_text && (
        <span style={{
            marginLeft: 6,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            padding: '1px 6px', borderRadius: 999,
            backgroundColor: item.badge_color || primaryColor,
            color: '#fff', fontSize: '0.625rem', fontWeight: 700,
        }}>
            {item.badge_text}
        </span>
    );

    if (hasChildren) {
        return (
            <li>
                <button
                    type="button"
                    onClick={() => toggleExpand(item.id)}
                    style={{
                        display: 'flex', alignItems: 'center', width: '100%', gap: 10,
                        padding: '9px 12px', borderRadius: 8,
                        fontSize: '0.875rem', fontWeight: isItemActive ? 600 : 400,
                        color: isItemActive ? activeColor : textColor,
                        textDecoration: 'none',
                        backgroundColor: isItemActive ? 'rgba(255,255,255,0.06)' : 'transparent',
                        transition: 'all 0.15s ease', position: 'relative',
                        border: 'none', cursor: 'pointer', textAlign: 'left',
                    }}
                >
                    {activeIndicator}
                    <span style={{ flex: 1, paddingLeft: isItemActive ? 4 : 0 }}>
                        {item.label}{badge}
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
                                            display: 'flex', alignItems: 'center',
                                            padding: '7px 10px', borderRadius: 6,
                                            fontSize: '0.8125rem', fontWeight: childActive ? 500 : 400,
                                            color: childActive ? activeColor : textColor,
                                            textDecoration: 'none', opacity: childActive ? 1 : 0.75,
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
                                                marginLeft: 6, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                padding: '1px 5px', borderRadius: 999,
                                                backgroundColor: child.badge_color || primaryColor,
                                                color: '#fff', fontSize: '0.6rem', fontWeight: 700,
                                            }}>{child.badge_text}</span>
                                        )}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </li>
        );
    }

    return (
        <li>
            <Link
                href={href}
                style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 12px', borderRadius: 8,
                    fontSize: '0.875rem', fontWeight: isItemActive ? 600 : 400,
                    color: isItemActive ? activeColor : textColor,
                    textDecoration: 'none',
                    backgroundColor: isItemActive ? 'rgba(255,255,255,0.06)' : 'transparent',
                    transition: 'all 0.15s ease', position: 'relative',
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
                {activeIndicator}
                <span style={{ paddingLeft: isItemActive ? 4 : 0 }}>
                    {item.label}{badge}
                </span>
            </Link>
        </li>
    );
}

function MobileMenu({ menuTree, expandedItems, toggleExpand, textColor, primaryColor, borderColor, ctaText, ctaUrl, sidebarBg, setMobileOpen }: {
    menuTree: MenuItemWithChildren[];
    expandedItems: Set<number>;
    toggleExpand: (id: number) => void;
    textColor: string;
    primaryColor: string;
    borderColor: string;
    ctaText: string;
    ctaUrl: string;
    sidebarBg: string;
    setMobileOpen: (v: boolean) => void;
}) {
    return (
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
                                                            marginLeft: 6, display: 'inline-flex', alignItems: 'center',
                                                            padding: '1px 5px', borderRadius: 999,
                                                            backgroundColor: child.badge_color || primaryColor,
                                                            color: '#fff', fontSize: '0.6rem', fontWeight: 700,
                                                        }}>{child.badge_text}</span>
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
                                            marginLeft: 6, display: 'inline-flex', alignItems: 'center',
                                            padding: '1px 6px', borderRadius: 999,
                                            backgroundColor: item.badge_color || primaryColor,
                                            color: '#fff', fontSize: '0.625rem', fontWeight: 700,
                                        }}>{item.badge_text}</span>
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
    );
}

export default function Sidebar({ menu, customizations, siteName, favicon }: SidebarProps) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
    const isDesktop = useIsDesktop();

    const sidebarBg = c(customizations, 'sidebar.background_color', '#080808');
    const textColor = c(customizations, 'sidebar.text_color', '#a1a1aa');
    const activeColor = c(customizations, 'sidebar.active_color', '#ffffff');
    const borderColor = c(customizations, 'sidebar.border_color', 'rgba(255,255,255,0.06)');
    const logoUrl = c(customizations, 'sidebar.logo_url', '');
    const tagline = c(customizations, 'sidebar.tagline', 'Studio creatif');
    const showTagline = b(customizations, 'sidebar.show_tagline', true);
    const ctaText = c(customizations, 'sidebar.cta_text', 'Demarrer un projet');
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

    const sidebarContent = (
        <div style={{
            width: sidebarWidth, minWidth: sidebarWidth, height: '100vh',
            backgroundColor: sidebarBg, borderRight: `1px solid ${borderColor}`,
            display: 'flex', flexDirection: 'column',
            position: 'fixed', top: 0, left: 0, zIndex: 50, overflow: 'hidden',
        }}>
            <SidebarBrand
                logoUrl={logoUrl} siteName={siteName} favicon={favicon}
                primaryColor={primaryColor} showTagline={showTagline}
                tagline={tagline} textColor={textColor} borderColor={borderColor}
            />

            <nav style={{ flex: 1, padding: '20px 16px', overflowY: 'auto' }}>
                {menuTree.length > 0 && (
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {menuTree.map((item) => (
                            <DesktopNavItem
                                key={item.id} item={item} currentPath={currentPath}
                                textColor={textColor} activeColor={activeColor}
                                primaryColor={primaryColor} expandedItems={expandedItems}
                                toggleExpand={toggleExpand}
                            />
                        ))}
                    </ul>
                )}
            </nav>

            <div style={{ padding: '16px 20px 24px', borderTop: `1px solid ${borderColor}` }}>
                {ctaText && ctaUrl && (
                    <Link
                        href={ctaUrl}
                        style={{
                            display: 'block', width: '100%', textAlign: 'center',
                            padding: '10px 16px', borderRadius: 8,
                            backgroundColor: primaryColor, color: '#fff',
                            fontSize: '0.8125rem', fontWeight: 600, textDecoration: 'none',
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
            {isDesktop && (
                <div style={{ width: sidebarWidth, flexShrink: 0 }}>
                    {sidebarContent}
                </div>
            )}

            {!isDesktop && (
                <div
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
                        height: 56,
                        backgroundColor: scrolled ? sidebarBg + 'f0' : sidebarBg,
                        backdropFilter: scrolled ? 'blur(12px)' : 'none',
                        borderBottom: `1px solid ${borderColor}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '0 20px', transition: 'background-color 0.2s',
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
                <MobileMenu
                    menuTree={menuTree} expandedItems={expandedItems}
                    toggleExpand={toggleExpand} textColor={textColor}
                    primaryColor={primaryColor} borderColor={borderColor}
                    ctaText={ctaText} ctaUrl={ctaUrl}
                    sidebarBg={sidebarBg} setMobileOpen={setMobileOpen}
                />
            )}
        </>
    );
}
