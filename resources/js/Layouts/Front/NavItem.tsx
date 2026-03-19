import { Link } from '@inertiajs/react';
import { useRef, useState } from 'react';
import { getMenuItemUrl } from './theme-helpers';
import type { NavItemProps, NavItemWithDropdownProps } from './header-types';

// ─── Nav Item ───────────────────────────────────────────────────────────────

export function NavItem({ item, style: styleVariant, textColor, accentColor }: NavItemProps) {
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

export function NavItemWithDropdown({ item, children, style: styleVariant, textColor, accentColor, isDark }: NavItemWithDropdownProps) {
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
