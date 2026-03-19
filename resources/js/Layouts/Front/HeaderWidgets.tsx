import { Link, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import type { HamburgerIconProps, UserMenuProps } from './header-types';

// ─── Hamburger Icon (animated) ──────────────────────────────────────────────

export function HamburgerIcon({ open, color }: HamburgerIconProps) {
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

// ─── User Menu (dropdown) ────────────────────────────────────────────────────

export function UserMenu({ textColor, isDark, primaryColor }: UserMenuProps) {
    const { auth } = usePage().props as { auth?: { user?: { id: number; name: string; email: string; avatar_url?: string | null } }; [key: string]: unknown };
    const user = auth?.user;
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    if (!user) {
        return (
            <Link
                href="/login"
                className="text-sm font-medium transition-colors hover:text-[var(--color-primary)]"
                style={{ color: textColor }}
            >
                Connexion
            </Link>
        );
    }

    const initials = user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const dropdownBg = isDark ? '#1e1e2e' : '#ffffff';
    const dropdownBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)';
    const hoverBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)';

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 rounded-full transition-colors"
                style={{ color: textColor }}
            >
                {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.name} className="h-8 w-8 rounded-full object-cover ring-1 ring-gray-200" />
                ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
                        style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)', color: textColor }}>
                        {initials}
                    </div>
                )}
            </button>

            {open && (
                <div
                    className="absolute right-0 top-full mt-2 w-48 rounded-lg py-1 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                    style={{ backgroundColor: dropdownBg, border: `1px solid ${dropdownBorder}` }}
                >
                    <div className="px-4 py-2 border-b" style={{ borderColor: dropdownBorder }}>
                        <p className="text-sm font-medium truncate" style={{ color: textColor }}>{user.name}</p>
                        <p className="text-xs truncate" style={{ color: textColor, opacity: 0.6 }}>{user.email}</p>
                    </div>
                    {[
                        { href: `/members/${user.id}`, label: 'Mon profil' },
                        { href: '/admin/account', label: 'Mon compte' },
                    ].map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="block px-4 py-2 text-sm transition-colors"
                            style={{ color: textColor }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = hoverBg; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
                            onClick={() => setOpen(false)}
                        >
                            {item.label}
                        </Link>
                    ))}
                    <div style={{ borderTop: `1px solid ${dropdownBorder}` }}>
                        <Link
                            href="/logout"
                            method="post"
                            as="button"
                            className="block w-full px-4 py-2 text-left text-sm transition-colors"
                            style={{ color: isDark ? '#f87171' : '#dc2626' }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = hoverBg; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
                        >
                            D&eacute;connexion
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
