import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import type { MenuData } from '@/types/cms';
import FrontLayout from '@/Layouts/FrontLayout';
import type { ThemeStyle } from '@/Layouts/Front/theme-helpers';

interface MemberProfileItem {
    id: number;
    user_id: number;
    display_name: string;
    bio: string | null;
    avatar: string | null;
    location: string | null;
    company: string | null;
    job_title: string | null;
    last_active_at: string | null;
    user: {
        id: number;
        name: string;
    };
}

interface PaginatedMembers {
    data: MemberProfileItem[];
    current_page: number;
    last_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface DirectoryProps {
    menus: Record<string, MenuData>;
    theme: {
        customizations: Record<string, string | boolean>;
        layouts: Array<{ slug: string; name: string }>;
        style?: ThemeStyle;
    };
    members: PaginatedMembers;
    filters: { search?: string; location?: string; sort?: string };
    stats: { total_members: number; recently_active: number };
}

export default function Directory({ menus, theme, members, filters, stats }: DirectoryProps) {
    const [search, setSearch] = useState(filters.search || '');

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        router.get('/members', { search }, { preserveState: true });
    }

    return (
        <FrontLayout menus={menus} theme={theme}>
            <Head title="Annuaire des membres" />

            {/* Hero section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[var(--color-primary,#6366f1)] via-[var(--color-primary,#6366f1)]/90 to-[var(--color-primary,#6366f1)]/70">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
                </div>
                <div className="relative mx-auto max-w-6xl px-4 py-16 text-center">
                    <h1 className="text-4xl font-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                        Annuaire des membres
                    </h1>
                    <p className="mt-4 text-lg text-white/70">
                        Explorez notre communaute de {stats.total_members} membre{stats.total_members > 1 ? 's' : ''}
                    </p>

                    {/* Stats badges */}
                    <div className="mt-6 flex items-center justify-center gap-4">
                        <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                            </svg>
                            {stats.total_members} membres
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-400/20 px-4 py-2 text-sm font-medium text-emerald-100 backdrop-blur-sm">
                            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                            {stats.recently_active} actif{stats.recently_active > 1 ? 's' : ''} cette semaine
                        </span>
                    </div>

                    {/* Search */}
                    <form onSubmit={handleSearch} className="mx-auto mt-8 max-w-lg">
                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Rechercher un membre..."
                                    className="w-full rounded-xl border-0 bg-white/95 py-3.5 pl-12 pr-4 text-sm text-gray-900 shadow-lg shadow-black/10 backdrop-blur-sm placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-white/50 transition-all"
                                />
                                <svg className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                                </svg>
                            </div>
                            <button
                                type="submit"
                                className="rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-[var(--color-primary,#6366f1)] shadow-lg shadow-black/10 transition-all hover:bg-[var(--color-primary,#6366f1)]/5"
                            >
                                Rechercher
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="mx-auto max-w-6xl px-4 py-12">
                {/* Grid */}
                {members.data.length === 0 ? (
                    <div className="py-20 text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                            <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Aucun membre trouve</h3>
                        <p className="mt-1 text-sm text-gray-500">Essayez avec d'autres termes de recherche.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {members.data.map((member) => (
                            <MemberCard key={member.id} member={member} />
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {members.last_page > 1 && (
                    <div className="mt-12 flex justify-center gap-1.5">
                        {members.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url || '#'}
                                className={`inline-flex h-10 min-w-[40px] items-center justify-center rounded-lg px-3.5 text-sm font-medium transition-all duration-200 ${
                                    link.active
                                        ? 'bg-[var(--color-primary,#6366f1)] text-white shadow-md shadow-[var(--color-primary,#6366f1)]/25'
                                        : link.url
                                            ? 'border border-gray-200 text-gray-700 hover:border-[var(--color-primary,#6366f1)]/30 hover:bg-[var(--color-primary,#6366f1)]/5 hover:text-[var(--color-primary,#6366f1)]'
                                            : 'text-gray-300 cursor-default'
                                }`}
                                preserveState
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </FrontLayout>
    );
}

function MemberCard({ member }: { member: MemberProfileItem }) {
    const avatarUrl = member.avatar ? `/storage/${member.avatar}` : null;
    const name = member.display_name || member.user.name;

    // Was the member active recently (within 7 days)?
    const isRecentlyActive = member.last_active_at &&
        (Date.now() - new Date(member.last_active_at).getTime()) < 7 * 24 * 60 * 60 * 1000;

    return (
        <Link
            href={`/members/${member.user_id}`}
            className="group relative rounded-2xl border border-gray-100 bg-white p-6 transition-all duration-300 hover:shadow-xl hover:shadow-[var(--color-primary,#6366f1)]/8 hover:-translate-y-1"
        >
            <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-[var(--color-primary,#6366f1)] to-[var(--color-primary,#6366f1)]/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            <div className="flex items-center gap-4">
                <div className="relative">
                    {avatarUrl ? (
                        <img src={avatarUrl} alt={name} className="h-16 w-16 rounded-full object-cover ring-3 ring-[var(--color-primary,#6366f1)]/10 transition-all group-hover:ring-[var(--color-primary,#6366f1)]/25 group-hover:scale-105" />
                    ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-primary,#6366f1)] to-[var(--color-primary,#6366f1)]/70 text-xl font-bold text-white ring-3 ring-[var(--color-primary,#6366f1)]/10 transition-all group-hover:ring-[var(--color-primary,#6366f1)]/25 group-hover:scale-105">
                            {name.charAt(0).toUpperCase()}
                        </div>
                    )}
                    {isRecentlyActive && (
                        <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-white bg-emerald-400" />
                    )}
                </div>
                <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold text-gray-900 transition-colors group-hover:text-[var(--color-primary,#6366f1)]">
                        {name}
                    </h3>
                    {(member.job_title || member.company) && (
                        <p className="truncate text-sm text-gray-500">
                            {member.job_title}{member.job_title && member.company && ' - '}{member.company}
                        </p>
                    )}
                    {member.location && (
                        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-gray-400">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                            </svg>
                            {member.location}
                        </p>
                    )}
                </div>
            </div>
            {member.bio && (
                <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-gray-500">{member.bio}</p>
            )}

            <div className="mt-4 flex items-center gap-1 text-xs font-medium text-[var(--color-primary,#6366f1)] opacity-0 transition-all duration-300 group-hover:opacity-100">
                Voir le profil
                <svg className="h-3 w-3 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
            </div>
        </Link>
    );
}
