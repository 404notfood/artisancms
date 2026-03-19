import { Head, usePage } from '@inertiajs/react';
import { useMemo, type ReactNode } from 'react';
import { AnnouncementBar } from '@/Components/front/announcement-bar';
import { AnimationConfigContext, type AnimationConfigMap } from '@/Components/front/block-renderer';
import FrontHeader from './Front/FrontHeader';
import FrontFooter from './Front/FrontFooter';
import { c, buildCssVariables, getGoogleFontsUrl, type ThemeStyle } from './Front/theme-helpers';
import type { MenuData } from '@/types/cms';

interface FrontLayoutProps {
    children: ReactNode;
    menus: Record<string, MenuData>;
    theme: {
        customizations: Record<string, string | boolean>;
        layouts: Array<{ slug: string; name: string }>;
        style?: ThemeStyle;
    };
}

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
    const themeStyle = theme.style;
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

    const allVars: Record<string, string> = { ...cssVariables };
    // Use serif fallback for known serif fonts, sans-serif otherwise
    const serifFonts = ['Cormorant Garamond', 'Lora', 'Playfair Display', 'Merriweather', 'Libre Baskerville', 'Crimson Text', 'EB Garamond', 'Noto Serif', 'Source Serif Pro', 'Bitter'];
    if (fontBody) allVars['--font-body'] = `'${fontBody}', system-ui, sans-serif`;
    if (fontHeading) {
        const isSerif = serifFonts.some(sf => fontHeading.toLowerCase().includes(sf.toLowerCase()));
        allVars['--font-heading'] = isSerif
            ? `'${fontHeading}', Georgia, serif`
            : `'${fontHeading}', system-ui, sans-serif`;
    }

    const cssVarBlock = Object.entries(allVars)
        .map(([k, v]) => `${k}:${v}`)
        .join(';');
    const themeStyleTag = `.artisan-theme{${cssVarBlock}}`;

    const rootStyle: React.CSSProperties = {
        backgroundColor: bgColor,
        color: textColor,
        fontFamily: fontBody ? 'var(--font-body)' : undefined,
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
                <FrontHeader
                    menu={menus.header}
                    customizations={customizations}
                    brandingLogo={branding?.logo}
                    themeStyle={themeStyle}
                />
                <div className="flex-1">{children}</div>
                <FrontFooter
                    menu={menus.footer}
                    customizations={customizations}
                    themeStyle={themeStyle}
                />
                {announcement && announcement.position === 'bottom' && (
                    <AnnouncementBar announcement={announcement} />
                )}
            </div>
        </AnimationConfigContext.Provider>
    );
}
