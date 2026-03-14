import { Head, Link, router } from '@inertiajs/react';
import type { MenuData } from '@/types/cms';
import FrontLayout from '@/Layouts/FrontLayout';
import Breadcrumbs from '@/Components/front/breadcrumbs';
import { useState, type FormEvent } from 'react';

interface SearchResult {
    type: 'page' | 'post';
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    url: string;
    published_at: string | null;
}

interface SearchPagination {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
}

interface SearchPageProps {
    menus: Record<string, MenuData>;
    theme: {
        customizations: Record<string, string>;
        layouts: Array<{ slug: string; name: string }>;
    };
    query: string;
    type: string | null;
    results: SearchResult[];
    total: number;
    pagination: SearchPagination;
}

function formatDate(dateString: string | null): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
}

function TypeBadge({ type }: { type: 'page' | 'post' }) {
    const config = {
        page: { label: 'Page', className: 'bg-purple-100 text-purple-700' },
        post: { label: 'Article', className: 'bg-blue-100 text-blue-700' },
    };
    const { label, className } = config[type];
    return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
            {label}
        </span>
    );
}

export default function SearchPage({ query, type, results, total, pagination, menus, theme }: SearchPageProps) {
    const [searchQuery, setSearchQuery] = useState(query);

    const breadcrumbItems = [
        { label: 'Accueil', href: '/' },
        { label: 'Recherche' },
    ];

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (searchQuery.trim().length < 2) return;
        router.get('/search', { q: searchQuery.trim() }, { preserveState: true });
    }

    function goToPage(page: number) {
        router.get('/search', { q: query, page, ...(type ? { type } : {}) }, { preserveState: true });
    }

    return (
        <FrontLayout menus={menus} theme={theme}>
            <Head title={query ? `Recherche : ${query}` : 'Recherche'} />
            <div className="container py-10">
                <Breadcrumbs items={breadcrumbItems} />

                {/* Search Form */}
                <div className="mx-auto mb-10 max-w-2xl">
                    <h1 className="mb-6 text-center text-3xl font-bold text-gray-900">Recherche</h1>
                    <form onSubmit={handleSubmit} className="flex gap-3">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Rechercher des pages et articles..."
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
                </div>

                {/* Results */}
                {query && (
                    <div className="mx-auto max-w-3xl">
                        <p className="mb-6 text-sm text-gray-500">
                            {total > 0
                                ? `${total} résultat${total > 1 ? 's' : ''} pour "${query}"`
                                : `Aucun résultat pour "${query}"`}
                        </p>

                        {results.length > 0 ? (
                            <div className="space-y-6">
                                {results.map((result) => (
                                    <article
                                        key={`${result.type}-${result.id}`}
                                        className="rounded-lg border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md"
                                    >
                                        <div className="mb-2 flex items-center gap-2">
                                            <TypeBadge type={result.type} />
                                            {result.published_at && (
                                                <time className="text-xs text-gray-500" dateTime={result.published_at}>
                                                    {formatDate(result.published_at)}
                                                </time>
                                            )}
                                        </div>
                                        <h2 className="mb-1 text-lg font-semibold">
                                            <Link
                                                href={result.url}
                                                className="text-gray-900 hover:text-[var(--color-primary,#3b82f6)]"
                                            >
                                                {result.title}
                                            </Link>
                                        </h2>
                                        {result.excerpt && (
                                            <p className="line-clamp-2 text-sm text-gray-600">{result.excerpt}</p>
                                        )}
                                        <Link
                                            href={result.url}
                                            className="mt-2 inline-block text-sm font-medium text-[var(--color-primary,#3b82f6)] hover:underline"
                                        >
                                            Lire la suite
                                        </Link>
                                    </article>
                                ))}
                            </div>
                        ) : (
                            <div className="py-16 text-center">
                                <svg
                                    className="mx-auto mb-4 h-16 w-16 text-gray-300"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={1.5}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                                    />
                                </svg>
                                <p className="text-lg font-medium text-gray-600">
                                    Aucun résultat trouvé
                                </p>
                                <p className="mt-1 text-sm text-gray-500">
                                    Essayez avec d&apos;autres mots-clés ou vérifiez l&apos;orthographe.
                                </p>
                            </div>
                        )}

                        {/* Pagination */}
                        {pagination.last_page > 1 && (
                            <nav aria-label="Pagination" className="mt-8 flex justify-center">
                                <ul className="flex items-center gap-1">
                                    {pagination.current_page > 1 && (
                                        <li>
                                            <button
                                                type="button"
                                                onClick={() => goToPage(pagination.current_page - 1)}
                                                className="inline-flex h-9 items-center rounded border border-gray-300 px-3 text-sm text-gray-700 hover:bg-gray-50"
                                            >
                                                Précédent
                                            </button>
                                        </li>
                                    )}
                                    {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((page) => (
                                        <li key={page}>
                                            <button
                                                type="button"
                                                onClick={() => goToPage(page)}
                                                className={`inline-flex h-9 min-w-[36px] items-center justify-center rounded px-3 text-sm ${
                                                    page === pagination.current_page
                                                        ? 'bg-[var(--color-primary,#3b82f6)] text-white'
                                                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                                                }`}
                                            >
                                                {page}
                                            </button>
                                        </li>
                                    ))}
                                    {pagination.current_page < pagination.last_page && (
                                        <li>
                                            <button
                                                type="button"
                                                onClick={() => goToPage(pagination.current_page + 1)}
                                                className="inline-flex h-9 items-center rounded border border-gray-300 px-3 text-sm text-gray-700 hover:bg-gray-50"
                                            >
                                                Suivant
                                            </button>
                                        </li>
                                    )}
                                </ul>
                            </nav>
                        )}
                    </div>
                )}
            </div>
        </FrontLayout>
    );
}
