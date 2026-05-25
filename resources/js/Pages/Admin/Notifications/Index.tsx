import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import type { SharedProps } from '@/types/cms';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Bell, CheckCheck, MessageSquare, Trash2, Archive, AlertTriangle, Info, ShieldCheck } from 'lucide-react';

interface NotificationItem {
    id: number;
    type: string;
    title: string;
    message: string;
    data: Record<string, unknown> | null;
    read_at: string | null;
    created_at: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Props {
    notifications: {
        data: NotificationItem[];
        links: PaginationLink[];
        from: number | null;
        to: number | null;
        total: number;
    };
    stats: {
        total: number;
        unread: number;
        types: Array<{ type: string; count: number }>;
    };
    filters: {
        type: string | null;
        status: string | null;
    };
}

const typeConfig: Record<string, { label: string; icon: typeof Bell; className: string }> = {
    comment: { label: 'Commentaire', icon: MessageSquare, className: 'bg-blue-50 text-blue-700 border-blue-200' },
    form_submission: { label: 'Formulaire', icon: Archive, className: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    backup_completed: { label: 'Backup', icon: ShieldCheck, className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    update_available: { label: 'Mise a jour', icon: AlertTriangle, className: 'bg-amber-50 text-amber-700 border-amber-200' },
    system: { label: 'Systeme', icon: Info, className: 'bg-gray-50 text-gray-700 border-gray-200' },
};

function typeLabel(type: string): string {
    return typeConfig[type]?.label ?? type.replaceAll('_', ' ');
}

export default function NotificationsIndex({ notifications, stats, filters }: Props) {
    const { cms } = usePage<SharedProps>().props;
    const prefix = cms?.adminPrefix ?? 'admin';
    const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '';

    const request = async (url: string, method: 'POST' | 'DELETE') => {
        await fetch(url, {
            method,
            headers: {
                'X-CSRF-TOKEN': csrfToken,
                Accept: 'application/json',
            },
        });
        router.reload();
    };

    const filterUrl = (params: Record<string, string | null>) => {
        const search = new URLSearchParams();
        const next = { ...filters, ...params };

        if (next.status) search.set('status', next.status);
        if (next.type) search.set('type', next.type);

        const qs = search.toString();
        return `/${prefix}/notifications${qs ? `?${qs}` : ''}`;
    };

    return (
        <AdminLayout
            header={
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
                        <Bell className="h-5 w-5" />
                        Notifications
                    </h1>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            disabled={stats.unread === 0}
                            onClick={() => request(`/${prefix}/notifications/read-all`, 'POST')}
                        >
                            <CheckCheck className="mr-2 h-4 w-4" />
                            Tout lire
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => request(`/${prefix}/notifications/read`, 'DELETE')}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Nettoyer lues
                        </Button>
                    </div>
                </div>
            }
        >
            <Head title="Notifications" />

            <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-3">
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-xs text-gray-500">Total</p>
                            <p className="mt-1 text-2xl font-semibold text-gray-900">{stats.total}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-xs text-gray-500">Non lues</p>
                            <p className="mt-1 text-2xl font-semibold text-amber-600">{stats.unread}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-xs text-gray-500">Types</p>
                            <p className="mt-1 text-2xl font-semibold text-gray-900">{stats.types.length}</p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Filtres</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                        <Link href={filterUrl({ status: null, type: null })}>
                            <Button size="sm" variant={!filters.status && !filters.type ? 'default' : 'outline'}>Toutes</Button>
                        </Link>
                        <Link href={filterUrl({ status: 'unread' })}>
                            <Button size="sm" variant={filters.status === 'unread' ? 'default' : 'outline'}>Non lues</Button>
                        </Link>
                        <Link href={filterUrl({ status: 'read' })}>
                            <Button size="sm" variant={filters.status === 'read' ? 'default' : 'outline'}>Lues</Button>
                        </Link>
                        {stats.types.map((item) => (
                            <Link key={item.type} href={filterUrl({ type: item.type })}>
                                <Button size="sm" variant={filters.type === item.type ? 'default' : 'outline'}>
                                    {typeLabel(item.type)} ({item.count})
                                </Button>
                            </Link>
                        ))}
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-0">
                        {notifications.data.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-14 text-center">
                                <Bell className="mb-3 h-10 w-10 text-gray-300" />
                                <p className="text-sm font-medium text-gray-500">Aucune notification</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {notifications.data.map((notification) => {
                                    const config = typeConfig[notification.type] ?? typeConfig.system;
                                    const Icon = config.icon;

                                    return (
                                        <div
                                            key={notification.id}
                                            className={`flex gap-4 p-4 ${notification.read_at ? 'bg-white' : 'bg-amber-50/30'}`}
                                        >
                                            <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                                                <Icon className="h-4 w-4 text-gray-600" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="font-medium text-gray-900">{notification.title}</p>
                                                    <Badge variant="outline" className={config.className}>{typeLabel(notification.type)}</Badge>
                                                    {!notification.read_at && <Badge variant="warning">Nouveau</Badge>}
                                                </div>
                                                <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
                                                <p className="mt-2 text-xs text-gray-400">
                                                    {new Date(notification.created_at).toLocaleString('fr-FR')}
                                                </p>
                                            </div>
                                            <div className="flex shrink-0 items-start gap-1">
                                                {!notification.read_at && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        title="Marquer comme lue"
                                                        onClick={() => request(`/${prefix}/notifications/${notification.id}/read`, 'POST')}
                                                    >
                                                        <CheckCheck className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-red-600 hover:text-red-700"
                                                    title="Supprimer"
                                                    onClick={() => request(`/${prefix}/notifications/${notification.id}`, 'DELETE')}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {notifications.links.length > 3 && (
                    <div className="flex flex-wrap justify-center gap-2">
                        {notifications.links.map((link, index) => (
                            link.url ? (
                                <Link key={`${link.label}-${index}`} href={link.url}>
                                    <Button
                                        size="sm"
                                        variant={link.active ? 'default' : 'outline'}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                </Link>
                            ) : (
                                <Button
                                    key={`${link.label}-${index}`}
                                    size="sm"
                                    variant="outline"
                                    disabled
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            )
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
