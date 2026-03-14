import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { ArrowLeft, CheckCircle2, XCircle, Clock, RefreshCw } from 'lucide-react';

interface Delivery {
    id: number;
    event: string;
    status: 'pending' | 'success' | 'failed' | 'retrying';
    response_status: number | null;
    duration_ms: number | null;
    attempt: number;
    created_at: string;
    delivered_at: string | null;
    response_body: string | null;
}

interface WebhookData {
    id: number;
    name: string;
    url: string;
}

interface Props {
    webhook: WebhookData;
    deliveries: {
        data: Delivery[];
        current_page: number;
        last_page: number;
    };
}

const statusConfig = {
    success: { label: 'Succès', icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />, badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    failed: { label: 'Échec', icon: <XCircle className="h-4 w-4 text-red-500" />, badge: 'bg-red-50 text-red-700 border-red-200' },
    pending: { label: 'En attente', icon: <Clock className="h-4 w-4 text-gray-400" />, badge: 'bg-gray-50 text-gray-600 border-gray-200' },
    retrying: { label: 'Retry', icon: <RefreshCw className="h-4 w-4 text-amber-500" />, badge: 'bg-amber-50 text-amber-700 border-amber-200' },
};

export default function WebhookDeliveries({ webhook, deliveries }: Props) {
    return (
        <AdminLayout
            header={
                <div className="flex items-center gap-3">
                    <Link href="/admin/webhooks">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900">Livraisons</h1>
                        <p className="text-sm text-gray-500">{webhook.name}</p>
                    </div>
                </div>
            }
        >
            <Head title={`Livraisons : ${webhook.name}`} />

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Journal des livraisons</CardTitle>
                </CardHeader>
                <CardContent>
                    {deliveries.data.length === 0 ? (
                        <p className="text-sm text-gray-400 py-8 text-center">Aucune livraison pour le moment</p>
                    ) : (
                        <div className="space-y-2">
                            {deliveries.data.map(delivery => {
                                const config = statusConfig[delivery.status];
                                return (
                                    <details key={delivery.id} className="border rounded-lg">
                                        <summary className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50">
                                            <div className="flex items-center gap-3">
                                                {config.icon}
                                                <div>
                                                    <span className="text-sm font-medium text-gray-900">{delivery.event}</span>
                                                    <span className="text-xs text-gray-400 ml-2">
                                                        #{delivery.id} · tentative {delivery.attempt}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {delivery.response_status && (
                                                    <span className="text-xs font-mono text-gray-500">
                                                        HTTP {delivery.response_status}
                                                    </span>
                                                )}
                                                {delivery.duration_ms && (
                                                    <span className="text-xs text-gray-400">{delivery.duration_ms}ms</span>
                                                )}
                                                <Badge variant="outline" className={`text-xs ${config.badge}`}>
                                                    {config.label}
                                                </Badge>
                                                <span className="text-xs text-gray-400">
                                                    {new Date(delivery.created_at).toLocaleString('fr-FR')}
                                                </span>
                                            </div>
                                        </summary>
                                        {delivery.response_body && (
                                            <div className="p-3 border-t bg-gray-50">
                                                <p className="text-xs font-medium text-gray-500 mb-1">Réponse :</p>
                                                <pre className="text-xs font-mono text-gray-700 overflow-x-auto max-h-40">
                                                    {delivery.response_body}
                                                </pre>
                                            </div>
                                        )}
                                    </details>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </AdminLayout>
    );
}
