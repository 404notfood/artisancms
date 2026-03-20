import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router , usePage } from '@inertiajs/react';
import { useState } from 'react';
import type { UserData, RoleData, PaginatedResponse, SharedProps } from '@/types/cms';
import { formatDate } from '@/lib/format';
import UserAvatar from '@/Components/admin/user-avatar';
import RoleBadge from '@/Components/admin/role-badge';
import { Users as UsersIcon, Plus, Pencil, Trash2 } from 'lucide-react';

interface UsersIndexProps {
    users: PaginatedResponse<UserData & { posts_count?: number; pages_count?: number; avatar_url?: string | null }>;
    roles: RoleData[];
    filters: {
        search?: string;
        role_id?: string;
    };
}

export default function UsersIndex({ users, roles, filters }: UsersIndexProps) {
    const { cms } = usePage<SharedProps>().props;
    const prefix = cms?.adminPrefix ?? 'admin';
    const [search, setSearch] = useState(filters.search ?? '');

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        router.get(`/${prefix}/users`, { search, role_id: filters.role_id }, { preserveState: true });
    }

    function handleRoleFilter(roleId: string) {
        router.get(`/${prefix}/users`, { role_id: roleId, search: filters.search }, { preserveState: true });
    }

    function handleDelete(user: UserData) {
        if (!confirm(`Supprimer l'utilisateur "${user.name}" ? Cette action est irréversible.`)) return;
        router.delete(`/admin/users/${user.id}`);
    }

    return (
        <AdminLayout
            header={
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <UsersIcon className="h-5 w-5" />
                        Utilisateurs
                    </h1>
                    <Link
                        href={`/${prefix}/users/create`}
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        Nouvel utilisateur
                    </Link>
                </div>
            }
        >
            <Head title="Utilisateurs" />

            <div className="rounded-xl border border-gray-200 bg-white">
                {/* Filters */}
                <div className="flex flex-col gap-4 border-b border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex gap-1 flex-wrap">
                        <button
                            onClick={() => handleRoleFilter('')}
                            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                                !filters.role_id
                                    ? 'bg-indigo-100 text-indigo-700'
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            Tous
                        </button>
                        {roles.map((role) => (
                            <button
                                key={role.id}
                                onClick={() => handleRoleFilter(String(role.id))}
                                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                                    filters.role_id === String(role.id)
                                        ? 'bg-indigo-100 text-indigo-700'
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                {role.name}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSearch} className="flex gap-2">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Rechercher par nom ou email..."
                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <button
                            type="submit"
                            className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                        >
                            Rechercher
                        </button>
                    </form>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-gray-200 bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 font-medium text-gray-700">Utilisateur</th>
                                <th className="hidden px-4 py-3 font-medium text-gray-700 md:table-cell">Role</th>
                                <th className="hidden px-4 py-3 font-medium text-gray-700 lg:table-cell">Contenu</th>
                                <th className="hidden px-4 py-3 font-medium text-gray-700 sm:table-cell">Inscrit le</th>
                                <th className="px-4 py-3 font-medium text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {users.data.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                        Aucun utilisateur trouve.
                                    </td>
                                </tr>
                            ) : (
                                users.data.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <UserAvatar name={user.name} avatarUrl={user.avatar_url} />
                                                <div>
                                                    <Link
                                                        href={`/admin/users/${user.id}/edit`}
                                                        className="font-medium text-gray-900 hover:text-indigo-600"
                                                    >
                                                        {user.name}
                                                    </Link>
                                                    <p className="text-xs text-gray-500">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="hidden px-4 py-3 md:table-cell">
                                            <RoleBadge role={user.role} />
                                        </td>
                                        <td className="hidden px-4 py-3 lg:table-cell">
                                            <div className="flex items-center gap-3 text-xs text-gray-500">
                                                <span>{user.posts_count ?? 0} articles</span>
                                                <span className="text-gray-300">|</span>
                                                <span>{user.pages_count ?? 0} pages</span>
                                            </div>
                                        </td>
                                        <td className="hidden px-4 py-3 text-gray-500 sm:table-cell">
                                            {user.created_at ? formatDate(user.created_at) : '--'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    href={`/admin/users/${user.id}/edit`}
                                                    className="text-gray-500 hover:text-indigo-600"
                                                    title="Modifier"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(user)}
                                                    className="text-gray-500 hover:text-red-600"
                                                    title="Supprimer"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {users.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
                        <p className="text-sm text-gray-600">
                            {users.from}--{users.to} sur {users.total}
                        </p>
                        <div className="flex gap-1">
                            {Array.from({ length: users.last_page }, (_, i) => i + 1).map((p) => (
                                <Link
                                    key={p}
                                    href={`/admin/users?page=${p}&role_id=${filters.role_id ?? ''}&search=${filters.search ?? ''}`}
                                    className={`rounded px-3 py-1 text-sm ${
                                        p === users.current_page
                                            ? 'bg-indigo-600 text-white'
                                            : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    {p}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}

// UserAvatar, RoleBadge, formatDate, and icons imported from shared modules.
