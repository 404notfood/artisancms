import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';
import { Clock, Calendar, AlertCircle } from 'lucide-react';

interface ScheduledTask {
    expression: string;
    command: string;
    next_due_at: string;
    description: string;
}

interface SchedulerProps {
    tasks: ScheduledTask[];
}

export default function Scheduler({ tasks }: SchedulerProps) {
    return (
        <AdminLayout
            header={<h1 className="text-xl font-semibold text-gray-900">Tâches planifiées</h1>}
        >
            <Head title="Scheduler" />

            <div className="space-y-6">
                {/* Summary */}
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-50">
                        <Calendar className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-900">{tasks.length}</p>
                        <p className="text-sm text-gray-500">
                            tâche{tasks.length !== 1 ? 's' : ''} planifiée{tasks.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>

                {/* Tasks table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Liste des tâches</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {tasks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <AlertCircle className="mb-3 h-10 w-10 text-gray-300" />
                                <p className="text-sm font-medium text-gray-500">Aucune tâche planifiée</p>
                                <p className="mt-1 text-xs text-gray-400">
                                    Les tâches sont définies dans app/Console/Kernel.php
                                </p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Commande</TableHead>
                                        <TableHead>Expression cron</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Prochaine exécution</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tasks.map((task, i) => (
                                        <TableRow key={i}>
                                            <TableCell>
                                                <code className="rounded bg-gray-100 px-2 py-1 text-xs font-mono text-gray-800">
                                                    {task.command}
                                                </code>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">{task.expression}</Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-600">
                                                {task.description || '—'}
                                            </TableCell>
                                            <TableCell>
                                                {task.next_due_at ? (
                                                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                                                        {task.next_due_at}
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-400">—</span>
                                                )}
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
