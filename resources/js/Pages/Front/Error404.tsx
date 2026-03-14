import { Head, Link, router } from '@inertiajs/react';
import type { MenuData } from '@/types/cms';
import FrontLayout from '@/Layouts/FrontLayout';
import { useState, type FormEvent } from 'react';

interface RecentItem {
    title: string;
    url: string;
}

interface Error404Props {
    menus: Record<string, MenuData>;
    theme: {
        customizations: Record<string, string>;
        layouts: Array<{ slug: string; name: string }>;
    };
    recentPages: RecentItem[];
    recentPosts: RecentItem[];
}

export default function Error404({ recentPages, recentPosts, menus, theme }: Error404Props) {
    const [searchQuery, setSearchQuery] = useState('');

    function handleSearch(e: FormEvent) {
        e.preventDefault();
        if (searchQuery.trim().length < 2) return;
        router.get('/search', { q: searchQuery.trim() });
    }

    return (
        <FrontLayout menus={menus} theme={theme}>
            <Head title="Page non trouvée" />
            <div className="container py-20">
                <div className="mx-auto max-w-2xl text-center">
                    {/* Illustration */}
                    <div className="mb-8">
                        <svg
                            className="mx-auto h-40 w-40 text-gray-300"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={0.5}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                            />
                        </svg>
                        <p className="mb-2 text-7xl font-bold text-gray-200">404</p>
                    </div>

                    <h1 className="mb-4 text-3xl font-bold text-gray-900">
                        Page non trouvée
                    </h1>
                    <p className="mb-8 text-lg text-gray-600">
                        La page que vous recherchez n&apos;existe pas ou a été déplacée.
                    </p>

                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="mx-auto mb-10 flex max-w-md gap-3">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Rechercher sur le site..."
                            className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-[var(--color-primary,#3b82f6)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#3b82f6)]/20"
                            minLength={2}
                        />
                        <button
                            type="submit"
                            className="rounded-lg bg-[var(--color-primary,#3b82f6)] px-6 py-3 font-medium text-white hover:opacity-90"
                        >
                            Rechercher
                        </button>
                    </form>

                    {/* Go to Homepage */}
                    <div className="mb-12">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50"
                        >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                            </svg>
                            Retour à l&apos;accueil
                        </Link>
                    </div>

                    {/* Suggested Content */}
                    {(recentPages.length > 0 || recentPosts.length > 0) && (
                        <div className="border-t border-gray-200 pt-10">
                            <h2 className="mb-6 text-xl font-semibold text-gray-900">
                                Vous pourriez être intéressé par
                            </h2>
                            <div className="grid gap-8 text-left sm:grid-cols-2">
                                {recentPages.length > 0 && (
                                    <div>
                                        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
                                            Pages
                                        </h3>
                                        <ul className="space-y-2">
                                            {recentPages.map((page, index) => (
                                                <li key={index}>
                                                    <Link
                                                        href={page.url}
                                                        className="text-sm text-gray-700 hover:text-[var(--color-primary,#3b82f6)] hover:underline"
                                                    >
                                                        {page.title}
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {recentPosts.length > 0 && (
                                    <div>
                                        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
                                            Articles récents
                                        </h3>
                                        <ul className="space-y-2">
                                            {recentPosts.map((post, index) => (
                                                <li key={index}>
                                                    <Link
                                                        href={post.url}
                                                        className="text-sm text-gray-700 hover:text-[var(--color-primary,#3b82f6)] hover:underline"
                                                    >
                                                        {post.title}
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </FrontLayout>
    );
}
