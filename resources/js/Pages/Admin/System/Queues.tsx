import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';
import { RefreshCw, Trash2, AlertCircle, Inbox, XCircle, CheckCircle } from 'lucide-react';

interface FailedJob {
    id: number;
    uuid: string | null;
    connection: string;
    queue: string;
    payload_short: string;
    exception_short: string;
    failed_at: string;
}

interface QueuesProps {
    driver: string;
    is_database: boolean;
    pending: number;
    failed_count: number;
    failed_jobs: FailedJob[];
}

export default function Queues({ driver, is_database, pending, failed_count, failed_jobs }: QueuesProps) {
    function handleRetry(id: number) {
        if (!confirm('Réessayer ce job ?')) return;
        router.post(`/admin/system/queues/retry/${id}`);
    }

    function handleDelete(id: number) {
        if (!confirm('Supprimer ce job échoué ?')) return;
        router.delete(`/admin/system/queues/delete/${id}`);
    }

    function handleRetryAll() {
        if (!confirm('Réessayer tous les jobs échoués ?')) return;
        router.post('/admin/system/queues/retry-all');
    }

    function handleFlush() {
        if (!confirm('Supprimer tous les jobs échoués ? Cette action est irréversible.')) return;
        router.post('/admin/system/queues/flush');
    }

    if (!is_database) {
        return (
            <AdminLayout
                header={<h1 className="text-xl font-semibold text-gray-900">Files d'attente</h1>}
            >
                <Head title="Queues" />
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <AlertCircle className="mb-3 h-10 w-10 text-amber-400" />
                        <p className="text-sm font-medium text-gray-700">
                            Driver de queue : <Badge variant="secondary">{driver}</Badge>
                        </p>
                        <p className="mt-2 max-w-md text-sm text-gray-500">
                            La gestion des queues est uniquement disponible avec le
                            driver <code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-xs">database</code>.
                            Modifiez <code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-xs">QUEUE_CONNECTION=database</code> dans
                            votre <code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-xs">.env</code>.
                        </p>
                    </CardContent>
                </Card>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout
            header={<h1 className="text-xl font-semibold text-gray-900">Files d'attente</h1>}
        >
            <Head title="Queues" />

            <div className="space-y-6">
                {/* Stats cards */}
                <div className="grid gap-4 sm:grid-cols-2">
                    <Card>
                        <CardContent className="flex items-center gap-4 py-5">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50">
                                <Inbox className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{pending}</p>
                                <p className="text-sm text-gray-500">Jobs en attente</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-4 py-5">
                            <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${failed_count === 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                                {failed_count === 0 ? (
                                    <CheckCircle className="h-6 w-6 text-emerald-600" />
                                ) : (
                                    <XCircle className="h-6 w-6 text-red-600" />
                                )}
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{failed_count}</p>
                                <p className="text-sm text-gray-500">Jobs échoués</p>
                            </div>
                            {failed_count > 0 && (
                                <Badge variant="destructive" className="ml-auto">Attention</Badge>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Failed jobs table */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-base">Jobs échoués</CardTitle>
                        {failed_jobs.length > 0 && (
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={handleRetryAll}>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Tout réessayer
                                </Button>
                                <Button variant="outline" size="sm" onClick={handleFlush} className="text-red-600 hover:text-red-700">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Tout supprimer
                                </Button>
                            </div>
                        )}
                    </CardHeader>
                    <CardContent className="p-0">
                        {failed_jobs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <CheckCircle className="mb-3 h-10 w-10 text-emerald-300" />
                                <p className="text-sm font-medium text-gray-500">Aucun job échoué</p>
                                <p className="mt-1 text-xs text-gray-400">Tout fonctionne correctement</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Job</TableHead>
                                        <TableHead>Queue</TableHead>
                                        <TableHead>Erreur</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {failed_jobs.map((job) => (
                                        <TableRow key={job.id}>
                                            <TableCell className="font-mono text-xs text-gray-500">#{job.id}</TableCell>
                                            <TableCell>
                                                <code className="rounded bg-gray-100 px-2 py-1 text-xs font-mono text-gray-800">{job.payload_short}</code>
                                            </TableCell>
                                            <TableCell><Badge variant="secondary">{job.queue}</Badge></TableCell>
                                            <TableCell className="max-w-xs">
                                                <p className="truncate text-xs text-red-600" title={job.exception_short}>{job.exception_short}</p>
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap text-sm text-gray-500">
                                                {new Date(job.failed_at).toLocaleString('fr-FR')}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button variant="ghost" size="sm" onClick={() => handleRetry(job.id)} title="Réessayer">
                                                        <RefreshCw className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(job.id)} className="text-red-600 hover:text-red-700" title="Supprimer">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
