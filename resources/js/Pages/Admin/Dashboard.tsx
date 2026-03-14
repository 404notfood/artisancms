import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { cn } from '@/lib/utils';
import {
    FileText,
    Newspaper,
    Image,
    Users,
    Plus,
    ExternalLink,
    Server,
    Puzzle,
    Palette,
    Eye,
    MessageSquare,
    BarChart3,
    TrendingUp,
    FolderOpen,
} from 'lucide-react';
import { type ReactNode } from 'react';

interface CommentItem {
    id: number;
    author_name: string;
    content: string;
    status: string;
    created_at: string;
    user?: { name: string } | null;
}

interface MediaItem {
    id: number;
    filename: string;
    original_filename: string;
    mime_type: string;
    url: string;
    thumbnails: Record<string, string> | null;
}

interface TopPage {
    path: string;
    total: number;
}

interface DashboardProps {
    stats: {
        pages: number;
        posts: number;
        media: number;
        users: number;
    };
    recentPages: Array<{
        id: number;
        title: string;
        status: string;
        updated_at: string;
        author?: { name: string };
    }>;
    recentPosts: Array<{
        id: number;
        title: string;
        status: string;
        updated_at: string;
        author?: { name: string };
    }>;
    recentComments: CommentItem[];
    recentMedia: MediaItem[];
    contentStats: {
        published_pages: number;
        draft_pages: number;
        published_posts: number;
        draft_posts: number;
        pending_comments: number;
        total_comments: number;
    };
    analytics: {
        today_views: number;
        week_views: number;
        month_views: number;
        top_pages: TopPage[];
    };
    system: {
        cms_version: string;
        php_version: string;
        laravel_version: string;
        active_plugins: number;
        active_theme: string;
    };
}

const statusConfig: Record<string, { label: string; variant: string; className: string }> = {
    published: {
        label: 'Publie',
        variant: 'success',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    draft: {
        label: 'Brouillon',
        variant: 'warning',
        className: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    scheduled: {
        label: 'Planifie',
        variant: 'default',
        className: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    trash: {
        label: 'Corbeille',
        variant: 'destructive',
        className: 'bg-red-50 text-red-700 border-red-200',
    },
    pending: {
        label: 'En attente',
        variant: 'warning',
        className: 'bg-orange-50 text-orange-700 border-orange-200',
    },
    approved: {
        label: 'Approuve',
        variant: 'success',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    spam: {
        label: 'Spam',
        variant: 'destructive',
        className: 'bg-red-50 text-red-700 border-red-200',
    },
};

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMinutes < 1) return 'A l\'instant';
    if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;

    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

interface StatCardProps {
    label: string;
    value: number;
    icon: ReactNode;
    iconBg: string;
    iconColor: string;
    href?: string;
}

function StatCard({ label, value, icon, iconBg, iconColor, href }: StatCardProps) {
    const content = (
        <Card
            className={cn(
                'group relative overflow-hidden transition-all duration-200',
                href && 'cursor-pointer hover:shadow-md hover:-translate-y-0.5'
            )}
        >
            <CardContent className="p-6">
                <div className="flex items-center gap-4">
                    <div
                        className={cn(
                            'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
                            iconBg
                        )}
                    >
                        <div className={iconColor}>{icon}</div>
                    </div>
                    <div className="min-w-0">
                        <p className="text-3xl font-bold tracking-tight text-gray-900">
                            {value.toLocaleString('fr-FR')}
                        </p>
                        <p className="text-sm font-medium text-gray-500">{label}</p>
                    </div>
                </div>
            </CardContent>
            {href && (
                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-gray-200 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            )}
        </Card>
    );

    if (href) {
        return <Link href={href} className="block">{content}</Link>;
    }

    return content;
}

function StatusBadge({ status }: { status: string }) {
    const config = statusConfig[status];

    return (
        <Badge
            variant="outline"
            className={cn(
                'text-[11px] font-medium',
                config?.className ?? 'bg-gray-50 text-gray-600 border-gray-200'
            )}
        >
            {config?.label ?? status}
        </Badge>
    );
}

interface ContentTableProps {
    title: string;
    items: Array<{
        id: number;
        title: string;
        status: string;
        updated_at: string;
        author?: { name: string };
    }>;
    viewAllHref: string;
    emptyMessage: string;
    editHrefPrefix: string;
}

function ContentTable({ title, items, viewAllHref, emptyMessage, editHrefPrefix }: ContentTableProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-base">{title}</CardTitle>
                <Link
                    href={viewAllHref}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
                >
                    Voir tout
                </Link>
            </CardHeader>
            <CardContent>
                {items && items.length > 0 ? (
                    <div className="space-y-1">
                        {items.map((item) => (
                            <Link
                                key={item.id}
                                href={`${editHrefPrefix}/${item.id}/edit`}
                                className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-gray-50 group"
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                                        {item.title}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {item.author?.name && (
                                            <span>{item.author.name} &middot; </span>
                                        )}
                                        {formatDate(item.updated_at)}
                                    </p>
                                </div>
                                <StatusBadge status={item.status} />
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                            <FileText className="h-6 w-6 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-500">{emptyMessage}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function ContentStatsBar({ contentStats }: { contentStats: DashboardProps['contentStats'] }) {
    const maxVal = Math.max(
        contentStats?.published_pages ?? 0,
        contentStats?.draft_pages ?? 0,
        contentStats?.published_posts ?? 0,
        contentStats?.draft_posts ?? 0,
        1
    );

    const bars = [
        { label: 'Pages publiees', value: contentStats?.published_pages ?? 0, color: 'bg-blue-500' },
        { label: 'Pages brouillon', value: contentStats?.draft_pages ?? 0, color: 'bg-blue-200' },
        { label: 'Articles publies', value: contentStats?.published_posts ?? 0, color: 'bg-emerald-500' },
        { label: 'Articles brouillon', value: contentStats?.draft_posts ?? 0, color: 'bg-emerald-200' },
    ];

    return (
        <Card>
            <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                    <BarChart3 className="h-4 w-4 text-gray-500" />
                    Statistiques contenu
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {bars.map((bar) => (
                        <div key={bar.label}>
                            <div className="flex items-center justify-between text-sm mb-1">
                                <span className="text-gray-600">{bar.label}</span>
                                <span className="font-semibold text-gray-900">{bar.value}</span>
                            </div>
                            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                                <div
                                    className={cn('h-full rounded-full transition-all', bar.color)}
                                    style={{ width: `${Math.max((bar.value / maxVal) * 100, 2)}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

export default function Dashboard({
    stats,
    recentPages,
    recentPosts,
    recentComments,
    recentMedia,
    contentStats,
    analytics,
    system,
}: DashboardProps) {
    return (
        <AdminLayout
            header={
                <h1 className="text-xl font-semibold text-gray-900">Tableau de bord</h1>
            }
        >
            <Head title="Tableau de bord" />

            <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        label="Pages"
                        value={stats?.pages ?? 0}
                        icon={<FileText className="h-5 w-5" />}
                        iconBg="bg-blue-50"
                        iconColor="text-blue-600"
                        href="/admin/pages"
                    />
                    <StatCard
                        label="Articles"
                        value={stats?.posts ?? 0}
                        icon={<Newspaper className="h-5 w-5" />}
                        iconBg="bg-emerald-50"
                        iconColor="text-emerald-600"
                        href="/admin/posts"
                    />
                    <StatCard
                        label="Medias"
                        value={stats?.media ?? 0}
                        icon={<Image className="h-5 w-5" />}
                        iconBg="bg-purple-50"
                        iconColor="text-purple-600"
                        href="/admin/media"
                    />
                    <StatCard
                        label="Utilisateurs"
                        value={stats?.users ?? 0}
                        icon={<Users className="h-5 w-5" />}
                        iconBg="bg-orange-50"
                        iconColor="text-orange-600"
                    />
                </div>

                {/* Analytics Stats */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <StatCard
                        label="Vues aujourd'hui"
                        value={analytics?.today_views ?? 0}
                        icon={<Eye className="h-5 w-5" />}
                        iconBg="bg-cyan-50"
                        iconColor="text-cyan-600"
                        href="/admin/analytics"
                    />
                    <StatCard
                        label="Vues cette semaine"
                        value={analytics?.week_views ?? 0}
                        icon={<TrendingUp className="h-5 w-5" />}
                        iconBg="bg-indigo-50"
                        iconColor="text-indigo-600"
                        href="/admin/analytics"
                    />
                    <StatCard
                        label="Commentaires en attente"
                        value={contentStats?.pending_comments ?? 0}
                        icon={<MessageSquare className="h-5 w-5" />}
                        iconBg="bg-amber-50"
                        iconColor="text-amber-600"
                        href="/admin/comments"
                    />
                </div>

                {/* Quick Actions */}
                <Card>
                    <CardContent className="flex flex-wrap items-center gap-3 p-4">
                        <Link href="/admin/pages/create">
                            <Button size="sm" className="gap-1.5">
                                <Plus className="h-4 w-4" />
                                Nouvelle page
                            </Button>
                        </Link>
                        <Link href="/admin/posts/create">
                            <Button size="sm" variant="outline" className="gap-1.5">
                                <Plus className="h-4 w-4" />
                                Nouvel article
                            </Button>
                        </Link>
                        <Link href="/admin/content-types">
                            <Button size="sm" variant="outline" className="gap-1.5">
                                <Plus className="h-4 w-4" />
                                Nouveau type de contenu
                            </Button>
                        </Link>
                        <Link href="/admin/media">
                            <Button size="sm" variant="outline" className="gap-1.5">
                                <FolderOpen className="h-4 w-4" />
                                Gerer les medias
                            </Button>
                        </Link>
                        <a href="/" target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="outline" className="gap-1.5">
                                <ExternalLink className="h-4 w-4" />
                                Voir le site
                            </Button>
                        </a>
                    </CardContent>
                </Card>

                {/* Recent Content + Content Stats */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2 grid grid-cols-1 gap-6 md:grid-cols-2">
                        <ContentTable
                            title="Pages recentes"
                            items={recentPages}
                            viewAllHref="/admin/pages"
                            emptyMessage="Aucune page pour le moment."
                            editHrefPrefix="/admin/pages"
                        />
                        <ContentTable
                            title="Articles recents"
                            items={recentPosts}
                            viewAllHref="/admin/posts"
                            emptyMessage="Aucun article pour le moment."
                            editHrefPrefix="/admin/posts"
                        />
                    </div>
                    <ContentStatsBar contentStats={contentStats} />
                </div>

                {/* Recent Media */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Image className="h-4 w-4 text-gray-500" />
                            Derniers medias
                        </CardTitle>
                        <Link
                            href="/admin/media"
                            className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
                        >
                            Voir tout
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {recentMedia && recentMedia.length > 0 ? (
                            <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
                                {recentMedia.map((media) => (
                                    <Link
                                        key={media.id}
                                        href={`/admin/media/${media.id}`}
                                        className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100 border border-gray-200 hover:border-indigo-300 transition-colors"
                                    >
                                        {media.mime_type?.startsWith('image/') ? (
                                            <img
                                                src={media.thumbnails?.thumbnail ?? media.url}
                                                alt={media.original_filename}
                                                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center">
                                                <FileText className="h-6 w-6 text-gray-400" />
                                            </div>
                                        )}
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 text-center py-6">Aucun media pour le moment.</p>
                        )}
                    </CardContent>
                </Card>

                {/* Comments + Top Pages */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Recent Comments */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-4">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <MessageSquare className="h-4 w-4 text-gray-500" />
                                Commentaires recents
                            </CardTitle>
                            <Link
                                href="/admin/comments"
                                className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
                            >
                                Voir tout
                            </Link>
                        </CardHeader>
                        <CardContent>
                            {recentComments && recentComments.length > 0 ? (
                                <div className="space-y-3">
                                    {recentComments.map((comment) => (
                                        <div
                                            key={comment.id}
                                            className="flex items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                                                {(comment.user?.name ?? comment.author_name ?? '?').charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-gray-900 truncate">
                                                        {comment.user?.name ?? comment.author_name}
                                                    </span>
                                                    <StatusBadge status={comment.status} />
                                                </div>
                                                <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">
                                                    {comment.content}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    {formatDate(comment.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-10 text-center">
                                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                                        <MessageSquare className="h-6 w-6 text-gray-400" />
                                    </div>
                                    <p className="text-sm text-gray-500">Aucun commentaire pour le moment.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Top Pages */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-4">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <TrendingUp className="h-4 w-4 text-gray-500" />
                                Pages populaires
                            </CardTitle>
                            <Link
                                href="/admin/analytics"
                                className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
                            >
                                Voir tout
                            </Link>
                        </CardHeader>
                        <CardContent>
                            {analytics?.top_pages && analytics.top_pages.length > 0 ? (
                                <div className="space-y-2">
                                    {analytics.top_pages.map((page, index) => (
                                        <div
                                            key={page.path}
                                            className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-600">
                                                    {index + 1}
                                                </span>
                                                <span className="text-sm text-gray-900 truncate">
                                                    {page.path || '/'}
                                                </span>
                                            </div>
                                            <span className="text-sm font-semibold text-gray-600 shrink-0 ml-4">
                                                {Number(page.total).toLocaleString('fr-FR')} vues
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-10 text-center">
                                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                                        <BarChart3 className="h-6 w-6 text-gray-400" />
                                    </div>
                                    <p className="text-sm text-gray-500">Aucune donnee analytique disponible.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* System Info */}
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Server className="h-4 w-4 text-gray-500" />
                            Informations systeme
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                            <SystemInfoItem
                                label="ArtisanCMS"
                                value={`v${system?.cms_version ?? '1.0.0'}`}
                            />
                            <SystemInfoItem
                                label="PHP"
                                value={system?.php_version ?? '-'}
                            />
                            <SystemInfoItem
                                label="Laravel"
                                value={`v${system?.laravel_version ?? '-'}`}
                            />
                            <SystemInfoItem
                                label="Plugins actifs"
                                value={String(system?.active_plugins ?? 0)}
                                icon={<Puzzle className="h-3.5 w-3.5 text-gray-400" />}
                            />
                            <SystemInfoItem
                                label="Theme actif"
                                value={system?.active_theme ?? 'Default'}
                                icon={<Palette className="h-3.5 w-3.5 text-gray-400" />}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}

function SystemInfoItem({
    label,
    value,
    icon,
}: {
    label: string;
    value: string;
    icon?: ReactNode;
}) {
    return (
        <div className="space-y-1">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                {label}
            </p>
            <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                {icon}
                {value}
            </p>
        </div>
    );
}
