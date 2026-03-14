import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import type { UserData, RoleData, PaginatedResponse } from '@/types/cms';

interface UsersIndexProps {
    users: PaginatedResponse<UserData>;
    roles: RoleData[];
    filters: {
        search?: string;
        role_id?: string;
    };
}

export default function UsersIndex({ users, roles, filters }: UsersIndexProps) {
    const [search, setSearch] = useState(filters.search ?? '');

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        router.get('/admin/users', { search, role_id: filters.role_id }, { preserveState: true });
    }

    function handleRoleFilter(roleId: string) {
        router.get('/admin/users', { role_id: roleId, search: filters.search }, { preserveState: true });
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
                        <UsersIcon />
                        Utilisateurs
                    </h1>
                    <Link
                        href="/admin/users/create"
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                    >
                        <PlusIcon />
                        Nouvel utilisateur
                    </Link>
                </div>
            }
        >
            <Head title="Utilisateurs" />

            <div className="rounded-lg border border-gray-200 bg-white">
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
                                <th className="px-4 py-3 font-medium text-gray-700">Nom</th>
                                <th className="px-4 py-3 font-medium text-gray-700">Email</th>
                                <th className="hidden px-4 py-3 font-medium text-gray-700 md:table-cell">Role</th>
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
                                    <tr key={user.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-medium text-indigo-700">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <Link
                                                    href={`/admin/users/${user.id}/edit`}
                                                    className="font-medium text-gray-900 hover:text-indigo-600"
                                                >
                                                    {user.name}
                                                </Link>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {user.email}
                                        </td>
                                        <td className="hidden px-4 py-3 md:table-cell">
                                            <RoleBadge role={user.role} />
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
                                                    <EditIcon />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(user)}
                                                    className="text-gray-500 hover:text-red-600"
                                                    title="Supprimer"
                                                >
                                                    <TrashIcon />
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

function RoleBadge({ role }: { role?: RoleData }) {
    if (!role) return <span className="text-gray-400">--</span>;

    const styles: Record<string, string> = {
        admin: 'bg-purple-100 text-purple-800',
        editor: 'bg-blue-100 text-blue-800',
        author: 'bg-green-100 text-green-800',
        contributor: 'bg-yellow-100 text-yellow-800',
        subscriber: 'bg-gray-100 text-gray-800',
    };

    return (
        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${styles[role.slug] ?? 'bg-gray-100 text-gray-800'}`}>
            {role.name}
        </span>
    );
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

function UsersIcon() {
    return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
    );
}

function PlusIcon() {
    return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
    );
}

function EditIcon() {
    return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
        </svg>
    );
}

function TrashIcon() {
    return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
        </svg>
    );
}
