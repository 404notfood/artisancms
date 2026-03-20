import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm , usePage } from '@inertiajs/react';
import type { RoleData, SharedProps } from '@/types/cms';
import { ArrowLeft } from 'lucide-react';

interface UsersCreateProps {
    roles: RoleData[];
}

export default function UsersCreate({ roles }: UsersCreateProps) {
    const { cms } = usePage<SharedProps>().props;
    const prefix = cms?.adminPrefix ?? 'admin';
    const { data, setData, post, processing, errors, transform } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role_id: '' as string | number,
        bio: '',
        profile_visibility: 'public',
        social_links: {
            website: '',
            twitter: '',
            linkedin: '',
            github: '',
        } as Record<string, string>,
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const filtered: Record<string, string> = {};
        Object.entries(data.social_links).forEach(([k, v]) => {
            if (v) filtered[k] = v;
        });
        transform((d) => ({
            ...d,
            social_links: Object.keys(filtered).length > 0 ? filtered : null,
        }));
        post(`/${prefix}/users`);
    }

    return (
        <AdminLayout
            header={
                <div className="flex items-center gap-4">
                    <Link href={`/${prefix}/users`} className="text-gray-500 hover:text-gray-700">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <h1 className="text-xl font-semibold text-gray-900">Nouvel utilisateur</h1>
                </div>
            }
        >
            <Head title="Nouvel utilisateur" />

            <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">
                {/* Account info */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900">Informations du compte</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                Nom
                            </label>
                            <input
                                id="name"
                                type="text"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                                required
                            />
                            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                                required
                            />
                            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="role_id" className="block text-sm font-medium text-gray-700 mb-1">
                                Role
                            </label>
                            <select
                                id="role_id"
                                value={data.role_id}
                                onChange={(e) => setData('role_id', e.target.value ? Number(e.target.value) : '')}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                                required
                            >
                                <option value="">Choisir un role...</option>
                                {roles.map((role) => (
                                    <option key={role.id} value={role.id}>
                                        {role.name}
                                    </option>
                                ))}
                            </select>
                            {errors.role_id && <p className="mt-1 text-xs text-red-600">{errors.role_id}</p>}
                        </div>

                        <div>
                            <label htmlFor="visibility" className="block text-sm font-medium text-gray-700 mb-1">
                                Visibilite du profil
                            </label>
                            <select
                                id="visibility"
                                value={data.profile_visibility}
                                onChange={(e) => setData('profile_visibility', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                            >
                                <option value="public">Public</option>
                                <option value="members_only">Membres uniquement</option>
                                <option value="private">Prive</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                            Biographie
                        </label>
                        <textarea
                            id="bio"
                            value={data.bio}
                            onChange={(e) => setData('bio', e.target.value)}
                            rows={3}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                            maxLength={1000}
                        />
                        <p className="text-xs text-gray-500 mt-1">{data.bio.length}/1000</p>
                        {errors.bio && <p className="mt-1 text-xs text-red-600">{errors.bio}</p>}
                    </div>
                </div>

                {/* Social Links */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900">Liens sociaux</h2>
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
                                    value={data.social_links[key] || ''}
                                    onChange={(e) =>
                                        setData('social_links', { ...data.social_links, [key]: e.target.value })
                                    }
                                    placeholder={placeholder}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Password */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900">Mot de passe</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                Mot de passe
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                                required
                                minLength={8}
                            />
                            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
                        </div>

                        <div>
                            <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700 mb-1">
                                Confirmer le mot de passe
                            </label>
                            <input
                                id="password_confirmation"
                                type="password"
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                                required
                                minLength={8}
                            />
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3">
                    <Link
                        href={`/${prefix}/users`}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Annuler
                    </Link>
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
                    >
                        {processing ? 'Enregistrement...' : 'Creer l\'utilisateur'}
                    </button>
                </div>
            </form>
        </AdminLayout>
    );
}

// ArrowLeft icon imported from lucide-react.
