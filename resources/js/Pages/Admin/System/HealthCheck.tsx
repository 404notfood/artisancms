import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { CheckCircle, XCircle, AlertTriangle, Database, HardDrive, Server, Cpu, Wifi } from 'lucide-react';

interface HealthCheck {
    name: string;
    status: 'ok' | 'warning' | 'error';
    message: string;
    details?: string;
}

interface HealthCheckProps {
    checks: HealthCheck[];
    overall: 'healthy' | 'degraded' | 'unhealthy';
    server: {
        php_version: string;
        laravel_version: string;
        cms_version: string;
        uptime: string;
        memory_usage: string;
    };
}

const STATUS_CONFIG = {
    ok: { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'OK' },
    warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50', label: 'Attention' },
    error: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', label: 'Erreur' },
};

const CHECK_ICONS: Record<string, typeof Database> = {
    database: Database,
    cache: HardDrive,
    storage: HardDrive,
    queue: Server,
    disk: HardDrive,
    php: Cpu,
    network: Wifi,
};

const OVERALL_CONFIG = {
    healthy: { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Système sain' },
    degraded: { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Performances dégradées' },
    unhealthy: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'Problèmes détectés' },
};

export default function HealthCheckPage({ checks, overall, server }: HealthCheckProps) {
    const overallConfig = OVERALL_CONFIG[overall];
    const okCount = checks.filter((c) => c.status === 'ok').length;

    return (
        <AdminLayout
            header={<h1 className="text-xl font-semibold text-gray-900">État du système</h1>}
        >
            <Head title="Health Check" />

            <div className="space-y-6">
                {/* Overall status */}
                <div className={`rounded-lg border ${overallConfig.border} ${overallConfig.bg} p-6`}>
                    <div className="flex items-center gap-4">
                        <div className={`text-4xl font-bold ${overallConfig.color}`}>
                            {okCount}/{checks.length}
                        </div>
                        <div>
                            <p className={`text-lg font-semibold ${overallConfig.color}`}>
                                {overallConfig.label}
                            </p>
                            <p className="text-sm text-gray-600">
                                {okCount} vérification{okCount !== 1 ? 's' : ''} réussie{okCount !== 1 ? 's' : ''} sur {checks.length}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Server info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Informations serveur</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                            {[
                                { label: 'PHP', value: server.php_version },
                                { label: 'Laravel', value: server.laravel_version },
                                { label: 'CMS', value: server.cms_version },
                                { label: 'Uptime', value: server.uptime },
                                { label: 'Mémoire', value: server.memory_usage },
                            ].map((item) => (
                                <div key={item.label} className="text-center rounded-lg bg-gray-50 p-3">
                                    <p className="text-xs text-gray-500">{item.label}</p>
                                    <p className="mt-1 font-mono text-sm font-medium text-gray-900">{item.value}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Checks */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Vérifications</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-gray-100">
                            {checks.map((check, i) => {
                                const config = STATUS_CONFIG[check.status];
                                const StatusIcon = config.icon;
                                const CheckIcon = CHECK_ICONS[check.name.toLowerCase()] ?? Server;

                                return (
                                    <div key={i} className="flex items-center gap-4 px-6 py-4">
                                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${config.bg}`}>
                                            <CheckIcon className={`h-5 w-5 ${config.color}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900">{check.name}</p>
                                            <p className="text-xs text-gray-500">{check.message}</p>
                                            {check.details && (
                                                <p className="mt-0.5 text-xs text-gray-400">{check.details}</p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <StatusIcon className={`h-5 w-5 ${config.color}`} />
                                            <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
