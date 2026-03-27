import { Head, Link, useForm, usePage } from '@inertiajs/react';
import type { PostData, TaxonomyTermData, MenuData, FlashMessages } from '@/types/cms';
import FrontLayout from '@/Layouts/FrontLayout';
import BlockRenderer from '@/Components/front/block-renderer';
import Breadcrumbs from '@/Components/front/breadcrumbs';
import SeoHead, { type SeoData } from '@/Components/front/seo-head';
import type { FormEvent } from 'react';

interface CommentData {
    id: number;
    author_name: string;
    author_email: string;
    content: string;
    created_at: string;
    user?: { id: number; name: string; avatar: string | null } | null;
    replies?: CommentData[];
}

interface BlogShowProps {
    menus: Record<string, MenuData>;
    theme: {
        customizations: Record<string, string>;
        layouts: Array<{ slug: string; name: string }>;
    };
    post: PostData;
    seo?: SeoData;
    comments: CommentData[];
    categories: Array<TaxonomyTermData & { posts_count: number }>;
    recentPosts: Array<{ id: number; title: string; slug: string; featured_image: string | null; published_at: string }>;
}

function formatDate(dateString: string | null): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
}

function CommentItem({ comment, postSlug }: { comment: CommentData; postSlug: string }) {
    return (
        <div className="border-b border-gray-100 py-4 last:border-0">
            <div className="flex items-center gap-3 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-600">
                    {(comment.user?.name || comment.author_name).charAt(0).toUpperCase()}
                </div>
                <div>
                    <span className="text-sm font-medium text-gray-900">
                        {comment.user?.name || comment.author_name}
                    </span>
                    <time className="ml-2 text-xs text-gray-500" dateTime={comment.created_at}>
                        {formatDate(comment.created_at)}
                    </time>
                </div>
            </div>
            <p className="ml-11 text-sm text-gray-700 whitespace-pre-line">{comment.content}</p>
            {comment.replies && comment.replies.length > 0 && (
                <div className="ml-11 mt-3 space-y-0 border-l-2 border-gray-100 pl-4">
                    {comment.replies.map((reply) => (
                        <CommentItem key={reply.id} comment={reply} postSlug={postSlug} />
                    ))}
                </div>
            )}
        </div>
    );
}

function CommentForm({ postSlug }: { postSlug: string }) {
    const { flash } = usePage().props as unknown as { flash: FlashMessages; [key: string]: unknown };

    const { data, setData, post, processing, errors, reset } = useForm({
        author_name: '',
        author_email: '',
        content: '',
    });

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        post(`/blog/${postSlug}/comments`, {
            onSuccess: () => reset(),
            preserveScroll: true,
        });
    }

    return (
        <div className="mt-8">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Laisser un commentaire</h3>
            {flash?.success && (
                <div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700">
                    {flash.success}
                </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label htmlFor="author_name" className="mb-1 block text-sm font-medium text-gray-700">
                            Nom *
                        </label>
                        <input
                            id="author_name"
                            type="text"
                            value={data.author_name}
                            onChange={(e) => setData('author_name', e.target.value)}
                            required
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[var(--color-primary,#3b82f6)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary,#3b82f6)]"
                        />
                        {errors.author_name && (
                            <p className="mt-1 text-xs text-red-600">{errors.author_name}</p>
                        )}
                    </div>
                    <div>
                        <label htmlFor="author_email" className="mb-1 block text-sm font-medium text-gray-700">
                            Email *
                        </label>
                        <input
                            id="author_email"
                            type="email"
                            value={data.author_email}
                            onChange={(e) => setData('author_email', e.target.value)}
                            required
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[var(--color-primary,#3b82f6)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary,#3b82f6)]"
                        />
                        {errors.author_email && (
                            <p className="mt-1 text-xs text-red-600">{errors.author_email}</p>
                        )}
                    </div>
                </div>
                <div>
                    <label htmlFor="comment_content" className="mb-1 block text-sm font-medium text-gray-700">
                        Commentaire *
                    </label>
                    <textarea
                        id="comment_content"
                        rows={5}
                        value={data.content}
                        onChange={(e) => setData('content', e.target.value)}
                        required
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[var(--color-primary,#3b82f6)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary,#3b82f6)]"
                    />
                    {errors.content && (
                        <p className="mt-1 text-xs text-red-600">{errors.content}</p>
                    )}
                </div>
                <button
                    type="submit"
                    disabled={processing}
                    className="rounded-md bg-[var(--color-primary,#3b82f6)] px-6 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                >
                    {processing ? 'Envoi...' : 'Publier le commentaire'}
                </button>
            </form>
        </div>
    );
}

export default function BlogShow({ post, seo, comments, categories, recentPosts, menus, theme }: BlogShowProps) {
    const postCategories = post.terms?.filter((t) => t.taxonomy_id !== undefined) || [];
    const postTags = post.terms?.filter(() => true) || [];

    const breadcrumbItems = [
        { label: 'Accueil', href: '/' },
        { label: 'Blog', href: '/blog' },
        { label: post.title },
    ];

    return (
        <FrontLayout menus={menus} theme={theme}>
            {seo && Object.keys(seo).length > 0 ? (
                <SeoHead seo={seo} fallbackTitle={post.title} fallbackDescription={post.excerpt ?? undefined} />
            ) : (
                <Head>
                    <title>{post.title}</title>
                    {post.excerpt && <meta name="description" content={post.excerpt} />}
                </Head>
            )}
            <div className="container py-10">
                <Breadcrumbs items={breadcrumbItems} />
                <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
                    <article>
                        {/* Header */}
                        <header className="mb-8">
                            {postCategories.length > 0 && (
                                <div className="mb-3 flex flex-wrap gap-2">
                                    {postCategories.map((term) => (
                                        <Link
                                            key={term.id}
                                            href={`/blog/category/${term.slug}`}
                                            className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-[var(--color-primary,#3b82f6)] hover:bg-blue-100"
                                        >
                                            {term.name}
                                        </Link>
                                    ))}
                                </div>
                            )}
                            <h1 className="mb-4 text-3xl font-bold leading-tight text-gray-900 lg:text-4xl">
                                {post.title}
                            </h1>
                            <div className="flex items-center gap-3 text-sm text-gray-500">
                                {post.author && (
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-600">
                                            {post.author.name.charAt(0).toUpperCase()}
                                        </div>
                                        <span>{post.author.name}</span>
                                    </div>
                                )}
                                {post.published_at && (
                                    <>
                                        <span aria-hidden="true">&middot;</span>
                                        <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>
                                    </>
                                )}
                            </div>
                        </header>

                        {/* Featured Image */}
                        {post.featured_image && (
                            <div className="mb-8 overflow-hidden rounded-lg">
                                <img
                                    src={post.featured_image}
                                    alt={post.title}
                                    className="w-full object-cover"
                                />
                            </div>
                        )}

                        {/* Content (block tree) */}
                        <div className="prose prose-lg max-w-none">
                            {post.content?.map((block) => (
                                <BlockRenderer key={block.id} block={block} />
                            )) || (
                                post.excerpt && <p>{post.excerpt}</p>
                            )}
                        </div>

                        {/* Tags */}
                        {postTags.length > 0 && (
                            <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-gray-200 pt-6">
                                <span className="text-sm font-medium text-gray-700">Tags :</span>
                                {postTags.map((tag) => (
                                    <Link
                                        key={tag.id}
                                        href={`/blog/tag/${tag.slug}`}
                                        className="rounded-md border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:border-[var(--color-primary,#3b82f6)] hover:text-[var(--color-primary,#3b82f6)]"
                                    >
                                        {tag.name}
                                    </Link>
                                ))}
                            </div>
                        )}

                        {/* Comments Section */}
                        <section className="mt-10 border-t border-gray-200 pt-8">
                            <h2 className="mb-6 text-xl font-semibold text-gray-900">
                                Commentaires ({comments.length})
                            </h2>
                            {comments.length > 0 ? (
                                <div className="space-y-0">
                                    {comments.map((comment) => (
                                        <CommentItem
                                            key={comment.id}
                                            comment={comment}
                                            postSlug={post.slug}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">
                                    Aucun commentaire pour le moment. Soyez le premier !
                                </p>
                            )}

                            {post.allow_comments && (
                                <CommentForm postSlug={post.slug} />
                            )}
                        </section>
                    </article>

                    {/* Sidebar */}
                    <aside className="space-y-8">
                        {/* Categories */}
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

                        {/* Recent Posts */}
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
