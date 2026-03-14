import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { HardDrive, Download, RotateCcw, Trash2, Plus, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useState } from 'react';

interface Backup {
    id: number;
    filename: string;
    type: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    size: string;
    disk: string;
    created_at: string;
    completed_at: string | null;
    error_message: string | null;
    creator: string | null;
}

interface Stats {
    total_backups: number;
    total_size: number;
    last_backup: string | null;
    failed_count: number;
}

interface Props {
    backups: { data: Backup[]; total: number };
    stats: Stats;
}

const statusConfig = {
    completed: { icon: CheckCircle2, class: 'text-emerald-600', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    failed:    { icon: XCircle,       class: 'text-red-600',     badge: 'bg-red-50 text-red-700 border-red-200' },
    running:   { icon: Clock,         class: 'text-blue-500',    badge: 'bg-blue-50 text-blue-700 border-blue-200' },
    pending:   { icon: Clock,         class: 'text-gray-400',    badge: 'bg-gray-50 text-gray-600 border-gray-200' },
};

const typeLabels: Record<string, string> = { full: 'Complet', database: 'Base de données', media: 'Médias' };

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function BackupsIndex({ backups, stats }: Props) {
    const [creating, setCreating] = useState(false);

    const handleCreate = (type: string) => {
        setCreating(true);
        router.post('/admin/backups', { type }, { onFinish: () => setCreating(false) });
    };

    const handleDelete = (id: number) => {
        if (!confirm('Supprimer ce backup ?')) return;
        router.delete(`/admin/backups/${id}`);
    };

    const handleRestore = (id: number) => {
        if (!confirm('Restaurer ce backup ? L\'état actuel sera écrasé.')) return;
        router.post(`/admin/backups/${id}/restore`);
    };

    return (
        <AdminLayout
            header={
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <HardDrive className="h-5 w-5" />
                        Sauvegardes
                    </h1>
                    <div className="flex gap-2">
                        {(['full', 'database', 'media'] as const).map(type => (
                            <Button
                                key={type}
                                size="sm"
                                variant={type === 'full' ? 'default' : 'outline'}
                                disabled={creating}
                                onClick={() => handleCreate(type)}
                            >
                                <Plus className="h-4 w-4 mr-1" />
                                {typeLabels[type]}
                            </Button>
                        ))}
                    </div>
                </div>
            }
        >
            <Head title="Sauvegardes" />

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
                {[
                    { label: 'Total backups', value: stats.total_backups },
                    { label: 'Espace utilisé', value: formatBytes(stats.total_size) },
                    { label: 'Dernier backup', value: stats.last_backup ?? 'Jamais' },
                    { label: 'Échecs (7j)', value: stats.failed_count, danger: stats.failed_count > 0 },
                ].map(s => (
                    <Card key={s.label}>
                        <CardContent className="p-4">
                            <p className="text-xs text-gray-500">{s.label}</p>
                            <p className={`text-lg font-semibold mt-1 ${s.danger ? 'text-red-600' : 'text-gray-900'}`}>
                                {s.value}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Backup list */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Historique des sauvegardes</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {backups.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <HardDrive className="h-10 w-10 text-gray-300 mb-3" />
                            <p className="text-gray-500">Aucune sauvegarde</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    {['Fichier', 'Type', 'Statut', 'Taille', 'Créé le', 'Actions'].map(h => (
                                        <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {backups.data.map(backup => {
                                    const cfg = statusConfig[backup.status] ?? statusConfig.pending;
                                    const Icon = cfg.icon;
                                    return (
                                        <tr key={backup.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 font-mono text-xs text-gray-700">{backup.filename}</td>
                                            <td className="px-4 py-3">
                                                <Badge variant="outline" className="text-xs">
                                                    {typeLabels[backup.type] ?? backup.type}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant="outline" className={`text-xs flex items-center gap-1 w-fit ${cfg.badge}`}>
                                                    <Icon className={`h-3 w-3 ${cfg.class}`} />
                                                    {backup.status}
                                                </Badge>
                                                {backup.error_message && (
                                                    <p className="text-xs text-red-500 mt-0.5">{backup.error_message}</p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">{backup.size}</td>
                                            <td className="px-4 py-3 text-gray-500">{backup.created_at}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-1">
                                                    {backup.status === 'completed' && (
                                                        <>
                                                            <a href={`/admin/backups/${backup.id}/download`}>
                                                                <Button variant="outline" size="sm" title="Télécharger">
                                                                    <Download className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </a>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                title="Restaurer"
                                                                onClick={() => handleRestore(backup.id)}
                                                            >
                                                                <RotateCcw className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </>
                                                    )}
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-red-600 hover:bg-red-50"
                                                        onClick={() => handleDelete(backup.id)}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </CardContent>
            </Card>
        </AdminLayout>
    );
}
