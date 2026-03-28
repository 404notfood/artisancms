import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Progress } from '@/Components/ui/progress';
import {
    Cpu, HardDrive, Database, FileText, Image, Users, Clock,
    Server, Layers, Archive,
} from 'lucide-react';

interface PerformanceMetrics {
    php_version: string;
    laravel_version: string;
    memory_limit: string;
    max_execution_time: number;
    disk_free: number;
    disk_total: number;
    disk_used_percent: number;
    db_size: number;
    db_name: string;
    cache_driver: string;
    queue_driver: string;
    session_driver: string;
    counts: {
        pages: number;
        posts: number;
        media: number;
        users: number;
    };
    last_backup: string | null;
}

interface PerformanceProps {
    metrics: PerformanceMetrics;
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function diskStatusColor(percent: number): { text: string; bar: string; bg: string } {
    if (percent < 70) return { text: 'text-emerald-600', bar: 'bg-emerald-500', bg: 'bg-emerald-50' };
    if (percent < 90) return { text: 'text-amber-600', bar: 'bg-amber-500', bg: 'bg-amber-50' };
    return { text: 'text-red-600', bar: 'bg-red-500', bg: 'bg-red-50' };
}

function memoryStatusVariant(limit: string): 'success' | 'warning' | 'destructive' {
    const value = parseInt(limit);
    if (isNaN(value)) return 'secondary' as 'success';
    if (value >= 256) return 'success';
    if (value >= 128) return 'warning';
    return 'destructive';
}

export default function Performance({ metrics }: PerformanceProps) {
    const diskColor = diskStatusColor(metrics.disk_used_percent);

    return (
        <AdminLayout
            header={<h1 className="text-xl font-semibold text-gray-900">Performance</h1>}
        >
            <Head title="Performance" />

            <div className="space-y-6">
                {/* Server info cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardContent className="flex items-center gap-4 py-5">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
                                <Cpu className="h-5 w-5 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">PHP</p>
                                <p className="text-lg font-semibold text-gray-900">{metrics.php_version}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-4 py-5">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
                                <Layers className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Laravel</p>
                                <p className="text-lg font-semibold text-gray-900">{metrics.laravel_version}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-4 py-5">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
                                <Server className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Mémoire PHP</p>
                                <p className="text-lg font-semibold text-gray-900">{metrics.memory_limit}</p>
                            </div>
                            <Badge variant={memoryStatusVariant(metrics.memory_limit)} className="ml-auto">
                                {parseInt(metrics.memory_limit) >= 256 ? 'OK' : parseInt(metrics.memory_limit) >= 128 ? 'Correct' : 'Faible'}
                            </Badge>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-4 py-5">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
                                <Clock className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Max execution</p>
                                <p className="text-lg font-semibold text-gray-900">{metrics.max_execution_time}s</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Disk usage */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <HardDrive className="h-5 w-5 text-gray-400" />
                            Espace disque
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex items-baseline justify-between">
                                <span className={`text-3xl font-bold ${diskColor.text}`}>
                                    {metrics.disk_used_percent}%
                                </span>
                                <span className="text-sm text-gray-500">
                                    {formatBytes(metrics.disk_free)} libre sur {formatBytes(metrics.disk_total)}
                                </span>
                            </div>
                            <div className="relative h-3 w-full overflow-hidden rounded-full bg-gray-200">
                                <div
                                    className={`h-full rounded-full transition-all ${diskColor.bar}`}
                                    style={{ width: `${metrics.disk_used_percent}%` }}
                                />
                            </div>
                            <div className="flex gap-4 text-xs text-gray-500">
                                <span>Utilisé : {formatBytes(metrics.disk_total - metrics.disk_free)}</span>
                                <span>Libre : {formatBytes(metrics.disk_free)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Database + Drivers */}
                <div className="grid gap-4 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Database className="h-5 w-5 text-gray-400" />
                                Base de données
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500">Nom</span>
                                    <code className="rounded bg-gray-100 px-2 py-1 text-xs font-mono">{metrics.db_name}</code>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500">Taille</span>
                                    <span className="text-sm font-medium text-gray-900">{formatBytes(metrics.db_size)}</span>
                                </div>
                                {metrics.last_backup && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500">Dernière sauvegarde</span>
                                        <span className="text-sm text-gray-700">
                                            {new Date(metrics.last_backup).toLocaleString('fr-FR')}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Server className="h-5 w-5 text-gray-400" />
                                Configuration
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {[
                                    { label: 'Cache', value: metrics.cache_driver },
                                    { label: 'Queue', value: metrics.queue_driver },
                                    { label: 'Session', value: metrics.session_driver },
                                ].map((item) => (
                                    <div key={item.label} className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500">{item.label}</span>
                                        <Badge variant="secondary">{item.value}</Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Content counts */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Archive className="h-5 w-5 text-gray-400" />
                            Contenus
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {[
                                { label: 'Pages', value: metrics.counts.pages, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
                                { label: 'Articles', value: metrics.counts.posts, icon: FileText, color: 'text-green-600', bg: 'bg-green-50' },
                                { label: 'Médias', value: metrics.counts.media, icon: Image, color: 'text-purple-600', bg: 'bg-purple-50' },
                                { label: 'Utilisateurs', value: metrics.counts.users, icon: Users, color: 'text-amber-600', bg: 'bg-amber-50' },
                            ].map((item) => {
                                const Icon = item.icon;
                                return (
                                    <div key={item.label} className="flex items-center gap-3 rounded-lg border border-gray-100 p-4">
                                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${item.bg}`}>
                                            <Icon className={`h-5 w-5 ${item.color}`} />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-gray-900">{item.value}</p>
                                            <p className="text-xs text-gray-500">{item.label}</p>
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
