import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import {
    FileText,
    Newspaper,
    Image,
    Users,
    Eye,
    MessageSquare,
    TrendingUp,
} from 'lucide-react';
import type { DashboardProps } from './dashboard/types';
import { StatCard } from './dashboard/StatCard';
import { QuickActions } from './dashboard/QuickActions';
import { ContentTable } from './dashboard/ContentTable';
import { ContentStatsBar } from './dashboard/ContentStatsBar';
import { RecentMedia } from './dashboard/RecentMedia';
import { RecentComments } from './dashboard/RecentComments';
import { TopPages } from './dashboard/TopPages';
import { SystemInfo } from './dashboard/SystemInfo';

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
                <QuickActions />

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
                <RecentMedia recentMedia={recentMedia} />

                {/* Comments + Top Pages */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <RecentComments recentComments={recentComments} />
                    <TopPages analytics={analytics} />
                </div>

                {/* System Info */}
                <SystemInfo system={system} />
            </div>
        </AdminLayout>
    );
}
