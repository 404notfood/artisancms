import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

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
    members: PaginatedMembers;
    filters: { search?: string; location?: string; sort?: string };
    stats: { total_members: number; recently_active: number };
}

export default function Directory({ members, filters, stats }: DirectoryProps) {
    const [search, setSearch] = useState(filters.search || '');

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        router.get('/members', { search }, { preserveState: true });
    }

    return (
        <>
            <Head title="Annuaire des membres" />

            <div className="mx-auto max-w-6xl px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Annuaire des membres</h1>
                    <p className="mt-2 text-gray-600">
                        {stats.total_members} membre{stats.total_members > 1 ? 's' : ''}
                        {' '}&middot;{' '}
                        {stats.recently_active} actif{stats.recently_active > 1 ? 's' : ''} cette semaine
                    </p>
                </div>

                {/* Search */}
                <form onSubmit={handleSearch} className="mb-8">
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Rechercher un membre..."
                            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <button
                            type="submit"
                            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                        >
                            Rechercher
                        </button>
                    </div>
                </form>

                {/* Grid */}
                {members.data.length === 0 ? (
                    <div className="py-16 text-center text-gray-500">
                        Aucun membre trouve.
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
                    <div className="mt-8 flex justify-center gap-1">
                        {members.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url || '#'}
                                className={`rounded-lg px-3 py-2 text-sm ${
                                    link.active
                                        ? 'bg-indigo-600 text-white'
                                        : link.url
                                            ? 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                                            : 'text-gray-400 cursor-default'
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

function MemberCard({ member }: { member: MemberProfileItem }) {
    const avatarUrl = member.avatar ? `/storage/${member.avatar}` : null;
    const name = member.display_name || member.user.name;

    return (
        <Link
            href={`/members/${member.user_id}`}
            className="group rounded-xl border border-gray-200 bg-white p-6 transition-all hover:border-indigo-300 hover:shadow-md"
        >
            <div className="flex items-center gap-4">
                {avatarUrl ? (
                    <img src={avatarUrl} alt={name} className="h-14 w-14 rounded-full object-cover" />
                ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-xl font-bold text-indigo-600">
                        {name.charAt(0).toUpperCase()}
                    </div>
                )}
                <div className="min-w-0">
                    <h3 className="truncate font-semibold text-gray-900 group-hover:text-indigo-700">
                        {name}
                    </h3>
                    {(member.job_title || member.company) && (
                        <p className="truncate text-sm text-gray-500">
                            {member.job_title}{member.job_title && member.company && ' - '}{member.company}
                        </p>
                    )}
                    {member.location && (
                        <p className="truncate text-xs text-gray-400">{member.location}</p>
                    )}
                </div>
            </div>
            {member.bio && (
                <p className="mt-3 line-clamp-2 text-sm text-gray-600">{member.bio}</p>
            )}
        </Link>
    );
}
