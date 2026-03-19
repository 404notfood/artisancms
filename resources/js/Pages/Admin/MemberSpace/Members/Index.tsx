import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

interface MemberItem {
    id: number;
    name: string;
    email: string;
    created_at: string;
    role: { name: string; slug: string } | null;
    member_profile: {
        display_name: string | null;
        avatar: string | null;
        profile_completion: number;
        last_active_at: string | null;
    } | null;
}

interface PaginatedMembers {
    data: MemberItem[];
    current_page: number;
    last_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface MembersIndexProps {
    members: PaginatedMembers;
    filters: { search?: string; role?: string };
}

export default function MembersIndex({ members, filters }: MembersIndexProps) {
    const [search, setSearch] = useState(filters.search || '');

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        router.get('/admin/member-space/members', { search }, { preserveState: true });
    }

    return (
        <AdminLayout header={<h1 className="text-xl font-semibold text-gray-900">Membres</h1>}>
            <Head title="Membres" />

            <div className="mx-auto max-w-5xl space-y-6">
                {/* Search & stats */}
                <div className="flex items-center justify-between">
                    <form onSubmit={handleSearch} className="flex gap-3">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Rechercher..."
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                            Rechercher
                        </button>
                    </form>
                    <span className="text-sm text-gray-500">{members.total} membre{members.total > 1 ? 's' : ''}</span>
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 font-medium text-gray-700">Membre</th>
                                <th className="px-6 py-3 font-medium text-gray-700">Email</th>
                                <th className="px-6 py-3 font-medium text-gray-700">Role</th>
                                <th className="px-6 py-3 font-medium text-gray-700">Profil</th>
                                <th className="px-6 py-3 font-medium text-gray-700">Inscrit le</th>
                                <th className="px-6 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {members.data.map((member) => {
                                const avatarUrl = member.member_profile?.avatar ? `/storage/${member.member_profile.avatar}` : null;
                                return (
                                    <tr key={member.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {avatarUrl ? (
                                                    <img src={avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                                                ) : (
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                                                        {member.name.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <span className="font-medium text-gray-900">{member.member_profile?.display_name || member.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">{member.email}</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                                                {member.role?.name || 'Aucun'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-200">
                                                    <div className="h-full rounded-full bg-indigo-500" style={{ width: `${member.member_profile?.profile_completion || 0}%` }} />
                                                </div>
                                                <span className="text-xs text-gray-500">{member.member_profile?.profile_completion || 0}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            {new Date(member.created_at).toLocaleDateString('fr-FR')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Link
                                                href={`/admin/member-space/members/${member.id}`}
                                                className="text-indigo-600 hover:text-indigo-800"
                                            >
                                                Voir
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {members.last_page > 1 && (
                    <div className="flex justify-center gap-1">
                        {members.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url || '#'}
                                className={`rounded-lg px-3 py-2 text-sm ${
                                    link.active ? 'bg-indigo-600 text-white' : link.url ? 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200' : 'text-gray-400'
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
