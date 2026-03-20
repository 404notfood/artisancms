import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router , usePage } from '@inertiajs/react';
import type { SharedProps } from '@/types/cms';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Plus, Webhook, CheckCircle2, XCircle, Activity } from 'lucide-react';

interface WebhookItem {
    id: number;
    name: string;
    url: string;
    events: string[];
    is_active: boolean;
    last_triggered_at: string | null;
    deliveries_count: number;
}

interface Props {
    webhooks: {
        data: WebhookItem[];
        current_page: number;
        last_page: number;
    };
    availableEvents: string[];
}

export default function WebhooksIndex({ webhooks }: Props) {
    const { cms } = usePage<SharedProps>().props;
    const prefix = cms?.adminPrefix ?? 'admin';
    const handleDelete = (id: number, name: string) => {
        if (!confirm(`Supprimer le webhook "${name}" ?`)) return;
        router.delete(`/admin/webhooks/${id}`);
    };

    const handleToggle = (id: number) => {
        router.patch(`/admin/webhooks/${id}`, {}, { preserveScroll: true });
    };

    return (
        <AdminLayout
            header={
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <Webhook className="h-5 w-5" />
                        Webhooks
                    </h1>
                    <Link href={`/${prefix}/webhooks/create`}>
                        <Button size="sm" className="gap-1.5">
                            <Plus className="h-4 w-4" />
                            Nouveau webhook
                        </Button>
                    </Link>
                </div>
            }
        >
            <Head title="Webhooks" />

            {webhooks.data.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <Webhook className="h-12 w-12 text-gray-300 mb-4" />
                        <p className="text-gray-500 font-medium">Aucun webhook configuré</p>
                        <p className="text-sm text-gray-400 mt-1 mb-4">
                            Les webhooks permettent de notifier des services externes lors d'événements CMS.
                        </p>
                        <Link href={`/${prefix}/webhooks/create`}>
                            <Button size="sm">
                                <Plus className="h-4 w-4 mr-1" />
                                Créer un webhook
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {webhooks.data.map(webhook => (
                        <Card key={webhook.id}>
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-medium text-gray-900">{webhook.name}</h3>
                                            <Badge variant={webhook.is_active ? 'default' : 'secondary'} className="text-xs">
                                                {webhook.is_active ? 'Actif' : 'Inactif'}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-gray-500 font-mono truncate">{webhook.url}</p>
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {webhook.events.slice(0, 5).map(event => (
                                                <Badge key={event} variant="outline" className="text-xs">
                                                    {event}
                                                </Badge>
                                            ))}
                                            {webhook.events.length > 5 && (
                                                <Badge variant="outline" className="text-xs">
                                                    +{webhook.events.length - 5}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                                            <span className="flex items-center gap-1">
                                                <Activity className="h-3 w-3" />
                                                {webhook.deliveries_count} livraisons
                                            </span>
                                            {webhook.last_triggered_at && (
                                                <span>
                                                    Dernier déclenchement : {new Date(webhook.last_triggered_at).toLocaleString('fr-FR')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <Link href={`/admin/webhooks/${webhook.id}/deliveries`}>
                                            <Button variant="outline" size="sm">Livraisons</Button>
                                        </Link>
                                        <Link href={`/admin/webhooks/${webhook.id}/edit`}>
                                            <Button variant="outline" size="sm">Modifier</Button>
                                        </Link>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-red-600 hover:bg-red-50"
                                            onClick={() => handleDelete(webhook.id, webhook.name)}
                                        >
                                            Supprimer
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </AdminLayout>
    );
}
