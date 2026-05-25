import { Link, usePage } from '@inertiajs/react';
import type { SharedProps } from '@/types/cms';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { formatTimeAgo } from '@/lib/format';
import { AlertTriangle, CheckCircle2, Clock, FileText, Shield, UserRound } from 'lucide-react';
import type { DashboardProps } from './types';

export function SystemAlerts({ alerts }: { alerts: DashboardProps['systemAlerts'] }) {
    if (!alerts || alerts.length === 0) {
        return (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                <span className="inline-flex items-center gap-2 font-medium">
                    <CheckCircle2 className="h-4 w-4" />
                    Aucun signal systeme critique.
                </span>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {alerts.map((alert, index) => (
                <div key={`${alert.message}-${index}`} className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    <span className="inline-flex items-center gap-2 font-medium">
                        <AlertTriangle className="h-4 w-4" />
                        {alert.message}
                    </span>
                </div>
            ))}
        </div>
    );
}

export function WorkloadPanel({ workload }: { workload: DashboardProps['workload'] }) {
    const { cms } = usePage<SharedProps>().props;
    const prefix = cms?.adminPrefix ?? 'admin';
    const items = [
        { label: 'Pages en revue', value: workload.pages_pending_review, href: `/${prefix}/pages?status=pending_review` },
        { label: 'Articles en revue', value: workload.posts_pending_review, href: `/${prefix}/posts?status=pending_review` },
        { label: 'Pages planifiees', value: workload.scheduled_pages, href: `/${prefix}/pages?status=scheduled` },
        { label: 'Articles planifies', value: workload.scheduled_posts, href: `/${prefix}/posts?status=scheduled` },
        { label: 'Commentaires a moderer', value: workload.pending_comments, href: `/${prefix}/comments` },
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">File editoriale</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {items.map((item) => (
                    <Link key={item.label} href={item.href} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-gray-50">
                        <span className="text-sm text-gray-700">{item.label}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${item.value > 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                            {item.value}
                        </span>
                    </Link>
                ))}
            </CardContent>
        </Card>
    );
}

export function SecurityPanel({ security }: { security: DashboardProps['security'] }) {
    const { cms } = usePage<SharedProps>().props;
    const prefix = cms?.adminPrefix ?? 'admin';

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Shield className="h-4 w-4 text-indigo-600" />
                    Securite
                </CardTitle>
                <Link href={`/${prefix}/settings`} className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                    Regler
                </Link>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                    <SecurityMetric label="Sessions" value={security.active_sessions} />
                    <SecurityMetric label="Echecs 24h" value={security.failed_logins_24h} danger={security.failed_logins_24h > 0} />
                </div>
                <div className="rounded-lg bg-gray-50 p-3 text-sm">
                    <p className="text-gray-500">Prefix admin</p>
                    <p className="font-mono font-medium text-gray-900">/{security.admin_prefix}</p>
                </div>
                {security.alerts.length > 0 ? (
                    <div className="space-y-1">
                        {security.alerts.map((alert) => (
                            <p key={alert} className="flex items-center gap-2 text-xs text-amber-700">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                {alert}
                            </p>
                        ))}
                    </div>
                ) : (
                    <p className="flex items-center gap-2 text-xs text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Configuration sans alerte immediate.
                    </p>
                )}
                <Link href={`/${prefix}/system/sessions`} className="block rounded-lg border border-gray-200 px-3 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50">
                    Voir les sessions
                </Link>
            </CardContent>
        </Card>
    );
}

function SecurityMetric({ label, value, danger = false }: { label: string; value: number; danger?: boolean }) {
    return (
        <div className={`rounded-lg p-3 ${danger ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-900'}`}>
            <p className="text-xs opacity-70">{label}</p>
            <p className="text-xl font-semibold">{value}</p>
        </div>
    );
}

export function MyDraftsPanel({ myDrafts }: { myDrafts: DashboardProps['myDrafts'] }) {
    const { cms } = usePage<SharedProps>().props;
    const prefix = cms?.adminPrefix ?? 'admin';
    const drafts = [
        ...myDrafts.pages.map((item) => ({ ...item, type: 'pages', label: 'Page' })),
        ...myDrafts.posts.map((item) => ({ ...item, type: 'posts', label: 'Article' })),
    ].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).slice(0, 6);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Mes brouillons</CardTitle>
            </CardHeader>
            <CardContent>
                {drafts.length === 0 ? (
                    <p className="py-8 text-center text-sm text-gray-500">Aucun brouillon recent.</p>
                ) : (
                    <div className="space-y-1">
                        {drafts.map((draft) => (
                            <Link key={`${draft.type}-${draft.id}`} href={`/${prefix}/${draft.type}/${draft.id}/edit`} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-gray-50">
                                <FileText className="h-4 w-4 text-gray-400" />
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm font-medium text-gray-900">{draft.title}</span>
                                    <span className="text-xs text-gray-500">{draft.label} - {formatTimeAgo(draft.updated_at)}</span>
                                </span>
                            </Link>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export function RecentActivityPanel({ activity }: { activity: DashboardProps['recentActivity'] }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Activite recente</CardTitle>
            </CardHeader>
            <CardContent>
                {activity.length === 0 ? (
                    <p className="py-8 text-center text-sm text-gray-500">Aucune activite recente.</p>
                ) : (
                    <div className="space-y-1">
                        {activity.map((entry) => (
                            <div key={entry.id} className="flex items-center gap-3 rounded-lg px-3 py-2">
                                <UserRound className="h-4 w-4 text-gray-400" />
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm text-gray-900">
                                        {entry.user?.name ?? 'Systeme'} - {entry.action}
                                    </span>
                                    <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                                        <Clock className="h-3 w-3" />
                                        {formatTimeAgo(entry.created_at)}
                                    </span>
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
