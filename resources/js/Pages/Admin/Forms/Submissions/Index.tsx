import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router , usePage } from '@inertiajs/react';
import type { SharedProps } from '@/types/cms';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { ArrowLeft, Eye, Trash2, Download } from 'lucide-react';

interface Submission {
    id: number;
    data: Record<string, string>;
    ip_address: string | null;
    created_at: string;
    is_read: boolean;
    spam: boolean;
}

interface FormInfo {
    id: number;
    name: string;
}

interface Props {
    form: FormInfo;
    submissions: { data: Submission[]; total: number };
}

export default function SubmissionsIndex({ form, submissions }: Props) {
    const { cms } = usePage<SharedProps>().props;
    const prefix = cms?.adminPrefix ?? 'admin';
    const handleDelete = (id: number) => {
        if (!confirm('Supprimer cette soumission ?')) return;
        router.delete(`/admin/forms/${form.id}/submissions/${id}`);
    };

    return (
        <AdminLayout
            header={
                <div className="flex items-center gap-3">
                    <Link href={`/${prefix}/forms`}>
                        <Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
                    </Link>
                    <h1 className="text-xl font-semibold text-gray-900">
                        Soumissions — {form.name}
                    </h1>
                    <a href={`/admin/forms/${form.id}/submissions/export`}>
                        <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-1" />
                            CSV
                        </Button>
                    </a>
                </div>
            }
        >
            <Head title={`Soumissions : ${form.name}`} />

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">{submissions.total} soumission{submissions.total !== 1 ? 's' : ''}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {submissions.data.length === 0 ? (
                        <div className="py-12 text-center">
                            <p className="text-gray-500">Aucune soumission pour l'instant</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aperçu</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {submissions.data.map(sub => (
                                    <tr key={sub.id} className={`hover:bg-gray-50 ${!sub.is_read ? 'font-medium' : ''}`}>
                                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{sub.created_at}</td>
                                        <td className="px-4 py-3 text-gray-700 max-w-xs truncate">
                                            {Object.entries(sub.data).slice(0, 2).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                                        </td>
                                        <td className="px-4 py-3 text-gray-400 font-mono text-xs">{sub.ip_address}</td>
                                        <td className="px-4 py-3">
                                            {sub.spam ? (
                                                <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">Spam</Badge>
                                            ) : !sub.is_read ? (
                                                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">Nouveau</Badge>
                                            ) : (
                                                <span className="text-xs text-gray-400">Lu</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-1">
                                                <Link href={`/admin/forms/${form.id}/submissions/${sub.id}`}>
                                                    <Button variant="outline" size="sm">
                                                        <Eye className="h-3.5 w-3.5" />
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-red-600 hover:bg-red-50"
                                                    onClick={() => handleDelete(sub.id)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </CardContent>
            </Card>
        </AdminLayout>
    );
}
