import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';

interface RestrictionData {
    id: number;
    restrictable_type: string;
    restrictable_id: number;
    restriction_type: string;
    allowed_roles: string[] | null;
    allowed_plans: number[] | null;
    redirect_url: string | null;
    restricted_message: string | null;
    show_excerpt: boolean;
    active: boolean;
    restrictable: { id: number; title?: string; name?: string } | null;
}

interface PlanData {
    id: number;
    name: string;
}

interface PaginatedRestrictions {
    data: RestrictionData[];
    current_page: number;
    last_page: number;
    total: number;
}

interface RestrictionsIndexProps {
    restrictions: PaginatedRestrictions;
    plans: PlanData[];
}

const TYPE_LABELS: Record<string, string> = {
    logged_in: 'Membres connectes',
    role: 'Par role',
    plan: 'Par plan',
};

const MODEL_LABELS: Record<string, string> = {
    'App\\Models\\Page': 'Page',
    'App\\Models\\Post': 'Article',
};

export default function RestrictionsIndex({ restrictions, plans }: RestrictionsIndexProps) {
    const [showForm, setShowForm] = useState(false);

    const { data, setData, post, processing } = useForm({
        restrictable_type: 'App\\Models\\Page',
        restrictable_id: '' as string | number,
        restriction_type: 'logged_in',
        allowed_roles: [] as string[],
        allowed_plans: [] as number[],
        redirect_url: '',
        restricted_message: '',
        show_excerpt: false,
        active: true,
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/admin/member-space/restrictions', { onSuccess: () => setShowForm(false) });
    }

    function handleDelete(id: number) {
        if (!confirm('Supprimer cette restriction ?')) return;
        router.delete(`/admin/member-space/restrictions/${id}`);
    }

    const inputClass = 'mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';

    return (
        <AdminLayout header={
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold text-gray-900">Restrictions de contenu</h1>
                <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700">
                    <Plus className="h-4 w-4" /> Ajouter
                </button>
            </div>
        }>
            <Head title="Restrictions de contenu" />

            <div className="mx-auto max-w-4xl space-y-6">
                {restrictions.data.length === 0 && !showForm && (
                    <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">
                        Aucune restriction de contenu.
                    </div>
                )}

                {restrictions.data.length > 0 && (
                    <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
                        {restrictions.data.map((r) => (
                            <div key={r.id} className="flex items-center justify-between px-6 py-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                                            {MODEL_LABELS[r.restrictable_type] || r.restrictable_type}
                                        </span>
                                        <span className="font-medium text-gray-900">
                                            {r.restrictable?.title || r.restrictable?.name || `#${r.restrictable_id}`}
                                        </span>
                                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${r.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {r.active ? TYPE_LABELS[r.restriction_type] || r.restriction_type : 'Inactif'}
                                        </span>
                                    </div>
                                    {r.restricted_message && (
                                        <p className="mt-1 text-xs text-gray-500 truncate max-w-md">{r.restricted_message}</p>
                                    )}
                                </div>
                                <button onClick={() => handleDelete(r.id)} className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {showForm && (
                    <form onSubmit={handleSubmit} className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-6 space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900">Nouvelle restriction</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Type de contenu</label>
                                <select value={data.restrictable_type} onChange={(e) => setData('restrictable_type', e.target.value)} className={inputClass}>
                                    <option value="App\\Models\\Page">Page</option>
                                    <option value="App\\Models\\Post">Article</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">ID du contenu</label>
                                <input type="number" value={data.restrictable_id} onChange={(e) => setData('restrictable_id', e.target.value)} className={inputClass} required min={1} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Type de restriction</label>
                            <select value={data.restriction_type} onChange={(e) => setData('restriction_type', e.target.value)} className={inputClass}>
                                <option value="logged_in">Membres connectes</option>
                                <option value="role">Par role</option>
                                <option value="plan">Par plan d'abonnement</option>
                            </select>
                        </div>

                        {data.restriction_type === 'plan' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Plans autorises</label>
                                <div className="mt-1 space-y-1">
                                    {plans.map((plan) => (
                                        <label key={plan.id} className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={data.allowed_plans.includes(plan.id)}
                                                onChange={(e) => {
                                                    setData('allowed_plans', e.target.checked
                                                        ? [...data.allowed_plans, plan.id]
                                                        : data.allowed_plans.filter((id) => id !== plan.id));
                                                }}
                                                className="h-4 w-4 rounded border-gray-300 text-indigo-600"
                                            />
                                            <span className="text-sm text-gray-700">{plan.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Message de restriction</label>
                            <textarea value={data.restricted_message} onChange={(e) => setData('restricted_message', e.target.value)} className={inputClass} rows={2} placeholder="Ce contenu est reserve aux membres." />
                        </div>

                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2">
                                <input type="checkbox" checked={data.show_excerpt} onChange={(e) => setData('show_excerpt', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-indigo-600" />
                                <span className="text-sm text-gray-700">Afficher un extrait</span>
                            </label>
                            <label className="flex items-center gap-2">
                                <input type="checkbox" checked={data.active} onChange={(e) => setData('active', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-indigo-600" />
                                <span className="text-sm text-gray-700">Actif</span>
                            </label>
                        </div>

                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                                Annuler
                            </button>
                            <button type="submit" disabled={processing} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                                {processing ? 'Creation...' : 'Creer'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </AdminLayout>
    );
}
