import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import type { UserData, RoleData } from '@/types/cms';

interface UsersEditProps {
    user: UserData;
    roles: RoleData[];
}

export default function UsersEdit({ user, roles }: UsersEditProps) {
    const { data, setData, put, processing, errors } = useForm({
        name: user.name,
        email: user.email,
        password: '',
        password_confirmation: '',
        role_id: user.role_id ?? ('' as string | number),
        bio: user.bio ?? '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        put(`/admin/users/${user.id}`);
    }

    return (
        <AdminLayout
            header={
                <div className="flex items-center gap-4">
                    <Link href="/admin/users" className="text-gray-500 hover:text-gray-700">
                        <BackIcon />
                    </Link>
                    <h1 className="text-xl font-semibold text-gray-900">Modifier l'utilisateur</h1>
                    <RoleBadge role={user.role} />
                </div>
            }
        >
            <Head title={`Modifier : ${user.name}`} />

            <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">
                {/* Account info */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
                    <h2 className="text-lg font-medium text-gray-900">Informations du compte</h2>

                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                            Nom
                        </label>
                        <input
                            id="name"
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            required
                        />
                        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            required
                        />
                        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                    </div>

                    <div>
                        <label htmlFor="role_id" className="block text-sm font-medium text-gray-700">
                            Role
                        </label>
                        <select
                            id="role_id"
                            value={data.role_id}
                            onChange={(e) => setData('role_id', e.target.value ? Number(e.target.value) : '')}
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            required
                        >
                            <option value="">Choisir un role...</option>
                            {roles.map((role) => (
                                <option key={role.id} value={role.id}>
                                    {role.name}
                                </option>
                            ))}
                        </select>
                        {errors.role_id && <p className="mt-1 text-sm text-red-600">{errors.role_id}</p>}
                    </div>

                    <div>
                        <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                            Biographie
                        </label>
                        <textarea
                            id="bio"
                            value={data.bio}
                            onChange={(e) => setData('bio', e.target.value)}
                            rows={3}
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            maxLength={1000}
                        />
                        {errors.bio && <p className="mt-1 text-sm text-red-600">{errors.bio}</p>}
                    </div>
                </div>

                {/* Password change */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
                    <h2 className="text-lg font-medium text-gray-900">Changer le mot de passe</h2>
                    <p className="text-sm text-gray-500">
                        Laissez vide pour conserver le mot de passe actuel.
                    </p>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            Nouveau mot de passe
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            minLength={8}
                        />
                        {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                    </div>

                    <div>
                        <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700">
                            Confirmer le mot de passe
                        </label>
                        <input
                            id="password_confirmation"
                            type="password"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            minLength={8}
                        />
                    </div>
                </div>

                {/* Info */}
                {user.created_at && (
                    <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-2">
                        <h2 className="text-lg font-medium text-gray-900">Informations</h2>
                        <dl className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <dt className="text-gray-500">Inscrit le</dt>
                                <dd className="text-gray-900">{formatDate(user.created_at)}</dd>
                            </div>
                            {user.updated_at && (
                                <div>
                                    <dt className="text-gray-500">Derniere modification</dt>
                                    <dd className="text-gray-900">{formatDate(user.updated_at)}</dd>
                                </div>
                            )}
                        </dl>
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-3">
                    <Link
                        href="/admin/users"
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Annuler
                    </Link>
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                        {processing ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                </div>
            </form>
        </AdminLayout>
    );
}

function RoleBadge({ role }: { role?: RoleData }) {
    if (!role) return null;

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

function BackIcon() {
    return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
    );
}
