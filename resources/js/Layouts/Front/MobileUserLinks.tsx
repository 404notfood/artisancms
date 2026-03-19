import { Link, usePage } from '@inertiajs/react';
import type { MobileUserLinksProps } from './header-types';

// ─── Mobile User Links ──────────────────────────────────────────────────────

export function MobileUserLinks({ textColor, isDark, onClose }: MobileUserLinksProps) {
    const { auth } = usePage().props as { auth?: { user?: { id: number; name: string; email: string; avatar_url?: string | null } }; [key: string]: unknown };
    const user = auth?.user;

    const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

    if (!user) {
        return (
            <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${borderColor}` }}>
                <Link
                    href="/login"
                    className="block px-3 py-2.5 rounded-md text-sm font-medium transition-colors"
                    style={{ color: textColor }}
                    onClick={onClose}
                >
                    Connexion
                </Link>
            </div>
        );
    }

    return (
        <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${borderColor}` }}>
            <div className="flex items-center gap-3 px-3 py-2 mb-1">
                {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.name} className="h-8 w-8 rounded-full object-cover" />
                ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
                        style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)', color: textColor }}>
                        {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                )}
                <span className="text-sm font-medium" style={{ color: textColor }}>{user.name}</span>
            </div>
            {[
                { href: `/members/${user.id}`, label: 'Mon profil' },
                { href: '/admin/account', label: 'Mon compte' },
            ].map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    className="block px-3 py-2 rounded-md text-sm transition-colors"
                    style={{ color: textColor, opacity: 0.75 }}
                    onClick={onClose}
                >
                    {item.label}
                </Link>
            ))}
            <Link
                href="/logout"
                method="post"
                as="button"
                className="block w-full px-3 py-2 rounded-md text-left text-sm transition-colors"
                style={{ color: isDark ? '#f87171' : '#dc2626' }}
                onClick={onClose}
            >
                D&eacute;connexion
            </Link>
        </div>
    );
}
