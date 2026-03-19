import { Head, Link } from '@inertiajs/react';
import type { MenuData } from '@/types/cms';
import FrontLayout from '@/Layouts/FrontLayout';
import type { ThemeStyle } from '@/Layouts/Front/theme-helpers';

interface ProfileData {
    display_name: string;
    avatar: string | null;
    profile_completion: number;
    last_active_at: string | null;
}

interface ActivityItem {
    id: number;
    type: string;
    description: string;
    created_at: string;
}

interface Modules {
    member_directory: boolean;
    content_restriction: boolean;
    custom_fields: boolean;
    social_login: boolean;
    two_factor: boolean;
    membership_plans: boolean;
    user_verification: boolean;
}

interface DashboardProps {
    menus: Record<string, MenuData>;
    theme: {
        customizations: Record<string, string | boolean>;
        layouts: Array<{ slug: string; name: string }>;
        style?: ThemeStyle;
    };
    user: { id: number; name: string; email: string };
    profile: ProfileData;
    recentActivity: ActivityItem[];
    modules: Modules;
}

export default function Dashboard({ menus, theme, user, profile, recentActivity, modules }: DashboardProps) {
    const avatarUrl = profile.avatar ? `/storage/${profile.avatar}` : null;
    const displayName = profile.display_name || user.name;

    const navLinks = [
        { href: '/members/account', label: 'Dashboard', icon: DashboardIcon, active: true },
        { href: '/members/account/edit-profile', label: 'Mon profil', icon: UserIcon },
        { href: '/members/account/security', label: 'Securite', icon: ShieldIcon, show: modules.two_factor },
        { href: '/members/account/social', label: 'Comptes sociaux', icon: LinkIcon, show: modules.social_login },
        { href: '/members/account/membership', label: 'Abonnement', icon: StarIcon, show: modules.membership_plans },
    ].filter(l => l.show !== false);

    return (
        <FrontLayout menus={menus} theme={theme}>
            <Head title="Mon espace membre" />

            {/* Hero section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[var(--color-primary,#6366f1)] via-[var(--color-primary,#6366f1)]/90 to-[var(--color-primary,#6366f1)]/70">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
                </div>
                <div className="relative mx-auto max-w-6xl px-4 py-12">
                    <div className="flex items-center gap-5">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt={displayName} className="h-16 w-16 rounded-full object-cover ring-4 ring-white/30 shadow-lg" />
                        ) : (
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-2xl font-bold text-white ring-4 ring-white/30 shadow-lg backdrop-blur-sm">
                                {displayName.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div>
                            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                                Bonjour, {user.name}
                            </h1>
                            <p className="text-sm text-white/70">{user.email}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-6xl px-4 py-8">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                            {/* Profile completion */}
                            <div className="mb-6">
                                <div className="flex items-center justify-between text-sm mb-2">
                                    <span className="font-medium text-gray-700">Profil complet</span>
                                    <span className="font-bold text-[var(--color-primary,#6366f1)]">{profile.profile_completion}%</span>
                                </div>
                                <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                                    <div
                                        className="h-full rounded-full bg-[var(--color-primary,#6366f1)] transition-all duration-500"
                                        style={{ width: `${profile.profile_completion}%` }}
                                    />
                                </div>
                                {profile.profile_completion < 100 && (
                                    <p className="mt-2 text-xs text-gray-500">
                                        Completez votre profil pour gagner en visibilite !
                                    </p>
                                )}
                            </div>

                            {/* Nav */}
                            <nav className="space-y-1">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 ${
                                            link.active
                                                ? 'bg-[var(--color-primary,#6366f1)]/8 font-semibold text-[var(--color-primary,#6366f1)] shadow-sm'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                    >
                                        <link.icon active={link.active} />
                                        {link.label}
                                    </Link>
                                ))}
                            </nav>
                        </div>
                    </div>

                    {/* Main content */}
                    <div className="space-y-6 lg:col-span-3">
                        {/* Quick actions */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <QuickLink
                                href="/members/account/edit-profile"
                                label="Modifier mon profil"
                                description="Mettre a jour vos informations"
                                icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>}
                            />
                            <QuickLink
                                href={`/members/${user.id}`}
                                label="Voir mon profil"
                                description="Profil public"
                                icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                            />
                            {modules.member_directory && (
                                <QuickLink
                                    href="/members"
                                    label="Annuaire"
                                    description="Decouvrir les membres"
                                    icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>}
                                />
                            )}
                        </div>

                        {/* Activity */}
                        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
                            <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary,#6366f1)]/10">
                                    <svg className="h-4 w-4 text-[var(--color-primary,#6366f1)]" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h2 className="text-lg font-semibold text-gray-900">Activite recente</h2>
                            </div>
                            {recentActivity.length === 0 ? (
                                <div className="px-6 py-12 text-center">
                                    <svg className="mx-auto h-12 w-12 text-gray-200" fill="none" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="mt-3 text-sm text-gray-500">Aucune activite recente.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {recentActivity.map((activity) => (
                                        <div key={activity.id} className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-gray-50/50">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary,#6366f1)]/8 flex-shrink-0">
                                                <div className="h-2 w-2 rounded-full bg-[var(--color-primary,#6366f1)]" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-gray-700">{activity.description}</p>
                                            </div>
                                            <span className="flex-shrink-0 text-xs font-medium text-gray-400">
                                                {new Date(activity.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </FrontLayout>
    );
}

function QuickLink({ href, label, description, icon }: { href: string; label: string; description: string; icon: React.ReactNode }) {
    return (
        <Link
            href={href}
            className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
        >
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-primary,#6366f1)]/10 text-[var(--color-primary,#6366f1)] transition-transform duration-300 group-hover:scale-110">
                {icon}
            </div>
            <h3 className="font-semibold text-gray-900 group-hover:text-[var(--color-primary,#6366f1)] transition-colors">{label}</h3>
            <p className="mt-1 text-sm text-gray-500">{description}</p>
            <svg className="absolute right-4 top-4 h-5 w-5 text-gray-300 transition-all duration-300 group-hover:text-[var(--color-primary,#6366f1)] group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
        </Link>
    );
}

// Navigation icons
function DashboardIcon({ active }: { active?: boolean }) {
    return (
        <svg className={`h-4 w-4 ${active ? 'text-[var(--color-primary,#6366f1)]' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        </svg>
    );
}

function UserIcon({ active }: { active?: boolean }) {
    return (
        <svg className={`h-4 w-4 ${active ? 'text-[var(--color-primary,#6366f1)]' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
    );
}

function ShieldIcon({ active }: { active?: boolean }) {
    return (
        <svg className={`h-4 w-4 ${active ? 'text-[var(--color-primary,#6366f1)]' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
    );
}

function LinkIcon({ active }: { active?: boolean }) {
    return (
        <svg className={`h-4 w-4 ${active ? 'text-[var(--color-primary,#6366f1)]' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
        </svg>
    );
}

function StarIcon({ active }: { active?: boolean }) {
    return (
        <svg className={`h-4 w-4 ${active ? 'text-[var(--color-primary,#6366f1)]' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
    );
}
