import { Link, usePage } from '@inertiajs/react';
import type { MenuData, MenuItemData } from '@/types/cms';
import SocialIcon from './SocialIcon';
import { c, b, getMenuItemUrl, buildMenuTree, resolveThemeStyle, type ThemeStyle, type MenuItemWithChildren } from './theme-helpers';

// ─── Types ──────────────────────────────────────────────────────────────────

type FooterLayout = 'simple' | 'columns' | 'minimal' | 'centered' | 'magazine';

// ─── Internal NavItem ───────────────────────────────────────────────────────

function NavItem({ item, style: styleVariant, textColor, accentColor }: {
    item: MenuItemData;
    style?: string;
    textColor?: string;
    accentColor?: string;
}) {
    const url = getMenuItemUrl(item);
    const isExternal = url.startsWith('http');

    const className = styleVariant === 'luxury'
        ? `text-sm tracking-widest uppercase font-light transition-colors hover:text-[var(--color-primary)] ${item.css_class || ''}`
        : styleVariant === 'dark'
            ? `text-sm font-medium transition-all hover:text-[var(--color-primary)] hover:drop-shadow-[0_0_8px_var(--color-primary)] ${item.css_class || ''}`
            : `text-sm font-medium transition-colors hover:text-[var(--color-primary)] ${item.css_class || ''}`;

    const props = {
        style: textColor ? { color: textColor } : undefined,
        className,
        ...(isExternal ? { target: item.target || '_self' } : {}),
    };

    return isExternal
        ? <a href={url} {...props}>{item.label}</a>
        : <Link href={url} {...props}>{item.label}</Link>;
}

// ─── Footer ─────────────────────────────────────────────────────────────────

interface FooterProps {
    menu?: MenuData;
    customizations: Record<string, string | boolean>;
    themeStyle?: ThemeStyle;
}

const SOCIAL_PLATFORMS = ['facebook', 'twitter', 'instagram', 'linkedin', 'github', 'youtube', 'tiktok', 'dribbble'];

export default function FrontFooter({ menu, customizations, themeStyle }: FooterProps) {
    const { cms } = usePage().props as { cms?: { name: string }; [key: string]: unknown };
    const siteName = cms?.name || 'ArtisanCMS';
    const year = new Date().getFullYear();

    const bgColor = c(customizations, 'footer.background_color', '#f8fafc');
    const textColor = c(customizations, 'footer.text_color', '#64748b');
    const accentColor = c(customizations, 'footer.accent_color', c(customizations, 'colors.primary', '#6366f1'));
    const tagline = c(customizations, 'footer.tagline', '');
    const showPoweredBy = b(customizations, 'footer.show_powered_by', true);
    const showSocialLinks = b(customizations, 'footer.show_social_links', false);
    const footerLayout = c(customizations, 'footer.layout', '') as FooterLayout;
    const footerColumns = parseInt(c(customizations, 'footer.columns', '3'), 10);
    const showNewsletter = b(customizations, 'footer.show_newsletter_footer', false);

    const style = resolveThemeStyle(customizations, themeStyle);
    const isDark = style === 'dark';
    const isLuxury = style === 'luxury';
    const isNature = style === 'nature';

    const copyrightText = c(customizations, 'footer.copyright_text', `\u00A9 {year} {site_name}.`)
        .replace('{year}', String(year))
        .replace('{site_name}', siteName);

    const borderStyle = isDark
        ? '1px solid rgba(255,255,255,0.06)'
        : '1px solid rgba(0,0,0,0.06)';

    const menuTree = buildMenuTree(menu?.items ?? []);

    const socialLinks = showSocialLinks ? (
        <div className="flex justify-center gap-4">
            {SOCIAL_PLATFORMS.map((p) => {
                const url = c(customizations, `footer.social_${p}`);
                return url ? <SocialIcon key={p} platform={p} url={url} color={accentColor} /> : null;
            })}
        </div>
    ) : null;

    // ─── Powered By ─────────────────────────────────────────────────────
    const PoweredBy = () =>
        showPoweredBy ? (
            <p className={`mt-2 text-center text-xs ${isDark ? 'opacity-30' : 'opacity-40'}`}>Propuls&eacute; par ArtisanCMS</p>
        ) : null;

    // ─── Newsletter section ─────────────────────────────────────────────
    const NewsletterSection = () =>
        showNewsletter ? (
            <div className="flex flex-col items-center gap-3 mb-8">
                <p className="text-sm font-medium" style={{ color: textColor, opacity: 0.8 }}>
                    Restez inform&eacute;
                </p>
                <form className="flex gap-2 w-full max-w-sm" onSubmit={(e) => e.preventDefault()}>
                    <input
                        type="email"
                        placeholder="Votre email"
                        className="flex-1 rounded-md border px-3 py-2 text-sm outline-none transition-colors focus:ring-2"
                        style={{
                            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
                            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                            color: textColor,
                        }}
                    />
                    <button
                        type="submit"
                        className="rounded-md px-4 py-2 text-sm font-medium transition-colors"
                        style={{ backgroundColor: accentColor, color: '#fff' }}
                    >
                        OK
                    </button>
                </form>
            </div>
        ) : null;

    // ─── Determine which layout to use ──────────────────────────────────
    // Priority: explicit footerLayout > theme style > default
    const resolvedLayout = footerLayout || (isLuxury ? 'centered' : isDark ? 'columns' : 'simple');

    // ─── Layout: Centered (luxury style) ────────────────────────────────

    if (resolvedLayout === 'centered') {
        return (
            <footer style={{ backgroundColor: bgColor, color: textColor, borderTop: borderStyle }}>
                <div className="container py-16">
                    {tagline && (
                        <p className="text-center mb-8 text-sm tracking-widest uppercase opacity-60" style={{ fontFamily: 'var(--font-heading)' }}>
                            {tagline}
                        </p>
                    )}

                    <NewsletterSection />

                    {menuTree.length > 0 && (
                        <nav className="flex flex-wrap justify-center gap-8 mb-10">
                            {menuTree.map((item) => (
                                <div key={item.id} className="text-center">
                                    <NavItem item={item} style={isLuxury ? 'luxury' : isDark ? 'dark' : undefined} textColor={textColor} accentColor={accentColor} />
                                    {item.children.length > 0 && (
                                        <div className="mt-2 flex flex-col gap-1">
                                            {item.children.map((child) => (
                                                <NavItem key={child.id} item={child} style={isLuxury ? 'luxury' : isDark ? 'dark' : undefined} textColor={textColor} accentColor={accentColor} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </nav>
                    )}

                    <div style={{ height: '1px', background: `linear-gradient(90deg, transparent, ${accentColor}60, transparent)`, margin: '0 auto 2rem', maxWidth: '200px' }} />

                    {socialLinks && <div className="mb-8">{socialLinks}</div>}

                    <p className="text-center text-xs tracking-widest uppercase opacity-50">{copyrightText}</p>
                    <PoweredBy />
                </div>
            </footer>
        );
    }

    // ─── Layout: Columns (dark style with multi-columns) ────────────────

    if (resolvedLayout === 'columns') {
        // Group menu items for columns display
        const columnItems = menuTree.length > 0 ? menuTree : [];
        const gridCols = Math.min(columnItems.length || 1, footerColumns);

        return (
            <footer style={{ backgroundColor: bgColor, color: textColor, borderTop: borderStyle }}>
                <div className="container py-12">
                    <div className={`grid gap-8 ${gridCols === 2 ? 'md:grid-cols-2' : gridCols === 4 ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
                        {/* Branding column */}
                        <div className="col-span-1">
                            <Link href="/" className="hover:opacity-80 transition-opacity">
                                <span style={{
                                    fontFamily: 'var(--font-heading)',
                                    fontSize: '1.125rem',
                                    fontWeight: isDark ? 800 : 600,
                                    letterSpacing: isDark ? '-0.02em' : '0',
                                    color: isDark ? '#fff' : textColor,
                                }}>
                                    {siteName}
                                </span>
                            </Link>
                            {tagline && (
                                <p className="mt-3 text-sm opacity-60 max-w-xs">{tagline}</p>
                            )}
                            {socialLinks && <div className="mt-4">{socialLinks}</div>}
                        </div>

                        {/* Menu columns */}
                        {columnItems.map((item) => (
                            <div key={item.id}>
                                {/* Column heading */}
                                <span className={`text-sm font-semibold mb-3 block ${isDark ? 'text-white/80' : ''}`}
                                    style={{ color: isDark ? undefined : textColor, opacity: isDark ? undefined : 0.9 }}>
                                    {item.label}
                                </span>
                                {item.children.length > 0 ? (
                                    <div className="flex flex-col gap-2">
                                        {item.children.map((child) => (
                                            <NavItem key={child.id} item={child} style={isDark ? 'dark' : undefined} textColor={textColor} accentColor={accentColor} />
                                        ))}
                                    </div>
                                ) : (
                                    <NavItem item={item} style={isDark ? 'dark' : undefined} textColor={textColor} accentColor={accentColor} />
                                )}
                            </div>
                        ))}
                    </div>

                    <NewsletterSection />

                    <div style={{ height: '1px', backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', margin: '2.5rem 0' }} />

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs opacity-40">
                        <p>{copyrightText}</p>
                        <PoweredBy />
                    </div>
                </div>
            </footer>
        );
    }

    // ─── Layout: Minimal (just copyright + social, very small) ──────────

    if (resolvedLayout === 'minimal') {
        return (
            <footer style={{ backgroundColor: bgColor, color: textColor, borderTop: borderStyle }}>
                <div className="container py-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-sm opacity-60">{copyrightText}</p>

                        <div className="flex items-center gap-6">
                            {menuTree.length > 0 && (
                                <nav className="flex flex-wrap gap-4">
                                    {menuTree.map((item) => (
                                        <NavItem key={item.id} item={item} textColor={textColor} accentColor={accentColor} />
                                    ))}
                                </nav>
                            )}
                            {socialLinks}
                        </div>
                    </div>
                    <PoweredBy />
                </div>
            </footer>
        );
    }

    // ─── Layout: Magazine (editorial style with sections) ───────────────

    if (resolvedLayout === 'magazine') {
        return (
            <footer style={{ backgroundColor: bgColor, color: textColor, borderTop: borderStyle }}>
                <div className="container py-14">
                    {/* Top section: branding + newsletter */}
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-10">
                        <div>
                            <Link href="/" className="hover:opacity-80 transition-opacity">
                                <span style={{
                                    fontFamily: 'var(--font-heading)',
                                    fontSize: '1.5rem',
                                    fontWeight: 700,
                                    color: isDark ? '#fff' : textColor,
                                }}>
                                    {siteName}
                                </span>
                            </Link>
                            {tagline && (
                                <p className="mt-2 text-sm opacity-50 max-w-md italic" style={{ fontFamily: 'var(--font-heading)' }}>
                                    {tagline}
                                </p>
                            )}
                        </div>
                        <NewsletterSection />
                    </div>

                    {/* Middle section: nav links in a row */}
                    {menuTree.length > 0 && (
                        <div className="border-y py-6 mb-8" style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
                            <nav className="flex flex-wrap justify-center gap-8">
                                {menuTree.map((item) => (
                                    <div key={item.id}>
                                        <span className="text-xs font-bold uppercase tracking-wider mb-2 block opacity-50" style={{ color: textColor }}>
                                            {item.label}
                                        </span>
                                        {item.children.length > 0 && (
                                            <div className="flex flex-col gap-1.5">
                                                {item.children.map((child) => (
                                                    <NavItem key={child.id} item={child} textColor={textColor} accentColor={accentColor} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </nav>
                        </div>
                    )}

                    {/* Bottom section */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-xs opacity-50">{copyrightText}</p>
                        {socialLinks}
                        <PoweredBy />
                    </div>
                </div>
            </footer>
        );
    }

    // ─── Layout: Simple (default - nature/standard) ─────────────────────

    return (
        <footer style={{ backgroundColor: bgColor, color: textColor, borderTop: borderStyle }}>
            <div className="container py-10">
                {tagline && (
                    <p className={`text-center mb-6 text-sm opacity-70 ${isNature ? 'italic' : ''}`} style={{ fontFamily: 'var(--font-heading)' }}>
                        {tagline}
                    </p>
                )}

                <NewsletterSection />

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

                {socialLinks && <div className="mb-6">{socialLinks}</div>}

                <p className="text-center text-sm opacity-70">{copyrightText}</p>
                <PoweredBy />
            </div>
        </footer>
    );
}
