import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Card, CardContent } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { FileText, Plus, Eye, Settings, Trash2, BarChart2 } from 'lucide-react';

interface Form {
    id: number;
    name: string;
    slug: string;
    is_active: boolean;
    submissions_count: number;
    created_at: string;
}

interface Props {
    forms: Form[];
}

export default function FormsIndex({ forms }: Props) {
    const handleDelete = (id: number, name: string) => {
        if (!confirm(`Supprimer le formulaire "${name}" ? Toutes les soumissions seront perdues.`)) return;
        router.delete(`/admin/forms/${id}`);
    };

    return (
        <AdminLayout
            header={
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Formulaires
                    </h1>
                    <Link href="/admin/forms/create">
                        <Button size="sm" className="gap-1.5">
                            <Plus className="h-4 w-4" />
                            Nouveau formulaire
                        </Button>
                    </Link>
                </div>
            }
        >
            <Head title="Formulaires" />

            <div className="space-y-3">
                {forms.map(form => (
                    <Card key={form.id}>
                        <CardContent className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
                                    <FileText className="h-4 w-4 text-indigo-600" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium text-gray-900">{form.name}</p>
                                        <Badge variant="outline" className={`text-xs ${form.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-500'}`}>
                                            {form.is_active ? 'Actif' : 'Inactif'}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-3 mt-0.5">
                                        <span className="text-xs text-gray-500 font-mono">{form.slug}</span>
                                        <span className="text-xs text-gray-400 flex items-center gap-1">
                                            <BarChart2 className="h-3 w-3" />
                                            {form.submissions_count} soumission{form.submissions_count !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Link href={`/admin/forms/${form.id}/submissions`}>
                                    <Button variant="outline" size="sm" title="Voir les soumissions">
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </Link>
                                <Link href={`/admin/forms/${form.id}/edit`}>
                                    <Button variant="outline" size="sm">
                                        <Settings className="h-4 w-4" />
                                    </Button>
                                </Link>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 hover:bg-red-50"
                                    onClick={() => handleDelete(form.id, form.name)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {forms.length === 0 && (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                            <FileText className="h-12 w-12 text-gray-300 mb-4" />
                            <p className="text-gray-500 font-medium">Aucun formulaire</p>
                            <p className="text-sm text-gray-400 mt-1">Créez votre premier formulaire pour collecter des données.</p>
                            <Link href="/admin/forms/create" className="mt-4">
                                <Button size="sm">
                                    <Plus className="h-4 w-4 mr-1" />
                                    Créer un formulaire
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AdminLayout>
    );
}
