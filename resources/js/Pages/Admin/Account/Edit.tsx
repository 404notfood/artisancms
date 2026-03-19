import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState, type FormEvent } from 'react';
import type { UserData, RoleData } from '@/types/cms';
import AvatarUpload from '@/Components/admin/avatar-upload';

interface AccountEditProps {
    user: UserData & {
        social_links?: Record<string, string> | null;
        profile_visibility?: string;
        avatar_url?: string | null;
        preferences?: Record<string, unknown> | null;
    };
    roles: RoleData[];
}

// ─── Profile Info Section ────────────────────────────────────────────────────

function ProfileSection({ user }: { user: AccountEditProps['user'] }) {
    const socialLinks = user.social_links || {};

    const form = useForm({
        name: user.name || '',
        email: user.email || '',
        bio: user.bio || '',
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
        // Filter out empty social links
        const filtered: Record<string, string> = {};
        Object.entries(form.data.social_links).forEach(([k, v]) => {
            if (v) filtered[k] = v;
        });
        form.transform((data) => ({
            ...data,
            social_links: Object.keys(filtered).length > 0 ? filtered : null,
        }));
        form.put('/admin/account');
    };

    return (
        <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations</h2>
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
                        />
                        {form.errors.email && <p className="mt-1 text-xs text-red-600">{form.errors.email}</p>}
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

// ─── Security Section ────────────────────────────────────────────────────────

function SecuritySection() {
    const form = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.put('/admin/account/password', {
            onSuccess: () => form.reset(),
        });
    };

    return (
        <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Securite</h2>
            <form onSubmit={submit} className="space-y-4 max-w-md">
                <div>
                    <label htmlFor="current_password" className="block text-sm font-medium text-gray-700 mb-1">
                        Mot de passe actuel
                    </label>
                    <input
                        id="current_password"
                        type="password"
                        value={form.data.current_password}
                        onChange={(e) => form.setData('current_password', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    {form.errors.current_password && (
                        <p className="mt-1 text-xs text-red-600">{form.errors.current_password}</p>
                    )}
                </div>
                <div>
                    <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 mb-1">
                        Nouveau mot de passe
                    </label>
                    <input
                        id="new_password"
                        type="password"
                        value={form.data.password}
                        onChange={(e) => form.setData('password', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
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
                    />
                </div>
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={form.processing}
                        className="inline-flex items-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
                    >
                        {form.processing ? 'Mise a jour...' : 'Changer le mot de passe'}
                    </button>
                </div>
            </form>
        </section>
    );
}

// ─── Danger Zone ─────────────────────────────────────────────────────────────

function DangerZone() {
    const [confirmOpen, setConfirmOpen] = useState(false);
    const form = useForm({ password: '' });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.delete('/admin/account');
    };

    return (
        <section className="rounded-xl border border-red-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-red-600 mb-2">Zone danger</h2>
            <p className="text-sm text-gray-600 mb-4">
                Une fois votre compte supprime, toutes les donnees seront definitivement effacees.
            </p>

            {!confirmOpen ? (
                <button
                    type="button"
                    onClick={() => setConfirmOpen(true)}
                    className="inline-flex items-center rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                    Supprimer mon compte
                </button>
            ) : (
                <form onSubmit={submit} className="space-y-3 max-w-md">
                    <p className="text-sm font-medium text-red-600">
                        Confirmez en entrant votre mot de passe :
                    </p>
                    <input
                        type="password"
                        value={form.data.password}
                        onChange={(e) => form.setData('password', e.target.value)}
                        placeholder="Mot de passe"
                        className="w-full rounded-lg border border-red-300 px-3 py-2 text-sm focus:border-red-500 focus:ring-red-500"
                    />
                    {form.errors.password && <p className="text-xs text-red-600">{form.errors.password}</p>}
                    <div className="flex gap-2">
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
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
                </form>
            )}
        </section>
    );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function AccountEdit({ user, roles }: AccountEditProps) {
    return (
        <AdminLayout>
            <Head title="Mon compte" />

            <div className="max-w-3xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Mon compte</h1>
                    <p className="text-sm text-gray-500 mt-1">Gerez votre profil, securite et preferences</p>
                </div>

                <AvatarUpload
                    name={user.name}
                    avatarUrl={user.avatar_url}
                    uploadUrl="/admin/account/avatar"
                    deleteUrl="/admin/account/avatar"
                />
                <ProfileSection user={user} />
                <SecuritySection />
                <DangerZone />
            </div>
        </AdminLayout>
    );
}
