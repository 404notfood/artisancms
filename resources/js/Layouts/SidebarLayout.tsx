import { Head, usePage } from '@inertiajs/react';
import type { MenuData } from '@/types/cms';
import { useMemo, type ReactNode } from 'react';
import { AnimationConfigContext, type AnimationConfigMap } from '@/Components/front/block-renderer';
import { c, buildCssVariables, getGoogleFontsUrl } from './Front/theme-helpers';
import Sidebar, { useIsDesktop } from './components/SidebarNav';

interface SidebarLayoutProps {
    children: ReactNode;
    menus: Record<string, MenuData>;
    theme: {
        customizations: Record<string, string | boolean>;
        layouts: Array<{ slug: string; name: string }>;
    };
}

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

                    <main
                        className="studio-content lg:ml-0"
                        style={{ flex: 1, minWidth: 0 }}
                    >
                        {!isDesktop && <div style={{ height: 56 }} />}
                        {children}
                    </main>
                </div>
            </div>
        </AnimationConfigContext.Provider>
    );
}
