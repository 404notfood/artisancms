import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router , usePage } from '@inertiajs/react';
import type { SharedProps } from '@/types/cms';
import { FileText, Plus, Eye, Settings, Trash2, BarChart2 } from 'lucide-react';

interface Form {
    id: number;
    name: string;
    slug: string;
    is_active: boolean;
    submissions_count: number;
    created_at: string;
}

interface PaginatedForms {
    data: Form[];
    current_page: number;
    last_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    forms: Form[] | PaginatedForms;
}

function isPageinated(forms: Form[] | PaginatedForms): forms is PaginatedForms {
    return forms !== null && typeof forms === 'object' && !Array.isArray(forms) && 'data' in forms;
}

export default function FormsIndex({ forms: rawForms }: Props) {
    const { cms } = usePage<SharedProps>().props;
    const prefix = cms?.adminPrefix ?? 'admin';
    const forms = isPageinated(rawForms) ? rawForms.data : (Array.isArray(rawForms) ? rawForms : []);
    const pagination = isPageinated(rawForms) ? rawForms : null;

    const handleDelete = (id: number, name: string) => {
        if (!confirm(`Supprimer le formulaire "${name}" ? Toutes les soumissions seront perdues.`)) return;
        router.delete(`/admin/forms/${id}`);
    };

    return (
        <AdminLayout
            header={
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-indigo-600" />
                        Formulaires
                    </h1>
                    <Link
                        href={`/${prefix}/forms/create`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        Nouveau formulaire
                    </Link>
                </div>
            }
        >
            <Head title="Formulaires" />

            {forms.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white px-6 py-20 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
                        <FileText className="h-8 w-8 text-indigo-400" />
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-gray-900">Aucun formulaire</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Creez votre premier formulaire pour collecter des donnees de vos visiteurs.
                    </p>
                    <Link
                        href={`/${prefix}/forms/create`}
                        className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        Creer un formulaire
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="space-y-2">
                        {forms.map((form) => (
                            <div
                                key={form.id}
                                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 hover:shadow-sm transition-shadow"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
                                        <FileText className="h-5 w-5 text-indigo-600" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-semibold text-gray-900 truncate">{form.name}</p>
                                            <span
                                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                                    form.is_active
                                                        ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                                                        : 'bg-gray-100 text-gray-500 ring-1 ring-gray-200'
                                                }`}
                                            >
                                                {form.is_active ? 'Actif' : 'Inactif'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 mt-0.5">
                                            <span className="text-xs text-gray-400 font-mono">{form.slug}</span>
                                            <span className="text-xs text-gray-400 flex items-center gap-1">
                                                <BarChart2 className="h-3 w-3" />
                                                {form.submissions_count} soumission{form.submissions_count !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0 ml-4">
                                    <Link
                                        href={`/admin/forms/${form.id}/submissions`}
                                        className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                        title="Voir les soumissions"
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Link>
                                    <Link
                                        href={`/admin/forms/${form.id}/edit`}
                                        className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                        title="Modifier"
                                    >
                                        <Settings className="h-4 w-4" />
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(form.id, form.name)}
                                        className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                                        title="Supprimer"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {pagination && pagination.last_page > 1 && (
                        <div className="flex items-center justify-center gap-1">
                            {pagination.links.map((link, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    disabled={!link.url || link.active}
                                    onClick={() => link.url && router.get(link.url)}
                                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                                        link.active
                                            ? 'bg-indigo-600 text-white'
                                            : link.url
                                              ? 'text-gray-600 hover:bg-gray-100'
                                              : 'text-gray-300 cursor-not-allowed'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </AdminLayout>
    );
}
