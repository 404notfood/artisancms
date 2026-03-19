import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';

interface MemberUser {
    id: number;
    name: string;
    email: string;
    created_at: string;
    role: { name: string; slug: string } | null;
}

interface ProfileData {
    display_name: string | null;
    first_name: string | null;
    last_name: string | null;
    bio: string | null;
    avatar: string | null;
    phone: string | null;
    website: string | null;
    location: string | null;
    company: string | null;
    job_title: string | null;
    profile_visibility: string;
    profile_completion: number;
    last_active_at: string | null;
}

interface ActivityItem {
    id: number;
    type: string;
    description: string;
    ip_address: string | null;
    created_at: string;
}

interface Stats {
    profile_completion: number;
    member_since: string;
    last_active: string;
    total_activities: number;
}

interface ShowProps {
    member: MemberUser;
    profile: ProfileData | null;
    recentActivity: ActivityItem[];
    stats: Stats;
}

export default function MemberShow({ member, profile, recentActivity, stats }: ShowProps) {
    const avatarUrl = profile?.avatar ? `/storage/${profile.avatar}` : null;
    const displayName = profile?.display_name || member.name;

    return (
        <AdminLayout header={
            <div className="flex items-center gap-3">
                <Link href="/admin/member-space/members" className="text-gray-400 hover:text-gray-600">&larr;</Link>
                <h1 className="text-xl font-semibold text-gray-900">{displayName}</h1>
            </div>
        }>
            <Head title={`Membre: ${displayName}`} />

            <div className="mx-auto max-w-4xl space-y-6">
                {/* Header card */}
                <div className="flex items-center gap-6 rounded-lg border border-gray-200 bg-white p-6">
                    {avatarUrl ? (
                        <img src={avatarUrl} alt={displayName} className="h-16 w-16 rounded-full object-cover" />
                    ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-2xl font-bold text-indigo-600">
                            {displayName.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">{displayName}</h2>
                        <p className="text-sm text-gray-500">{member.email}</p>
                        <div className="mt-1 flex items-center gap-3">
                            <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                                {member.role?.name || 'Aucun role'}
                            </span>
                            {profile && (
                                <span className="text-xs text-gray-500">{profile.profile_visibility}</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <StatCard label="Profil complet" value={`${stats.profile_completion}%`} />
                    <StatCard label="Membre depuis" value={stats.member_since} />
                    <StatCard label="Derniere activite" value={stats.last_active} />
                    <StatCard label="Actions" value={String(stats.total_activities)} />
                </div>

                {/* Profile info */}
                {profile && (
                    <div className="rounded-lg border border-gray-200 bg-white p-6">
                        <h3 className="mb-4 text-lg font-medium text-gray-900">Informations du profil</h3>
                        <dl className="grid grid-cols-2 gap-4 text-sm">
                            {profile.first_name && <InfoRow label="Prenom" value={profile.first_name} />}
                            {profile.last_name && <InfoRow label="Nom" value={profile.last_name} />}
                            {profile.company && <InfoRow label="Entreprise" value={profile.company} />}
                            {profile.job_title && <InfoRow label="Poste" value={profile.job_title} />}
                            {profile.location && <InfoRow label="Localisation" value={profile.location} />}
                            {profile.phone && <InfoRow label="Telephone" value={profile.phone} />}
                            {profile.website && <InfoRow label="Site web" value={profile.website} />}
                        </dl>
                        {profile.bio && (
                            <div className="mt-4 border-t border-gray-100 pt-4">
                                <p className="text-sm font-medium text-gray-500">Bio</p>
                                <p className="mt-1 text-sm text-gray-700 whitespace-pre-line">{profile.bio}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Activity log */}
                <div className="rounded-lg border border-gray-200 bg-white">
                    <div className="border-b border-gray-200 px-6 py-4">
                        <h3 className="text-lg font-medium text-gray-900">Activite recente</h3>
                    </div>
                    {recentActivity.length === 0 ? (
                        <div className="px-6 py-8 text-center text-gray-500">Aucune activite.</div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {recentActivity.map((activity) => (
                                <div key={activity.id} className="flex items-center justify-between px-6 py-3">
                                    <div className="flex items-center gap-3">
                                        <span className="inline-flex rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                                            {activity.type}
                                        </span>
                                        <span className="text-sm text-gray-700">{activity.description}</span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-400">
                                            {new Date(activity.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                        {activity.ip_address && <p className="text-xs text-gray-300">{activity.ip_address}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}

function StatCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">{value}</p>
        </div>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <dt className="text-gray-500">{label}</dt>
            <dd className="font-medium text-gray-900">{value}</dd>
        </div>
    );
}
