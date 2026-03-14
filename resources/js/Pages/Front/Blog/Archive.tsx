import { Head, Link } from '@inertiajs/react';
import type { PostData, TaxonomyTermData, MenuData } from '@/types/cms';
import FrontLayout from '@/Layouts/FrontLayout';
import Breadcrumbs from '@/Components/front/breadcrumbs';

interface ArchiveEntry {
    year: number;
    month: number;
    count: number;
}

interface PaginatedPosts {
    data: PostData[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface BlogArchiveProps {
    menus: Record<string, MenuData>;
    theme: {
        customizations: Record<string, string>;
        layouts: Array<{ slug: string; name: string }>;
    };
    posts: PaginatedPosts;
    year: number;
    month: number | null;
    categories: Array<TaxonomyTermData & { posts_count: number }>;
    recentPosts: Array<{ id: number; title: string; slug: string; featured_image: string | null; published_at: string }>;
    archives: ArchiveEntry[];
}

const MONTH_NAMES = [
    '', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

function formatDate(dateString: string | null): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
}

function PostCard({ post }: { post: PostData }) {
    return (
        <article className="group overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
            {post.featured_image && (
                <Link href={`/blog/${post.slug}`} className="block aspect-video overflow-hidden">
                    <img
                        src={post.featured_image}
                        alt={post.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                </Link>
            )}
            <div className="p-5">
                <h2 className="mb-2 text-xl font-semibold">
                    <Link
                        href={`/blog/${post.slug}`}
                        className="text-gray-900 hover:text-[var(--color-primary,#3b82f6)]"
                    >
                        {post.title}
                    </Link>
                </h2>
                {post.excerpt && (
                    <p className="mb-3 line-clamp-3 text-sm text-gray-600">{post.excerpt}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-gray-500">
                    {post.author && <span>{post.author.name}</span>}
                    {post.published_at && (
                        <>
                            <span aria-hidden="true">&middot;</span>
                            <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>
                        </>
                    )}
                </div>
            </div>
        </article>
    );
}

function Pagination({ posts }: { posts: PaginatedPosts }) {
    if (posts.last_page <= 1) return null;

    return (
        <nav aria-label="Pagination" className="mt-8 flex justify-center">
            <ul className="flex items-center gap-1">
                {posts.links.map((link, index) => (
                    <li key={index}>
                        {link.url ? (
                            <Link
                                href={link.url}
                                className={`inline-flex h-9 min-w-[36px] items-center justify-center rounded px-3 text-sm ${
                                    link.active
                                        ? 'bg-[var(--color-primary,#3b82f6)] text-white'
                                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                                preserveScroll
                            />
                        ) : (
                            <span
                                className="inline-flex h-9 min-w-[36px] items-center justify-center rounded px-3 text-sm text-gray-400"
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        )}
                    </li>
                ))}
            </ul>
        </nav>
    );
}

export default function BlogArchive({ posts, year, month, categories, recentPosts, archives, menus, theme }: BlogArchiveProps) {
    const archiveLabel = month
        ? `${MONTH_NAMES[month]} ${year}`
        : `${year}`;

    const breadcrumbItems = [
        { label: 'Accueil', href: '/' },
        { label: 'Blog', href: '/blog' },
        { label: `Archives : ${archiveLabel}` },
    ];

    return (
        <FrontLayout menus={menus} theme={theme}>
            <Head title={`Archives : ${archiveLabel}`} />
            <div className="container py-10">
                <Breadcrumbs items={breadcrumbItems} />
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Archives : {archiveLabel}
                    </h1>
                </header>
                <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
                    <div>
                        {posts.data.length > 0 ? (
                            <>
                                <div className="grid gap-6 sm:grid-cols-2">
                                    {posts.data.map((post) => (
                                        <PostCard key={post.id} post={post} />
                                    ))}
                                </div>
                                <Pagination posts={posts} />
                            </>
                        ) : (
                            <div className="py-20 text-center text-gray-500">
                                Aucun article pour cette période.
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <aside className="space-y-8">
                        {categories.length > 0 && (
                            <div className="rounded-lg border border-gray-200 bg-white p-5">
                                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-900">
                                    Catégories
                                </h3>
                                <ul className="space-y-2">
                                    {categories.map((cat) => (
                                        <li key={cat.id}>
                                            <Link
                                                href={`/blog/category/${cat.slug}`}
                                                className="flex items-center justify-between text-sm text-gray-700 hover:text-[var(--color-primary,#3b82f6)]"
                                            >
                                                <span>{cat.name}</span>
                                                <span className="text-xs text-gray-400">({cat.posts_count})</span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {archives.length > 0 && (
                            <div className="rounded-lg border border-gray-200 bg-white p-5">
                                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-900">
                                    Archives
                                </h3>
                                <ul className="space-y-2">
                                    {archives.map((entry) => (
                                        <li key={`${entry.year}-${entry.month}`}>
                                            <Link
                                                href={`/blog/archive/${entry.year}/${entry.month}`}
                                                className={`flex items-center justify-between text-sm hover:text-[var(--color-primary,#3b82f6)] ${
                                                    entry.year === year && entry.month === month
                                                        ? 'font-semibold text-[var(--color-primary,#3b82f6)]'
                                                        : 'text-gray-700'
                                                }`}
                                            >
                                                <span>{MONTH_NAMES[entry.month]} {entry.year}</span>
                                                <span className="text-xs text-gray-400">({entry.count})</span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {recentPosts.length > 0 && (
                            <div className="rounded-lg border border-gray-200 bg-white p-5">
                                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-900">
                                    Articles récents
                                </h3>
                                <ul className="space-y-3">
                                    {recentPosts.map((p) => (
                                        <li key={p.id} className="flex gap-3">
                                            {p.featured_image && (
                                                <Link href={`/blog/${p.slug}`} className="block h-12 w-12 flex-shrink-0 overflow-hidden rounded">
                                                    <img
                                                        src={p.featured_image}
                                                        alt={p.title}
                                                        className="h-full w-full object-cover"
                                                    />
                                                </Link>
                                            )}
                                            <div className="min-w-0">
                                                <Link
                                                    href={`/blog/${p.slug}`}
                                                    className="line-clamp-2 text-sm font-medium text-gray-900 hover:text-[var(--color-primary,#3b82f6)]"
                                                >
                                                    {p.title}
                                                </Link>
                                                <time className="text-xs text-gray-500" dateTime={p.published_at}>
                                                    {formatDate(p.published_at)}
                                                </time>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </aside>
                </div>
            </div>
        </FrontLayout>
    );
}
