import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import type { MenuData } from '@/types/cms';
import FrontLayout from '@/Layouts/FrontLayout';
import type { ThemeStyle } from '@/Layouts/Front/theme-helpers';

interface ProfileData {
    display_name: string;
    first_name: string | null;
    last_name: string | null;
    bio: string | null;
    avatar: string | null;
    cover_photo: string | null;
    phone: string | null;
    website: string | null;
    location: string | null;
    birth_date: string | null;
    gender: string | null;
    company: string | null;
    job_title: string | null;
    social_links: Record<string, string> | null;
    profile_visibility: string;
    show_in_directory: boolean;
    show_email: boolean;
    show_phone: boolean;
}

interface CustomField {
    id: number;
    name: string;
    slug: string;
    type: string;
    options: string[] | null;
    placeholder: string | null;
    required: boolean;
}

interface EditProfileProps {
    menus: Record<string, MenuData>;
    theme: {
        customizations: Record<string, string | boolean>;
        layouts: Array<{ slug: string; name: string }>;
        style?: ThemeStyle;
    };
    user: { id: number; name: string; email: string };
    profile: ProfileData;
    customFields: CustomField[];
    fieldValues: Record<number, string>;
}

export default function EditProfile({ menus, theme, user, profile, customFields, fieldValues }: EditProfileProps) {
    const { data, setData, put, processing, errors } = useForm({
        display_name: profile.display_name || user.name,
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        bio: profile.bio || '',
        phone: profile.phone || '',
        website: profile.website || '',
        location: profile.location || '',
        birth_date: profile.birth_date || '',
        gender: profile.gender || '',
        company: profile.company || '',
        job_title: profile.job_title || '',
        social_links: profile.social_links || {},
        profile_visibility: profile.profile_visibility || 'public',
        show_in_directory: profile.show_in_directory ?? true,
        show_email: profile.show_email ?? false,
        show_phone: profile.show_phone ?? false,
        custom_fields: fieldValues || {},
    });

    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        put('/members/account/profile');
    }

    function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setAvatarPreview(URL.createObjectURL(file));
        const formData = new FormData();
        formData.append('avatar', file);
        router.post('/members/account/avatar', formData);
    }

    function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('cover_photo', file);
        router.post('/members/account/cover', formData);
    }

    const inputClass = 'mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--color-primary,#6366f1)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary,#6366f1)]';
    const labelClass = 'block text-sm font-medium text-gray-700';

    const avatarUrl = avatarPreview || (profile.avatar ? `/storage/${profile.avatar}` : null);

    return (
        <FrontLayout menus={menus} theme={theme}>
            <Head title="Modifier mon profil" />

            <div className="mx-auto max-w-3xl px-4 py-8">
                <h1 className="mb-8 text-2xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-heading)' }}>
                    Modifier mon profil
                </h1>

                {/* Avatar + Cover */}
                <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6">
                    <h2 className="mb-4 text-lg font-medium text-gray-900">Photos</h2>
                    <div className="flex items-center gap-6">
                        <div>
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Avatar" className="h-20 w-20 rounded-full object-cover ring-2 ring-[var(--color-primary,#6366f1)]/20" />
                            ) : (
                                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-primary,#6366f1)]/10 text-2xl font-bold text-[var(--color-primary,#6366f1)]">
                                    {data.display_name.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="inline-flex cursor-pointer items-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                                Changer la photo
                                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarUpload} className="hidden" />
                            </label>
                            <label className="ml-2 inline-flex cursor-pointer items-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                                Couverture
                                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleCoverUpload} className="hidden" />
                            </label>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic info */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
                        <h2 className="text-lg font-medium text-gray-900">Informations</h2>

                        <div>
                            <label className={labelClass}>Nom d'affichage *</label>
                            <input type="text" value={data.display_name} onChange={(e) => setData('display_name', e.target.value)} className={inputClass} required />
                            {errors.display_name && <p className="mt-1 text-sm text-red-600">{errors.display_name}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Prenom</label>
                                <input type="text" value={data.first_name} onChange={(e) => setData('first_name', e.target.value)} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Nom</label>
                                <input type="text" value={data.last_name} onChange={(e) => setData('last_name', e.target.value)} className={inputClass} />
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}>Bio</label>
                            <textarea value={data.bio} onChange={(e) => setData('bio', e.target.value)} className={inputClass} rows={3} maxLength={500} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Entreprise</label>
                                <input type="text" value={data.company} onChange={(e) => setData('company', e.target.value)} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Poste</label>
                                <input type="text" value={data.job_title} onChange={(e) => setData('job_title', e.target.value)} className={inputClass} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Telephone</label>
                                <input type="tel" value={data.phone} onChange={(e) => setData('phone', e.target.value)} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Site web</label>
                                <input type="url" value={data.website} onChange={(e) => setData('website', e.target.value)} className={inputClass} placeholder="https://" />
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}>Localisation</label>
                            <input type="text" value={data.location} onChange={(e) => setData('location', e.target.value)} className={inputClass} placeholder="Paris, France" />
                        </div>
                    </div>

                    {/* Social links */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
                        <h2 className="text-lg font-medium text-gray-900">Reseaux sociaux</h2>
                        {['twitter', 'linkedin', 'facebook', 'instagram', 'github', 'youtube'].map((platform) => (
                            <div key={platform}>
                                <label className={labelClass}>{platform.charAt(0).toUpperCase() + platform.slice(1)}</label>
                                <input
                                    type="url"
                                    value={(data.social_links as Record<string, string>)[platform] || ''}
                                    onChange={(e) => setData('social_links', { ...data.social_links, [platform]: e.target.value })}
                                    className={inputClass}
                                    placeholder={`https://${platform}.com/...`}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Privacy */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
                        <h2 className="text-lg font-medium text-gray-900">Confidentialite</h2>

                        <div>
                            <label className={labelClass}>Visibilite du profil</label>
                            <select value={data.profile_visibility} onChange={(e) => setData('profile_visibility', e.target.value)} className={inputClass}>
                                <option value="public">Public</option>
                                <option value="members_only">Membres uniquement</option>
                                <option value="private">Prive</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="flex items-center gap-2">
                                <input type="checkbox" checked={data.show_in_directory} onChange={(e) => setData('show_in_directory', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-[var(--color-primary,#6366f1)]" />
                                <span className="text-sm text-gray-700">Apparaitre dans l'annuaire</span>
                            </label>
                            <label className="flex items-center gap-2">
                                <input type="checkbox" checked={data.show_email} onChange={(e) => setData('show_email', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-[var(--color-primary,#6366f1)]" />
                                <span className="text-sm text-gray-700">Afficher mon email</span>
                            </label>
                            <label className="flex items-center gap-2">
                                <input type="checkbox" checked={data.show_phone} onChange={(e) => setData('show_phone', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-[var(--color-primary,#6366f1)]" />
                                <span className="text-sm text-gray-700">Afficher mon telephone</span>
                            </label>
                        </div>
                    </div>

                    {/* Custom fields */}
                    {customFields.length > 0 && (
                        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
                            <h2 className="text-lg font-medium text-gray-900">Informations supplementaires</h2>
                            {customFields.map((field) => (
                                <div key={field.id}>
                                    <label className={labelClass}>
                                        {field.name} {field.required && '*'}
                                    </label>
                                    {field.type === 'textarea' ? (
                                        <textarea
                                            value={(data.custom_fields as Record<number, string>)[field.id] || ''}
                                            onChange={(e) => setData('custom_fields', { ...data.custom_fields, [field.id]: e.target.value })}
                                            className={inputClass}
                                            rows={3}
                                            placeholder={field.placeholder || ''}
                                            required={field.required}
                                        />
                                    ) : field.type === 'select' ? (
                                        <select
                                            value={(data.custom_fields as Record<number, string>)[field.id] || ''}
                                            onChange={(e) => setData('custom_fields', { ...data.custom_fields, [field.id]: e.target.value })}
                                            className={inputClass}
                                            required={field.required}
                                        >
                                            <option value="">Selectionner...</option>
                                            {field.options?.map((opt) => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    ) : field.type === 'checkbox' ? (
                                        <label className="flex items-center gap-2 mt-1">
                                            <input
                                                type="checkbox"
                                                checked={(data.custom_fields as Record<number, string>)[field.id] === '1'}
                                                onChange={(e) => setData('custom_fields', { ...data.custom_fields, [field.id]: e.target.checked ? '1' : '0' })}
                                                className="h-4 w-4 rounded border-gray-300 text-[var(--color-primary,#6366f1)]"
                                            />
                                            <span className="text-sm text-gray-600">{field.placeholder || field.name}</span>
                                        </label>
                                    ) : (
                                        <input
                                            type={field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                                            value={(data.custom_fields as Record<number, string>)[field.id] || ''}
                                            onChange={(e) => setData('custom_fields', { ...data.custom_fields, [field.id]: e.target.value })}
                                            className={inputClass}
                                            placeholder={field.placeholder || ''}
                                            required={field.required}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-lg bg-[var(--color-primary,#6366f1)] px-6 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition-all"
                        >
                            {processing ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                    </div>
                </form>
            </div>
        </FrontLayout>
    );
}
