import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface Submission {
    id: number;
    data: Record<string, unknown>;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string;
    is_read: boolean;
    spam: boolean;
}

interface FormInfo { id: number; name: string; }
interface Props { form: FormInfo; submission: Submission; }

export default function SubmissionsShow({ form, submission }: Props) {
    return (
        <AdminLayout
            header={
                <div className="flex items-center gap-3">
                    <Link href={`/admin/forms/${form.id}/submissions`}>
                        <Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
                    </Link>
                    <h1 className="text-xl font-semibold text-gray-900">Soumission #{submission.id}</h1>
                </div>
            }
        >
            <Head title={`Soumission #${submission.id}`} />

            <div className="max-w-2xl space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Données soumises</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <dl className="space-y-3">
                            {Object.entries(submission.data).map(([key, value]) => (
                                <div key={key} className="grid grid-cols-3 gap-4">
                                    <dt className="text-sm font-medium text-gray-500">{key}</dt>
                                    <dd className="col-span-2 text-sm text-gray-900 break-words">
                                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle className="text-base">Métadonnées</CardTitle></CardHeader>
                    <CardContent>
                        <dl className="space-y-2 text-sm">
                            {[
                                ['Date', submission.created_at],
                                ['Adresse IP', submission.ip_address ?? '—'],
                                ['User-Agent', submission.user_agent ?? '—'],
                                ['Spam', submission.spam ? 'Oui' : 'Non'],
                            ].map(([k, v]) => (
                                <div key={k} className="grid grid-cols-3 gap-4">
                                    <dt className="font-medium text-gray-500">{k}</dt>
                                    <dd className="col-span-2 text-gray-900 font-mono text-xs">{v}</dd>
                                </div>
                            ))}
                        </dl>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
