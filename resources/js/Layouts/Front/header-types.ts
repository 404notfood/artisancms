import type { MenuItemData } from '@/types/cms';
import type { MenuItemWithChildren } from './theme-helpers';

// ─── Header Types ────────────────────────────────────────────────────────────

export type HeaderVariant = 'classic' | 'centered' | 'split' | 'minimal' | 'stacked';
export type MobileMenuStyle = 'hamburger' | 'slide' | 'fullscreen';

// ─── Shared Props ────────────────────────────────────────────────────────────

export interface NavItemProps {
    item: MenuItemData;
    style?: string;
    textColor?: string;
    accentColor?: string;
}

export interface NavItemWithDropdownProps {
    item: MenuItemData;
    children: MenuItemData[];
    style?: string;
    textColor?: string;
    accentColor?: string;
    isDark?: boolean;
}

export interface MobileUserLinksProps {
    textColor: string;
    isDark: boolean;
    onClose: () => void;
}

export interface MobileMenuCommonProps {
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
}

export interface UserMenuProps {
    textColor: string;
    isDark: boolean;
    primaryColor: string;
}

export interface HamburgerIconProps {
    open: boolean;
    color: string;
}
