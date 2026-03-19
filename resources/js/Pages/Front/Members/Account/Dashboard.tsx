import { Head, Link, usePage } from '@inertiajs/react';

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
    user: { id: number; name: string; email: string };
    profile: ProfileData;
    recentActivity: ActivityItem[];
    modules: Modules;
}

export default function Dashboard({ user, profile, recentActivity, modules }: DashboardProps) {
    const avatarUrl = profile.avatar ? `/storage/${profile.avatar}` : null;
    const displayName = profile.display_name || user.name;

    const navLinks = [
        { href: '/members/account', label: 'Dashboard', active: true },
        { href: '/members/account/edit-profile', label: 'Mon profil' },
        { href: '/members/account/security', label: 'Securite', show: modules.two_factor },
        { href: '/members/account/social', label: 'Comptes sociaux', show: modules.social_login },
        { href: '/members/account/membership', label: 'Abonnement', show: modules.membership_plans },
    ].filter(l => l.show !== false);

    return (
        <>
            <Head title="Mon espace membre" />

            <div className="mx-auto max-w-6xl px-4 py-8">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="rounded-xl border border-gray-200 bg-white p-6">
                            <div className="mb-4 flex flex-col items-center">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt={displayName} className="h-20 w-20 rounded-full object-cover" />
                                ) : (
                                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100 text-2xl font-bold text-indigo-600">
                                        {displayName.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <h2 className="mt-3 text-lg font-semibold text-gray-900">{displayName}</h2>
                                <p className="text-sm text-gray-500">{user.email}</p>
                            </div>

                            {/* Completion */}
                            <div className="mb-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">Profil complet</span>
                                    <span className="font-medium text-indigo-600">{profile.profile_completion}%</span>
                                </div>
                                <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-200">
                                    <div
                                        className="h-full rounded-full bg-indigo-600 transition-all"
                                        style={{ width: `${profile.profile_completion}%` }}
                                    />
                                </div>
                            </div>

                            {/* Nav */}
                            <nav className="space-y-1">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                                            link.active
                                                ? 'bg-indigo-50 font-medium text-indigo-700'
                                                : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </nav>
                        </div>
                    </div>

                    {/* Main content */}
                    <div className="space-y-6 lg:col-span-3">
                        <h1 className="text-2xl font-bold text-gray-900">Bonjour, {user.name}</h1>

                        {/* Quick actions */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <QuickLink href="/members/account/edit-profile" label="Modifier mon profil" description="Mettre a jour vos informations" />
                            <QuickLink href={`/members/${user.id}`} label="Voir mon profil" description="Profil public" />
                            {modules.member_directory && (
                                <QuickLink href="/members" label="Annuaire" description="Decouvrir les membres" />
                            )}
                        </div>

                        {/* Activity */}
                        <div className="rounded-xl border border-gray-200 bg-white">
                            <div className="border-b border-gray-200 px-6 py-4">
                                <h2 className="text-lg font-semibold text-gray-900">Activite recente</h2>
                            </div>
                            {recentActivity.length === 0 ? (
                                <div className="px-6 py-8 text-center text-gray-500">
                                    Aucune activite recente.
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {recentActivity.map((activity) => (
                                        <div key={activity.id} className="flex items-center gap-3 px-6 py-3">
                                            <div className="h-2 w-2 rounded-full bg-indigo-400" />
                                            <div className="flex-1">
                                                <p className="text-sm text-gray-700">{activity.description}</p>
                                            </div>
                                            <span className="text-xs text-gray-400">
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
        </>
    );
}

function QuickLink({ href, label, description }: { href: string; label: string; description: string }) {
    return (
        <Link
            href={href}
            className="group rounded-xl border border-gray-200 bg-white p-5 transition-colors hover:border-indigo-300 hover:bg-indigo-50"
        >
            <h3 className="font-semibold text-gray-900 group-hover:text-indigo-700">{label}</h3>
            <p className="mt-1 text-sm text-gray-500">{description}</p>
        </Link>
    );
}
