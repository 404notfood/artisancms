import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { useState, type FormEvent } from 'react';
import type { UserData, RoleData } from '@/types/cms';
import { formatDate } from '@/lib/format';
import AvatarUpload from '@/Components/admin/avatar-upload';
import RoleBadge from '@/Components/admin/role-badge';
import { ArrowLeft } from 'lucide-react';

interface UsersEditProps {
    user: UserData & {
        social_links?: Record<string, string> | null;
        profile_visibility?: string;
        avatar_url?: string | null;
        posts_count?: number;
        pages_count?: number;
    };
    roles: RoleData[];
}

// AvatarUpload is now imported from shared component.

// ─── Profile Section ─────────────────────────────────────────────────────────

function ProfileSection({ user, roles }: { user: UsersEditProps['user']; roles: RoleData[] }) {
    const socialLinks = user.social_links || {};

    const form = useForm({
        name: user.name || '',
        email: user.email || '',
        bio: user.bio || '',
        role_id: user.role_id ?? ('' as string | number),
        profile_visibility: (user.profile_visibility || 'public') as string,
        social_links: {
            website: socialLinks.website || '',
            twitter: socialLinks.twitter || '',
            linkedin: socialLinks.linkedin || '',
            github: socialLinks.github || '',
        } as Record<string, string>,
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        const filtered: Record<string, string> = {};
        Object.entries(form.data.social_links).forEach(([k, v]) => {
            if (v) filtered[k] = v;
        });
        form.transform((data) => ({
            ...data,
            social_links: Object.keys(filtered).length > 0 ? filtered : null,
        }));
        form.put(`/admin/users/${user.id}`);
    };

    return (
        <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations du profil</h2>
            <form onSubmit={submit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                        <input
                            id="name"
                            type="text"
                            value={form.data.name}
                            onChange={(e) => form.setData('name', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                            required
                        />
                        {form.errors.name && <p className="mt-1 text-xs text-red-600">{form.errors.name}</p>}
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={form.data.email}
                            onChange={(e) => form.setData('email', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                            required
                        />
                        {form.errors.email && <p className="mt-1 text-xs text-red-600">{form.errors.email}</p>}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="role_id" className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                        <select
                            id="role_id"
                            value={form.data.role_id}
                            onChange={(e) => form.setData('role_id', e.target.value ? Number(e.target.value) : '')}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                            required
                        >
                            <option value="">Choisir un role...</option>
                            {roles.map((role) => (
                                <option key={role.id} value={role.id}>{role.name}</option>
                            ))}
                        </select>
                        {form.errors.role_id && <p className="mt-1 text-xs text-red-600">{form.errors.role_id}</p>}
                    </div>
                    <div>
                        <label htmlFor="visibility" className="block text-sm font-medium text-gray-700 mb-1">Visibilite du profil</label>
                        <select
                            id="visibility"
                            value={form.data.profile_visibility}
                            onChange={(e) => form.setData('profile_visibility', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            <option value="public">Public</option>
                            <option value="members_only">Membres uniquement</option>
                            <option value="private">Prive</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                    <textarea
                        id="bio"
                        rows={3}
                        value={form.data.bio}
                        onChange={(e) => form.setData('bio', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        maxLength={1000}
                    />
                    <p className="text-xs text-gray-500 mt-1">{form.data.bio.length}/1000</p>
                    {form.errors.bio && <p className="mt-1 text-xs text-red-600">{form.errors.bio}</p>}
                </div>

                <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Liens sociaux</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[
                            { key: 'website', label: 'Site web', placeholder: 'https://monsite.com' },
                            { key: 'twitter', label: 'Twitter / X', placeholder: 'https://x.com/username' },
                            { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/username' },
                            { key: 'github', label: 'GitHub', placeholder: 'https://github.com/username' },
                        ].map(({ key, label, placeholder }) => (
                            <div key={key}>
                                <label htmlFor={`social-${key}`} className="block text-xs text-gray-500 mb-1">{label}</label>
                                <input
                                    id={`social-${key}`}
                                    type="url"
                                    value={form.data.social_links[key] || ''}
                                    onChange={(e) =>
                                        form.setData('social_links', { ...form.data.social_links, [key]: e.target.value })
                                    }
                                    placeholder={placeholder}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={form.processing}
                        className="inline-flex items-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
                    >
                        {form.processing ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                </div>
            </form>
        </section>
    );
}

// ─── Password Section ────────────────────────────────────────────────────────

function PasswordSection({ user }: { user: UsersEditProps['user'] }) {
    const form = useForm({
        name: user.name,
        email: user.email,
        role_id: user.role_id ?? '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.put(`/admin/users/${user.id}`, {
            onSuccess: () => {
                form.setData('password', '');
                form.setData('password_confirmation', '');
            },
        });
    };

    return (
        <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Changer le mot de passe</h2>
            <p className="text-sm text-gray-500 mb-4">Laissez vide pour conserver le mot de passe actuel.</p>
            <form onSubmit={submit} className="space-y-4 max-w-md">
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                        Nouveau mot de passe
                    </label>
                    <input
                        id="password"
                        type="password"
                        value={form.data.password}
                        onChange={(e) => form.setData('password', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        minLength={8}
                    />
                    {form.errors.password && <p className="mt-1 text-xs text-red-600">{form.errors.password}</p>}
                </div>
                <div>
                    <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700 mb-1">
                        Confirmer le mot de passe
                    </label>
                    <input
                        id="password_confirmation"
                        type="password"
                        value={form.data.password_confirmation}
                        onChange={(e) => form.setData('password_confirmation', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        minLength={8}
                    />
                </div>
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={form.processing || (!form.data.password && !form.data.password_confirmation)}
                        className="inline-flex items-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
                    >
                        {form.processing ? 'Mise a jour...' : 'Changer le mot de passe'}
                    </button>
                </div>
            </form>
        </section>
    );
}

// ─── Info Section ────────────────────────────────────────────────────────────

function InfoSection({ user }: { user: UsersEditProps['user'] }) {
    return (
        <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations</h2>
            <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                    <dt className="text-gray-500">Inscrit le</dt>
                    <dd className="font-medium text-gray-900">
                        {user.created_at ? formatDate(user.created_at) : '--'}
                    </dd>
                </div>
                <div>
                    <dt className="text-gray-500">Derniere modification</dt>
                    <dd className="font-medium text-gray-900">
                        {user.updated_at ? formatDate(user.updated_at) : '--'}
                    </dd>
                </div>
                <div>
                    <dt className="text-gray-500">Articles</dt>
                    <dd className="font-medium text-gray-900">{user.posts_count ?? 0}</dd>
                </div>
                <div>
                    <dt className="text-gray-500">Pages</dt>
                    <dd className="font-medium text-gray-900">{user.pages_count ?? 0}</dd>
                </div>
            </dl>
        </section>
    );
}

// ─── Danger Zone ─────────────────────────────────────────────────────────────

function DangerZone({ user }: { user: UsersEditProps['user'] }) {
    const [confirmOpen, setConfirmOpen] = useState(false);

    const handleDelete = () => {
        router.delete(`/admin/users/${user.id}`);
    };

    return (
        <section className="rounded-xl border border-red-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-red-600 mb-2">Zone danger</h2>
            <p className="text-sm text-gray-600 mb-4">
                Supprimer cet utilisateur supprimera definitivement toutes ses donnees.
            </p>

            {!confirmOpen ? (
                <button
                    type="button"
                    onClick={() => setConfirmOpen(true)}
                    className="inline-flex items-center rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                    Supprimer l'utilisateur
                </button>
            ) : (
                <div className="space-y-3 max-w-md">
                    <p className="text-sm font-medium text-red-600">
                        Etes-vous sur de vouloir supprimer {user.name} ?
                    </p>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                        >
                            Confirmer la suppression
                        </button>
                        <button
                            type="button"
                            onClick={() => setConfirmOpen(false)}
                            className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Annuler
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function UsersEdit({ user, roles }: UsersEditProps) {
    return (
        <AdminLayout
            header={
                <div className="flex items-center gap-4">
                    <Link href="/admin/users" className="text-gray-500 hover:text-gray-700">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <h1 className="text-xl font-semibold text-gray-900">Modifier l'utilisateur</h1>
                    <RoleBadge role={user.role} />
                </div>
            }
        >
            <Head title={`Modifier : ${user.name}`} />

            <div className="max-w-3xl mx-auto space-y-6">
                <AvatarUpload
                    name={user.name}
                    avatarUrl={user.avatar_url}
                    uploadUrl={`/admin/users/${user.id}/avatar`}
                    deleteUrl={`/admin/users/${user.id}/avatar`}
                />
                <ProfileSection user={user} roles={roles} />
                <PasswordSection user={user} />
                <InfoSection user={user} />
                <DangerZone user={user} />
            </div>
        </AdminLayout>
    );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// RoleBadge, formatDate, ArrowLeft imported from shared modules.
