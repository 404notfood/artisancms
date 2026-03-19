import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import type { UserData, MenuData, PaginatedResponse } from '@/types/cms';
import FrontLayout from '@/Layouts/FrontLayout';
import type { ThemeStyle } from '@/Layouts/Front/theme-helpers';

interface MembersIndexProps {
    menus: Record<string, MenuData>;
    theme: {
        customizations: Record<string, string | boolean>;
        layouts: Array<{ slug: string; name: string }>;
        style?: ThemeStyle;
    };
    members: PaginatedResponse<UserData & { avatar_url?: string | null; role?: { name: string; slug: string } }>;
    search: string;
}

function MemberCard({ member }: { member: UserData & { avatar_url?: string | null; role?: { name: string; slug: string } } }) {
    const initials = member.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <Link
            href={`/members/${member.id}`}
            className="group relative flex flex-col items-center rounded-2xl border border-gray-100 bg-white p-8 text-center transition-all duration-300 hover:shadow-xl hover:shadow-[var(--color-primary,#6366f1)]/8 hover:-translate-y-1"
        >
            {/* Decorative gradient top border */}
            <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-[var(--color-primary,#6366f1)] to-[var(--color-primary,#6366f1)]/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            <div className="relative">
                {member.avatar_url ? (
                    <img
                        src={member.avatar_url}
                        alt={member.name}
                        className="h-24 w-24 rounded-full object-cover ring-4 ring-[var(--color-primary,#6366f1)]/10 transition-all duration-300 group-hover:ring-[var(--color-primary,#6366f1)]/30 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-primary,#6366f1)] to-[var(--color-primary,#6366f1)]/70 ring-4 ring-[var(--color-primary,#6366f1)]/10 transition-all duration-300 group-hover:ring-[var(--color-primary,#6366f1)]/30 group-hover:scale-105">
                        <span className="text-xl font-bold text-white">{initials}</span>
                    </div>
                )}
                {/* Online indicator dot */}
                <div className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-400" />
            </div>

            <h3 className="mt-4 text-lg font-semibold text-gray-900 transition-colors duration-200 group-hover:text-[var(--color-primary,#6366f1)]">
                {member.name}
            </h3>

            {member.role && (
                <span className="mt-2 inline-flex items-center rounded-full bg-[var(--color-primary,#6366f1)]/8 px-3 py-1 text-xs font-semibold text-[var(--color-primary,#6366f1)]">
                    {member.role.name}
                </span>
            )}

            {member.bio && (
                <p className="mt-3 text-sm leading-relaxed text-gray-500 line-clamp-2">{member.bio}</p>
            )}

            {/* Hover arrow */}
            <div className="mt-4 flex items-center gap-1 text-xs font-medium text-[var(--color-primary,#6366f1)] opacity-0 transition-all duration-300 group-hover:opacity-100">
                Voir le profil
                <svg className="h-3 w-3 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
            </div>
        </Link>
    );
}

export default function MembersIndex({ menus, theme, members, search }: MembersIndexProps) {
    const [query, setQuery] = useState(search || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/members', query ? { search: query } : {}, { preserveState: true });
    };

    return (
        <FrontLayout menus={menus} theme={theme}>
            <Head title="Membres" />

            {/* Hero section with gradient */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[var(--color-primary,#6366f1)] via-[var(--color-primary,#6366f1)]/90 to-[var(--color-primary,#6366f1)]/70">
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
                </div>
                <div className="relative mx-auto max-w-7xl px-4 py-16 sm:py-20 text-center">
                    <h1 className="text-4xl font-bold text-white sm:text-5xl" style={{ fontFamily: 'var(--font-heading)' }}>
                        Notre communaute
                    </h1>
                    <p className="mx-auto mt-4 max-w-xl text-lg text-white/70">
                        Decouvrez les membres qui composent notre reseau et connectez-vous avec eux
                    </p>

                    {/* Member count badge */}
                    <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-5 py-2 text-sm font-medium text-white backdrop-blur-sm">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                        </svg>
                        {members.total} membre{members.total !== 1 ? 's' : ''}
                    </div>

                    {/* Search */}
                    <form onSubmit={handleSearch} className="mx-auto mt-8 max-w-lg">
                        <div className="relative">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Rechercher un membre..."
                                className="w-full rounded-xl border-0 bg-white/95 py-3.5 pl-12 pr-4 text-sm text-gray-900 shadow-lg shadow-black/10 backdrop-blur-sm placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-white/50 transition-all"
                            />
                            <svg className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                            </svg>
                        </div>
                    </form>
                </div>
            </div>

            {/* Grid */}
            <div className="mx-auto max-w-7xl px-4 py-12">
                {members.data.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        {members.data.map((member) => (
                            <MemberCard key={member.id} member={member} />
                        ))}
                    </div>
                ) : (
                    <div className="py-20 text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                            <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Aucun membre trouve</h3>
                        <p className="mt-1 text-sm text-gray-500">Essayez avec d'autres termes de recherche.</p>
                    </div>
                )}

                {/* Pagination */}
                {members.last_page > 1 && (
                    <nav className="mt-12 flex justify-center gap-1.5">
                        {members.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url || '#'}
                                className={`inline-flex h-10 min-w-[40px] items-center justify-center rounded-lg px-3.5 text-sm font-medium transition-all duration-200 ${
                                    link.active
                                        ? 'bg-[var(--color-primary,#6366f1)] text-white shadow-md shadow-[var(--color-primary,#6366f1)]/25'
                                        : link.url
                                            ? 'border border-gray-200 text-gray-700 hover:border-[var(--color-primary,#6366f1)]/30 hover:bg-[var(--color-primary,#6366f1)]/5 hover:text-[var(--color-primary,#6366f1)]'
                                            : 'text-gray-300 cursor-not-allowed'
                                }`}
                                preserveState
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </nav>
                )}
            </div>
        </FrontLayout>
    );
}
