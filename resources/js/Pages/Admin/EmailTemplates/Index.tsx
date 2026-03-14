import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Mail, Edit2, CheckCircle2, XCircle } from 'lucide-react';

interface EmailTemplate {
    id: number;
    slug: string;
    name: string;
    subject: string;
    category: string;
    is_system: boolean;
    enabled: boolean;
    updated_at: string;
}

interface Props {
    templatesByCategory: Record<string, EmailTemplate[]>;
    categories: Record<string, string>;
}

const categoryColors: Record<string, string> = {
    auth: 'bg-blue-50 text-blue-700 border-blue-200',
    notification: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    marketing: 'bg-purple-50 text-purple-700 border-purple-200',
    form: 'bg-orange-50 text-orange-700 border-orange-200',
};

export default function EmailTemplatesIndex({ templatesByCategory, categories }: Props) {
    const allTemplates = Object.values(templatesByCategory).flat();

    return (
        <AdminLayout
            header={
                <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Templates Email
                </h1>
            }
        >
            <Head title="Templates Email" />

            {allTemplates.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <Mail className="h-12 w-12 text-gray-300 mb-4" />
                        <p className="text-gray-500 font-medium">Aucun template email</p>
                        <p className="text-sm text-gray-400 mt-1">Lancez les seeders pour créer les templates par défaut.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-8">
                    {Object.entries(templatesByCategory).map(([category, templates]) => (
                        <div key={category}>
                            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                                {categories[category] ?? category}
                            </h2>
                            <div className="space-y-2">
                                {templates.map(template => (
                                    <Card key={template.id}>
                                        <CardContent className="flex items-center justify-between p-4">
                                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                                                    <Mail className="h-4 w-4 text-gray-500" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium text-gray-900 text-sm">{template.name}</p>
                                                        <Badge variant="outline" className={`text-xs ${categoryColors[template.category] ?? ''}`}>
                                                            {categories[template.category] ?? template.category}
                                                        </Badge>
                                                        {template.is_system && (
                                                            <Badge variant="outline" className="text-xs">Système</Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-500 truncate mt-0.5">{template.subject}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0">
                                                <div className="flex items-center gap-1.5 text-xs">
                                                    {template.enabled ? (
                                                        <>
                                                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                                            <span className="text-emerald-600">Actif</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <XCircle className="h-3.5 w-3.5 text-gray-400" />
                                                            <span className="text-gray-400">Inactif</span>
                                                        </>
                                                    )}
                                                </div>
                                                <Link href={`/admin/email-templates/${template.id}/edit`}>
                                                    <Button variant="outline" size="sm" className="gap-1.5">
                                                        <Edit2 className="h-3.5 w-3.5" />
                                                        Modifier
                                                    </Button>
                                                </Link>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </AdminLayout>
    );
}
