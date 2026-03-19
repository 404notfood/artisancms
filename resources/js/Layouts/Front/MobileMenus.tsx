import { Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { getMenuItemUrl } from './theme-helpers';
import { MobileUserLinks } from './MobileUserLinks';
import type { MobileMenuCommonProps } from './header-types';

// ─── Mobile Menu: Hamburger (dropdown) ──────────────────────────────────────

export function MobileMenuHamburger({ menuTree, textColor, bgColor, isDark, primaryColor, ctaText, ctaUrl, ctaBtnStyle, onClose }: MobileMenuCommonProps) {
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
                <MobileUserLinks textColor={textColor} isDark={isDark} onClose={onClose} />
            </nav>
        </div>
    );
}

// ─── Mobile Menu: Slide (side panel) ────────────────────────────────────────

export function MobileMenuSlide({ menuTree, textColor, bgColor, isDark, primaryColor, ctaText, ctaUrl, ctaBtnStyle, onClose, siteName }: MobileMenuCommonProps) {
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
                    <div className="px-3">
                        <MobileUserLinks textColor={textColor} isDark={isDark} onClose={onClose} />
                    </div>
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

export function MobileMenuFullscreen({ menuTree, textColor, bgColor, isDark, primaryColor, ctaText, ctaUrl, ctaBtnStyle, onClose, siteName }: MobileMenuCommonProps) {
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
                <div className="px-6">
                    <MobileUserLinks textColor={textColor} isDark={isDark} onClose={onClose} />
                </div>
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
