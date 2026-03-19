import { Head, Link } from '@inertiajs/react';
import type { UserData, PostData, MenuData } from '@/types/cms';
import FrontLayout from '@/Layouts/FrontLayout';
import type { ThemeStyle } from '@/Layouts/Front/theme-helpers';

interface MemberShowProps {
    menus: Record<string, MenuData>;
    theme: {
        customizations: Record<string, string | boolean>;
        layouts: Array<{ slug: string; name: string }>;
        style?: ThemeStyle;
    };
    member: UserData & {
        avatar_url?: string | null;
        social_links?: Record<string, string> | null;
        profile_visibility?: string;
        role?: { name: string; slug: string };
    };
    posts: PostData[];
}

function formatDate(dateString: string | null | undefined): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
}

const SOCIAL_ICONS: Record<string, { label: string; icon: React.ReactNode }> = {
    website: {
        label: 'Site web',
        icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5a17.92 17.92 0 0 1-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
            </svg>
        ),
    },
    twitter: {
        label: 'Twitter / X',
        icon: (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
        ),
    },
    linkedin: {
        label: 'LinkedIn',
        icon: (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
        ),
    },
    github: {
        label: 'GitHub',
        icon: (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
            </svg>
        ),
    },
};

export default function MemberShow({ menus, theme, member, posts }: MemberShowProps) {
    const initials = member.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const socialLinks = member.social_links || {};
    const activeSocials = Object.entries(socialLinks).filter(([, url]) => url);

    return (
        <FrontLayout menus={menus} theme={theme}>
            <Head title={member.name} />

            {/* Hero banner with gradient */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[var(--color-primary,#6366f1)] via-[var(--color-primary,#6366f1)]/90 to-[var(--color-primary,#6366f1)]/60">
                {/* Background decorative elements */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
                </div>
                <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-white/5" />
                <div className="absolute -top-12 -left-12 h-48 w-48 rounded-full bg-white/5" />

                <div className="relative mx-auto max-w-7xl px-4 pb-28 pt-12">
                    <Link
                        href="/members"
                        className="mb-6 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium text-white/90 backdrop-blur-sm transition-all hover:bg-white/25"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                        </svg>
                        Retour aux membres
                    </Link>
                </div>
            </div>

            {/* Profile content - overlapping the hero */}
            <div className="mx-auto max-w-7xl px-4 -mt-20">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    {/* Profile card */}
                    <div className="lg:col-span-1">
                        <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-xl shadow-gray-200/50">
                            {/* Avatar with gradient ring */}
                            <div className="relative inline-block">
                                {member.avatar_url ? (
                                    <img
                                        src={member.avatar_url}
                                        alt={member.name}
                                        className="mx-auto h-32 w-32 rounded-full object-cover ring-4 ring-[var(--color-primary,#6366f1)]/20 shadow-lg"
                                    />
                                ) : (
                                    <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-primary,#6366f1)] to-[var(--color-primary,#6366f1)]/70 ring-4 ring-[var(--color-primary,#6366f1)]/20 shadow-lg">
                                        <span className="text-4xl font-bold text-white">{initials}</span>
                                    </div>
                                )}
                                <div className="absolute bottom-1 right-1 h-5 w-5 rounded-full border-3 border-white bg-emerald-400 shadow-sm" />
                            </div>

                            <h1 className="mt-5 text-2xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-heading)' }}>
                                {member.name}
                            </h1>

                            {member.role && (
                                <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary,#6366f1)]/10 px-4 py-1.5 text-xs font-semibold text-[var(--color-primary,#6366f1)]">
                                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary,#6366f1)]" />
                                    {member.role.name}
                                </span>
                            )}

                            {member.bio && (
                                <p className="mt-5 text-sm leading-relaxed text-gray-600">{member.bio}</p>
                            )}

                            {/* Social links */}
                            {activeSocials.length > 0 && (
                                <div className="mt-6 flex justify-center gap-3">
                                    {activeSocials.map(([key, url]) => {
                                        const social = SOCIAL_ICONS[key];
                                        if (!social) return null;
                                        return (
                                            <a
                                                key={key}
                                                href={url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-gray-500 transition-all duration-200 hover:bg-[var(--color-primary,#6366f1)] hover:text-white hover:scale-110 hover:shadow-md"
                                                title={social.label}
                                            >
                                                {social.icon}
                                            </a>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Stats bar */}
                            <div className="mt-6 flex items-center justify-center gap-6 border-t border-gray-100 pt-6">
                                <div className="text-center">
                                    <p className="text-xl font-bold text-gray-900">{posts.length}</p>
                                    <p className="text-xs text-gray-500">Articles</p>
                                </div>
                                <div className="h-8 w-px bg-gray-200" />
                                <div className="text-center">
                                    <p className="text-xs text-gray-500">Membre depuis</p>
                                    <p className="text-sm font-medium text-gray-700">{formatDate(member.created_at)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Posts */}
                    <div className="lg:col-span-2 pt-6">
                        <div className="mb-6 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-primary,#6366f1)]/10">
                                <svg className="h-5 w-5 text-[var(--color-primary,#6366f1)]" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-heading)' }}>
                                Articles publies
                            </h2>
                        </div>

                        {posts.length > 0 ? (
                            <div className="space-y-4">
                                {posts.map((post) => (
                                    <Link
                                        key={post.id}
                                        href={`/blog/${post.slug}`}
                                        className="group flex gap-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-gray-200/50 hover:-translate-y-0.5"
                                    >
                                        {post.featured_image && (
                                            <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-xl">
                                                <img
                                                    src={post.featured_image}
                                                    alt={post.title}
                                                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                />
                                            </div>
                                        )}
                                        <div className="min-w-0 flex flex-col justify-center">
                                            <h3 className="font-semibold text-gray-900 transition-colors duration-200 group-hover:text-[var(--color-primary,#6366f1)]">
                                                {post.title}
                                            </h3>
                                            {post.excerpt && (
                                                <p className="mt-1.5 text-sm text-gray-500 line-clamp-2">{post.excerpt}</p>
                                            )}
                                            <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-400">
                                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                                </svg>
                                                {formatDate(post.published_at)}
                                            </p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-12 text-center">
                                <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
                                </svg>
                                <p className="mt-4 text-sm font-medium text-gray-500">Aucun article publie pour le moment.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom spacer */}
            <div className="h-16" />
        </FrontLayout>
    );
}
