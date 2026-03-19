import { Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import type { MenuData } from '@/types/cms';
import { c, b, buildMenuTree, resolveThemeStyle, type ThemeStyle, type MenuItemWithChildren } from './theme-helpers';
import type { HeaderVariant, MobileMenuStyle } from './header-types';
import { NavItem, NavItemWithDropdown } from './NavItem';
import { HamburgerIcon, UserMenu } from './HeaderWidgets';
import { MobileMenuHamburger, MobileMenuSlide, MobileMenuFullscreen } from './MobileMenus';

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

    // ─── Accent Line ────────────────────────────────────────────────────────
    const AccentLine = () => accentLine ? (
        <div style={{ height: '2px', background: `linear-gradient(90deg, transparent, ${primaryColor}, transparent)` }} />
    ) : null;

    // ─── CTA + User + Mobile Toggle (shared across variants) ────────────────
    const ActionGroup = ({ alwaysHamburger = false }: { alwaysHamburger?: boolean }) => (
        <div className="flex items-center gap-3">
            {ctaText && ctaUrl && (
                <Link href={ctaUrl} className="hidden md:inline-flex items-center transition-all" style={ctaBtnStyle}>
                    {ctaText}
                </Link>
            )}
            <div className="hidden md:block">
                <UserMenu textColor={textColor} isDark={isDark} primaryColor={primaryColor} />
            </div>
            {alwaysHamburger ? (
                <button
                    type="button"
                    className="p-2 rounded-md"
                    style={{ color: textColor }}
                    onClick={() => setMobileOpen(!mobileOpen)}
                    aria-label="Menu"
                >
                    <HamburgerIcon open={mobileMenuStyle === 'hamburger' && mobileOpen} color={textColor} />
                </button>
            ) : (
                <MobileToggle />
            )}
        </div>
    );

    // ─── Variant: Centered ──────────────────────────────────────────────────
    if (headerVariant === 'centered') {
        return (
            <header className={headerClasses} style={headerStyleObj}>
                <AccentLine />
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
                        <div className="hidden md:block">
                            <UserMenu textColor={textColor} isDark={isDark} primaryColor={primaryColor} />
                        </div>
                        <MobileToggle />
                    </div>
                </div>
                {renderMobileMenu()}
            </header>
        );
    }

    // ─── Variant: Split ─────────────────────────────────────────────────────
    if (headerVariant === 'split') {
        return (
            <header className={headerClasses} style={headerStyleObj}>
                <AccentLine />
                <div className="container flex items-center justify-between h-full">
                    <nav className={`hidden md:flex items-center flex-1 ${isLuxury ? 'gap-8' : 'gap-6'} justify-end pr-8`}>
                        {renderNavItems(leftMenu)}
                    </nav>
                    <LogoComponent />
                    <nav className={`hidden md:flex items-center flex-1 ${isLuxury ? 'gap-8' : 'gap-6'} justify-start pl-8`}>
                        {renderNavItems(rightMenu)}
                        {ctaText && ctaUrl && (
                            <Link href={ctaUrl} className="inline-flex items-center transition-all ml-auto" style={ctaBtnStyle}>
                                {ctaText}
                            </Link>
                        )}
                        <div className="ml-2">
                            <UserMenu textColor={textColor} isDark={isDark} primaryColor={primaryColor} />
                        </div>
                    </nav>
                    <MobileToggle />
                </div>
                {renderMobileMenu()}
            </header>
        );
    }

    // ─── Variant: Stacked ───────────────────────────────────────────────────
    if (headerVariant === 'stacked') {
        return (
            <header className={headerClasses} style={headerStyleObj}>
                <AccentLine />
                <div className="container flex items-center justify-between py-4">
                    <LogoComponent />
                    <ActionGroup />
                </div>
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

    // ─── Variant: Minimal ───────────────────────────────────────────────────
    if (headerVariant === 'minimal') {
        return (
            <header className={headerClasses} style={headerStyleObj}>
                <AccentLine />
                <div className="container flex items-center justify-between h-full">
                    <LogoComponent />
                    <ActionGroup alwaysHamburger />
                </div>
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
                    return <MobileMenuSlide {...commonProps} />;
                })()}
            </header>
        );
    }

    // ─── Variant: Classic (default) ─────────────────────────────────────────
    return (
        <header className={headerClasses} style={headerStyleObj}>
            <AccentLine />
            <div className="container flex h-full items-center justify-between">
                <LogoComponent />
                <div className={`hidden flex-1 items-center gap-6 px-8 md:flex ${alignmentClass}`}>
                    {menuTree.length > 0 && (
                        <nav className={`flex items-center ${isLuxury ? 'gap-8' : 'gap-6'}`}>
                            {renderNavItems(menuTree)}
                        </nav>
                    )}
                </div>
                <ActionGroup />
            </div>
            {renderMobileMenu()}
        </header>
    );
}
