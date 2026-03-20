import { useForm, usePage } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { ADMIN_INPUT_FOCUS, adminBtnPrimary } from '@/lib/admin-theme';
import type { SharedProps } from '@/types/cms';

interface ProfileTabProps {
    user: {
        name: string;
        email: string;
        bio?: string;
        profile_visibility?: string;
        social_links?: Record<string, string> | null;
    };
}

export default function ProfileTab({ user }: ProfileTabProps) {
    const { cms } = usePage<SharedProps>().props;
    const prefix = cms?.adminPrefix ?? 'admin';
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
        const filtered: Record<string, string> = {};
        Object.entries(form.data.social_links).forEach(([k, v]) => {
            if (v) filtered[k] = v;
        });
        form.transform((data) => ({
            ...data,
            social_links: Object.keys(filtered).length > 0 ? filtered : null,
        }));
        form.put(`/${prefix}/account`);
    };

    return (
        <form onSubmit={submit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                    <input
                        id="name"
                        type="text"
                        value={form.data.name}
                        onChange={(e) => form.setData('name', e.target.value)}
                        className={`w-full rounded-lg border border-gray-300 px-3 py-2 text-sm ${ADMIN_INPUT_FOCUS}`}
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
                        className={`w-full rounded-lg border border-gray-300 px-3 py-2 text-sm ${ADMIN_INPUT_FOCUS}`}
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
                    className={`w-full rounded-lg border border-gray-300 px-3 py-2 text-sm ${ADMIN_INPUT_FOCUS}`}
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
                    className={`w-full rounded-lg border border-gray-300 px-3 py-2 text-sm ${ADMIN_INPUT_FOCUS}`}
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
                                className={`w-full rounded-lg border border-gray-300 px-3 py-2 text-sm ${ADMIN_INPUT_FOCUS}`}
                            />
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-end pt-2">
                <button
                    type="submit"
                    disabled={form.processing}
                    className="inline-flex items-center rounded-lg px-5 py-2.5 text-sm font-medium text-white shadow-sm disabled:opacity-50 hover:brightness-110 transition-all"
                    style={adminBtnPrimary}
                >
                    {form.processing ? 'Enregistrement...' : 'Enregistrer'}
                </button>
            </div>
        </form>
    );
}
