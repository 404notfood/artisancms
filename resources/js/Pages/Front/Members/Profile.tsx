import { Head } from '@inertiajs/react';
import type { MenuData } from '@/types/cms';
import FrontLayout from '@/Layouts/FrontLayout';
import type { ThemeStyle } from '@/Layouts/Front/theme-helpers';

interface SocialLinks {
    twitter?: string;
    linkedin?: string;
    facebook?: string;
    instagram?: string;
    github?: string;
    youtube?: string;
}

interface ProfileData {
    id: number;
    display_name: string;
    first_name: string | null;
    last_name: string | null;
    bio: string | null;
    avatar: string | null;
    cover_photo: string | null;
    phone: string | null;
    website: string | null;
    location: string | null;
    company: string | null;
    job_title: string | null;
    social_links: SocialLinks | null;
    show_email: boolean;
    show_phone: boolean;
    profile_completion: number;
    last_active_at: string | null;
    created_at: string;
}

interface CustomFieldValue {
    id: number;
    name: string;
    type: string;
    value: string | null;
}

interface MemberData {
    user: {
        id: number;
        name: string;
        email: string | null;
    };
    profile: ProfileData;
    custom_fields: CustomFieldValue[];
}

interface ProfileProps {
    menus: Record<string, MenuData>;
    theme: {
        customizations: Record<string, string | boolean>;
        layouts: Array<{ slug: string; name: string }>;
        style?: ThemeStyle;
    };
    member: MemberData;
}

export default function Profile({ menus, theme, member }: ProfileProps) {
    const { user, profile, custom_fields } = member;
    const displayName = profile.display_name || user.name;
    const avatarUrl = profile.avatar ? `/storage/${profile.avatar}` : null;
    const coverUrl = profile.cover_photo ? `/storage/${profile.cover_photo}` : null;
    const socialLinks = profile.social_links || {};

    return (
        <FrontLayout menus={menus} theme={theme}>
            <Head title={displayName} />

            <div className="mx-auto max-w-4xl px-4 py-8">
                {/* Cover + Avatar */}
                <div className="relative mb-16 overflow-hidden rounded-2xl shadow-xl">
                    <div
                        className="h-48 w-full bg-gradient-to-br from-[var(--color-primary,#6366f1)] via-[var(--color-primary,#6366f1)]/80 to-[var(--color-primary,#6366f1)]/60 sm:h-64"
                        style={coverUrl ? { backgroundImage: `url(${coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
                    >
                        {/* Pattern overlay when no cover */}
                        {!coverUrl && (
                            <div className="absolute inset-0 opacity-10">
                                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
                            </div>
                        )}
                    </div>
                    <div className="absolute -bottom-12 left-6">
                        <div className="relative">
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt={displayName}
                                    className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-lg sm:h-32 sm:w-32 ring-4 ring-[var(--color-primary,#6366f1)]/20"
                                />
                            ) : (
                                <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-[var(--color-primary,#6366f1)] to-[var(--color-primary,#6366f1)]/70 text-3xl font-bold text-white shadow-lg sm:h-32 sm:w-32 ring-4 ring-[var(--color-primary,#6366f1)]/20">
                                    {displayName.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className="absolute bottom-1 right-1 h-5 w-5 rounded-full border-3 border-white bg-emerald-400 shadow-sm" />
                        </div>
                    </div>
                </div>

                {/* Info */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
                    {(profile.job_title || profile.company) && (
                        <p className="mt-1.5 text-gray-600">
                            {profile.job_title}
                            {profile.job_title && profile.company && ' chez '}
                            <span className="font-medium">{profile.company}</span>
                        </p>
                    )}
                    {profile.location && (
                        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-gray-500">
                            <MapPinIcon />
                            {profile.location}
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    {/* Main content */}
                    <div className="space-y-6 lg:col-span-2">
                        {profile.bio && (
                            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                                <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-primary,#6366f1)]/10">
                                        <svg className="h-3.5 w-3.5 text-[var(--color-primary,#6366f1)]" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                        </svg>
                                    </div>
                                    A propos
                                </h2>
                                <p className="whitespace-pre-line text-gray-600 leading-relaxed">{profile.bio}</p>
                            </div>
                        )}

                        {custom_fields.length > 0 && (
                            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-primary,#6366f1)]/10">
                                        <svg className="h-3.5 w-3.5 text-[var(--color-primary,#6366f1)]" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                                        </svg>
                                    </div>
                                    Informations
                                </h2>
                                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    {custom_fields.filter(f => f.value).map((field) => (
                                        <div key={field.id} className="rounded-xl bg-gray-50 p-3">
                                            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">{field.name}</dt>
                                            <dd className="mt-1 text-sm font-medium text-gray-900">{field.value}</dd>
                                        </div>
                                    ))}
                                </dl>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Contact */}
                        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400">Contact</h3>
                            <div className="space-y-3">
                                {user.email && (
                                    <a href={`mailto:${user.email}`} className="flex items-center gap-3 rounded-lg p-2 text-sm text-gray-700 transition-colors hover:bg-[var(--color-primary,#6366f1)]/5 hover:text-[var(--color-primary,#6366f1)]">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                                            <MailIcon />
                                        </div>
                                        <span className="truncate">{user.email}</span>
                                    </a>
                                )}
                                {profile.show_phone && profile.phone && (
                                    <div className="flex items-center gap-3 rounded-lg p-2 text-sm text-gray-700">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                                            <PhoneIcon />
                                        </div>
                                        {profile.phone}
                                    </div>
                                )}
                                {profile.website && (
                                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-lg p-2 text-sm text-gray-700 transition-colors hover:bg-[var(--color-primary,#6366f1)]/5 hover:text-[var(--color-primary,#6366f1)]">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                                            <GlobeIcon />
                                        </div>
                                        <span className="truncate">{profile.website.replace(/^https?:\/\//, '')}</span>
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Social */}
                        {Object.values(socialLinks).some(Boolean) && (
                            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                                <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400">Reseaux sociaux</h3>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(socialLinks).map(([key, url]) =>
                                        url ? (
                                            <a
                                                key={key}
                                                href={url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="rounded-xl bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-[var(--color-primary,#6366f1)]/10 hover:text-[var(--color-primary,#6366f1)] hover:scale-105"
                                            >
                                                {key.charAt(0).toUpperCase() + key.slice(1)}
                                            </a>
                                        ) : null
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Member since */}
                        <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-6 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-primary,#6366f1)]/10">
                                    <svg className="h-5 w-5 text-[var(--color-primary,#6366f1)]" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Membre depuis</p>
                                    <p className="text-sm font-semibold text-gray-900">
                                        {new Date(profile.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </FrontLayout>
    );
}

function MapPinIcon() {
    return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
    );
}

function MailIcon() {
    return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
        </svg>
    );
}

function PhoneIcon() {
    return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
        </svg>
    );
}

function GlobeIcon() {
    return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
        </svg>
    );
}
